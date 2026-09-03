"""
ORCA 4.0 Maritime Risk Engine pipeline (assess-now).

A self-contained pipeline that:
  1. fetches canonical data via the multi-source data layer
  2. assembles the EnvironmentalState + freshness classification
  3. builds a VesselProfile (or accepts one)
  4. runs the deterministic safety circuit breaker
  5. computes the ORCA Maritime Safety Risk Index
  6. computes the route risk if a route was provided
  7. stores an immutable input snapshot for replay
  8. returns a single serialisable dict

The result includes the full contribution breakdown so the frontend
can render the equation that produced the score.
"""

from __future__ import annotations

import logging
import time
from typing import Any, Dict, List, Optional, Tuple

from data_providers.orchestrator import build_canonical_report
from risk_engine import (
    EnvironmentalState,
    VesselProfile,
    build_environmental_state,
    compute_risk,
    compute_route_risk,
)
from risk_engine.replay import assessment_store
from services.alerts_service import alerts_service
from services.geofence_service import geofence_service
from utils.h3_spatial import haversine_distance_km


log = logging.getLogger("orca.assess_now")


def _default_vessel(length_m: float, heading_deg: float = 0.0) -> VesselProfile:
    from risk_engine.vessel import default_craft_profile
    return default_craft_profile(length_m=length_m, heading_deg=heading_deg)


async def assess_now(
    latitude: float,
    longitude: float,
    vessel_length_m: float = 8.5,
    vessel_heading_deg: float = 0.0,
    language: str = "Marathi",
    waypoints: Optional[List[Tuple[float, float]]] = None,
    speed_kn: float = 8.0,
    query_text: Optional[str] = None,
    assessment_id_hint: Optional[str] = None,
) -> Dict[str, Any]:
    t0 = time.time()
    # 1. Canonical data
    canonical = await build_canonical_report(latitude, longitude)
    state = build_environmental_state(latitude, longitude, canonical)

    # 2. Vessel digital twin
    vessel = _default_vessel(vessel_length_m, vessel_heading_deg)

    # 3. Alerts + geofence (synchronous, sub-ms)
    alerts = await alerts_service.check_active_alerts(latitude, longitude)
    geofence = geofence_service.inspect_coordinates(latitude, longitude)

    # 4. Risk engine
    result = compute_risk(state, vessel, alerts=alerts, geofence=geofence)

    # 5. Optional route risk
    route_block: Optional[Dict[str, Any]] = None
    if waypoints and len(waypoints) >= 2:
        # Set the vessel's cruising speed to the user-provided value
        vessel.cruising_speed_kn = speed_kn
        vessel.heading_deg = vessel_heading_deg
        route = await compute_route_risk(waypoints, vessel, speed_kn=speed_kn)
        route_block = route.to_dict()

    # 6. Persist for replay
    assessment_id = assessment_store.save(
        canonical=canonical,
        vessel=vessel,
        result=result,
        alerts=alerts,
        geofence=geofence,
        route={"waypoints": waypoints} if waypoints else None,
        extra={"language": language, "query_text": query_text},
    )
    if assessment_id_hint:
        # Operator may request a custom id (e.g. for E2E test reproducibility)
        # — the deterministic id is what is stored.
        pass

    # 7. Public response
    return {
        "assessment_id": assessment_id,
        "timestamp_utc": time.time(),
        "requested_coordinate": {"lat": latitude, "lon": longitude},
        "language": language,
        "risk": result.to_dict(),
        "vessel_profile": vessel.to_dict(),
        "environmental_state": {
            "coordinate": state.coordinate,
            "freshness_summary": state.freshness_summary(),
            "data_quality_score": state.data_quality_score(),
            "unavailable_parameters": state.unavailable_parameters(),
            "variables": {
                k: {
                    "value": v.value,
                    "unit": v.unit,
                    "freshness": v.freshness,
                    "data_type": v.data_type,
                    "state": v.state,
                    "source": v.source,
                    "source_id": v.source_id,
                    "dataset": v.dataset,
                    "observed_at": v.observed_at,
                    "distance_km": v.distance_km,
                    "quality": v.quality,
                    "confidence": v.confidence,
                    "notes": v.notes,
                }
                for k, v in state.variables.items()
            },
        },
        "alerts": alerts,
        "geofence": geofence,
        "route": route_block,
        "execution_ms": round((time.time() - t0) * 1000, 1),
    }


def replay(assessment_id: str) -> Optional[Dict[str, Any]]:
    """Return the stored snapshot for an assessment. None if the id is
    unknown. Used by the GET /assessments/{id} endpoint."""
    return assessment_store.get(assessment_id)


def recent(limit: int = 20) -> List[Dict[str, Any]]:
    return assessment_store.recent(limit)
