"""
ORCA 4.0 Maritime Risk Engine — EnvironmentalState assembly.

The EnvironmentalState is the authoritative, immutable input to the
maritime safety risk engine. It contains only the values that are
actually available, plus a per-field freshness classification and a
geographic-correctness note.

Crucially, no risk score, no advice, and no verdict is generated from
this module. It only normalizes provider output.

Freshness policy (per parameter):
  CURRENT       age <= freshness_limit
  RECENT        freshness_limit < age <= 2 * freshness_limit
  STALE         age > 2 * freshness_limit
  UNAVAILABLE   no value
"""

from __future__ import annotations

import math
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from data_providers.canonical import (
    CanonicalRecord,
    FRESHNESS_LIMITS,
    OBSERVED,
    NEAR_REAL_TIME,
    NOWCAST,
    FORECAST,
    MODEL,
    SATELLITE,
    BUOY,
    STATION,
    UNAVAILABLE,
)


CURRENT = "CURRENT"
RECENT = "RECENT"
STALE = "STALE"
UNAVAILABLE = "UNAVAILABLE"


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    to_rad = math.radians
    dlat = to_rad(lat2 - lat1)
    dlon = to_rad(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(to_rad(lat1)) * math.cos(to_rad(lat2)) * math.sin(dlon / 2) ** 2
    )
    return 2 * R * math.asin(min(1.0, math.sqrt(a)))


def classify_freshness(parameter: str, observation_time: Optional[float]) -> str:
    """Return one of CURRENT/RECENT/STALE/UNAVAILABLE."""
    if observation_time is None or observation_time <= 0:
        return UNAVAILABLE
    limit = FRESHNESS_LIMITS.get(parameter, 24 * 3600)
    age = time.time() - observation_time
    if age <= limit:
        return CURRENT
    if age <= 2 * limit:
        return RECENT
    return STALE


@dataclass
class EnvVar:
    parameter: str
    value: Optional[float]
    unit: str
    freshness: str           # CURRENT | RECENT | STALE | UNAVAILABLE
    data_type: str           # OBSERVATION | MODEL | FORECAST | SATELLITE
    state: str               # original CanonicalRecord.state
    source: str
    source_id: str
    dataset: str
    observed_at: Optional[float]
    valid_from: Optional[float]
    valid_until: Optional[float]
    retrieved_at: float
    spatial_resolution: str
    temporal_resolution: str
    distance_km: Optional[float]
    quality: str
    confidence: float
    notes: str = ""

    @property
    def is_available(self) -> bool:
        return self.value is not None and self.freshness in (CURRENT, RECENT)

    @property
    def age_seconds(self) -> Optional[float]:
        if self.observed_at is None:
            return None
        return time.time() - self.observed_at


@dataclass
class EnvironmentalState:
    """The authoritative input to the risk engine."""

    coordinate: Dict[str, float]
    timestamp_utc: float
    requested_at: float
    variables: Dict[str, EnvVar] = field(default_factory=dict)

    # --- Convenience accessors ------------------------------------------
    def get(self, parameter: str) -> Optional[EnvVar]:
        return self.variables.get(parameter)

    def value(self, parameter: str) -> Optional[float]:
        v = self.variables.get(parameter)
        return v.value if v is not None else None

    def is_available(self, parameter: str) -> bool:
        v = self.variables.get(parameter)
        return v is not None and v.is_available

    def unavailable_parameters(self) -> List[str]:
        """Parameters the engine was supposed to use but had no live
        data for. Used by the safety circuit breaker to refuse a
        false-safe verdict."""
        return [p for p, v in self.variables.items() if v.value is None or v.freshness == UNAVAILABLE]

    def freshness_summary(self) -> Dict[str, int]:
        out: Dict[str, int] = {CURRENT: 0, RECENT: 0, STALE: 0, UNAVAILABLE: 0}
        for v in self.variables.values():
            out[v.freshness] = out.get(v.freshness, 0) + 1
        return out

    def data_quality_score(self) -> float:
        """Composite 0-1 quality score based on freshness, confidence,
        and availability. Returns 0 if anything required is missing."""
        if not self.variables:
            return 0.0
        weights_total = 0.0
        score = 0.0
        for v in self.variables.values():
            w = 1.0
            if v.freshness == CURRENT:
                w = 1.0
            elif v.freshness == RECENT:
                w = 0.7
            elif v.freshness == STALE:
                w = 0.3
            else:
                w = 0.0
            weights_total += 1.0
            score += w * (v.confidence if v.is_available else 0.0)
        return round(score / max(weights_total, 1.0), 3)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "coordinate": self.coordinate,
            "timestamp_utc": self.timestamp_utc,
            "requested_at": self.requested_at,
            "freshness_summary": self.freshness_summary(),
            "data_quality_score": self.data_quality_score(),
            "unavailable_parameters": self.unavailable_parameters(),
            "variables": {k: v.__dict__ for k, v in self.variables.items()},
        }


# --------------------------------------------------------------------------- #
# Spatial normalization helpers                                                #
# --------------------------------------------------------------------------- #


def nearest_ndbc_station(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    """Find the closest NDBC station registered in providers/registry.py.
    Returns station metadata + distance, or None if no station within
    1500 km."""
    from providers.registry import NDBC_STATIONS

    best = None
    for st, slat, slon in NDBC_STATIONS:
        d = _haversine_km(lat, lon, slat, slon)
        if best is None or d < best["distance_km"]:
            best = {
                "station_id": st,
                "latitude": slat,
                "longitude": slon,
                "distance_km": d,
            }
    if best and best["distance_km"] > 1500.0:
        return None
    return best


# --------------------------------------------------------------------------- #
# Builder from canonical records                                                #
# --------------------------------------------------------------------------- #


def build_environmental_state(
    lat: float,
    lon: float,
    canonical: Dict[str, CanonicalRecord],
) -> EnvironmentalState:
    """Assemble a typed EnvironmentalState from a canonical map."""
    now = time.time()
    vars_out: Dict[str, EnvVar] = {}
    for param, rec in canonical.items():
        freshness = classify_freshness(param, rec.observation_time)
        vars_out[param] = EnvVar(
            parameter=param,
            value=rec.value,
            unit=rec.unit or "",
            freshness=freshness,
            data_type=rec.data_type or "UNKNOWN",
            state=rec.state or UNAVAILABLE,
            source=rec.source,
            source_id=rec.source_id,
            dataset=rec.dataset,
            observed_at=rec.observation_time,
            valid_from=rec.observation_time,
            valid_until=rec.observation_time,
            retrieved_at=rec.retrieved_at or now,
            spatial_resolution=rec.spatial_resolution,
            temporal_resolution=rec.temporal_resolution,
            distance_km=rec.distance_from_requested_km,
            quality=rec.quality,
            confidence=rec.confidence,
            notes=rec.notes,
        )
    return EnvironmentalState(
        coordinate={"lat": lat, "lon": lon},
        timestamp_utc=now,
        requested_at=now,
        variables=vars_out,
    )
