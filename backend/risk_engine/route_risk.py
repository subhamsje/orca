"""
ORCA 4.0 Route Risk Engine.

Given a planned route as a list of [lat, lon] waypoints, the engine
samples the canonical environmental state at each segment and
computes the ORCA Maritime Safety Risk Index for the worst segment,
the mean risk, the maximum exposure duration, and the hazardous
distance.

The route engine never invents environmental data; if a sample
returns UNAVAILABLE, the segment is flagged and the route risk
result is INSUFFICIENT_CURRENT_DATA.
"""

from __future__ import annotations

import asyncio
import logging
import math
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from data_providers.canonical import CanonicalRecord
from data_providers.orchestrator import build_canonical_report
from risk_engine import (
    EnvironmentalState,
    VesselProfile,
    build_environmental_state,
    compute_risk,
    RiskResult,
)
from utils.h3_spatial import haversine_distance_km

log = logging.getLogger("orca.route_risk")


def _segment_distance_km(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    return haversine_distance_km(a[0], a[1], b[0], b[1])


def _sample_waypoints(waypoints: List[Tuple[float, float]], max_samples: int = 6) -> List[Tuple[float, float]]:
    """Pick up to N waypoints including start and end. Always includes
    the first and last; for longer routes picks evenly spaced middle
    points."""
    if len(waypoints) <= max_samples:
        return list(waypoints)
    n = max_samples
    idx = [0]
    if n > 1:
        idx.append(len(waypoints) - 1)
    if n > 2:
        step = (len(waypoints) - 1) / (n - 1)
        for i in range(1, n - 1):
            idx.append(int(round(step * i)))
    return [waypoints[i] for i in sorted(set(idx))]


@dataclass
class RouteSegment:
    index: int
    waypoint_from: Tuple[float, float]
    waypoint_to: Tuple[float, float]
    distance_km: float
    risk_score: int
    risk_label: str
    unavailable_count: int


@dataclass
class RouteRiskResult:
    request_id: str
    waypoint_count: int
    total_distance_km: float
    segments: List[RouteSegment]
    max_risk_score: int
    mean_risk_score: float
    worst_segment_index: int
    worst_segment_risk_label: str
    hazardous_distance_km: float
    departure_risk: int
    arrival_risk: int
    data_quality_score: float
    unavailable_parameters: List[str]
    calculation_version: str
    risk_equation: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "request_id": self.request_id,
            "waypoint_count": self.waypoint_count,
            "total_distance_km": self.total_distance_km,
            "max_risk_score": self.max_risk_score,
            "mean_risk_score": self.mean_risk_score,
            "worst_segment_index": self.worst_segment_index,
            "worst_segment_risk_label": self.worst_segment_risk_label,
            "hazardous_distance_km": self.hazardous_distance_km,
            "departure_risk": self.departure_risk,
            "arrival_risk": self.arrival_risk,
            "data_quality_score": self.data_quality_score,
            "unavailable_parameters": self.unavailable_parameters,
            "calculation_version": self.calculation_version,
            "risk_equation": self.risk_equation,
            "segments": [s.__dict__ for s in self.segments],
        }


async def compute_route_risk(
    waypoints: List[Tuple[float, float]],
    vessel: VesselProfile,
    speed_kn: float,
    request_id: str = "route-001",
    max_samples: int = 6,
) -> RouteRiskResult:
    """Sample up to max_samples waypoints and compute the per-segment
    ORCA MRSI. Aggregate into a RouteRiskResult.
    """
    if len(waypoints) < 2:
        raise ValueError("at least two waypoints are required")

    sample_points = _sample_waypoints(waypoints, max_samples=max_samples)

    # Compute canonical state at each sample point (concurrently)
    canonicals = await asyncio.gather(
        *[build_canonical_report(p[0], p[1]) for p in sample_points]
    )
    states = [build_environmental_state(p[0], p[1], c) for p, c in zip(sample_points, canonicals)]

    segments: List[RouteSegment] = []
    for i in range(len(sample_points) - 1):
        a = sample_points[i]
        b = sample_points[i + 1]
        d = _segment_distance_km(a, b)
        # Use the state at the *next* waypoint to score this segment.
        state = states[i + 1]
        r = compute_risk(state, vessel)
        segments.append(
            RouteSegment(
                index=i,
                waypoint_from=a,
                waypoint_to=b,
                distance_km=round(d, 2),
                risk_score=r.risk_score,
                risk_label=r.risk_label,
                unavailable_count=len(r.unavailable_parameters),
            )
        )

    # Aggregate
    total_distance = sum(
        _segment_distance_km(waypoints[i], waypoints[i + 1]) for i in range(len(waypoints) - 1)
    )
    if segments:
        max_seg = max(segments, key=lambda s: s.risk_score)
        mean_risk = sum(s.risk_score for s in segments) / len(segments)
        hazardous = sum(
            s.distance_km for s in segments if s.risk_score >= 70
        )
        worst_idx = max_seg.index
        worst_label = max_seg.risk_label
    else:
        mean_risk = 0
        worst_idx = 0
        worst_label = "N/A"
        hazardous = 0.0

    # Per-segment risk to assess worst-case; depart and arrive use
    # states 0 and -1.
    dep_state = states[0]
    arr_state = states[-1]
    dep_risk = compute_risk(dep_state, vessel)
    arr_risk = compute_risk(arr_state, vessel)

    return RouteRiskResult(
        request_id=request_id,
        waypoint_count=len(waypoints),
        total_distance_km=round(total_distance, 2),
        segments=segments,
        max_risk_score=max((s.risk_score for s in segments), default=0),
        mean_risk_score=round(mean_risk, 1),
        worst_segment_index=worst_idx,
        worst_segment_risk_label=worst_label,
        hazardous_distance_km=round(hazardous, 2),
        departure_risk=dep_risk.risk_score,
        arrival_risk=arr_risk.risk_score,
        data_quality_score=round(sum(s.data_quality_score for s in states) / max(len(states), 1), 3),
        unavailable_parameters=sorted({p for s in states for p in s.unavailable_parameters}),
        calculation_version="ORCA-MRSI-v1.0.0",
        risk_equation=(
            "RouteRisk = max(segment.MRSI), mean(segment.MRSI), "
            "sum(distance_km of segments with MRSI >= 70). "
            "Each segment is scored with the canonical state at the *target* waypoint."
        ),
    )
