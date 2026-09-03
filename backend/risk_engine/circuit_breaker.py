"""
ORCA 4.0 Deterministic Safety Circuit Breaker.

This module runs BEFORE the continuous risk engine. If any rule
fires, the breaker returns a forced verdict (e.g. EXTREME DANGER) and
the continuous risk score is suppressed.

The rules are intentionally hard:
  - Cyclone warning               → EXTREME DANGER
  - Wind gust > manufacturer max  → HIGH RISK
  - Wave height > H_crit          → HIGH RISK
  - Inside IMBL                   → HIGH RISK
  - Inside naval zone             → EXTREME DANGER
  - Geofence violation (naval)    → EXTREME DANGER
  - Data quality insufficient     → INSUFFICIENT_CURRENT_DATA

Every override carries:
  rule_id
  rule_description
  input_value
  threshold
  source
  timestamp

The LLM / nlg layer is downstream and may only rephrase the verdict
in plain language. It cannot change the score.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from risk_engine.state import EnvironmentalState
from risk_engine.vessel import VesselProfile


@dataclass
class CircuitBreakerHit:
    rule_id: str
    rule_description: str
    input_value: Any
    threshold: Any
    source: str
    timestamp: float = field(default_factory=time.time)


@dataclass
class CircuitBreakerResult:
    triggered: bool
    hits: List[CircuitBreakerHit] = field(default_factory=list)
    forced_label: Optional[str] = None
    data_quality_insufficient: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "triggered": self.triggered,
            "hits": [h.__dict__ for h in self.hits],
            "forced_label": self.forced_label,
            "data_quality_insufficient": self.data_quality_insufficient,
        }


def evaluate_circuit_breaker(
    state: EnvironmentalState,
    vessel: VesselProfile,
    alerts: Optional[Dict[str, Any]] = None,
    geofence: Optional[Dict[str, Any]] = None,
) -> CircuitBreakerResult:
    """Apply every deterministic safety rule in priority order. Returns
    the first EXTREME DANGER hit, otherwise collects all HIGH RISK
    hits. The verdict label is forced to EXTREME DANGER, HIGH RISK, or
    PROCEED WITH CAUTION based on hits."""

    result = CircuitBreakerResult(triggered=False)

    # 0. Data quality gate ------------------------------------------------
    if state.data_quality_score() < 0.5 or len(state.unavailable_parameters()) > 4:
        result.data_quality_insufficient = True
        result.hits.append(
            CircuitBreakerHit(
                rule_id="CB-DQ-001",
                rule_description=(
                    "Live data quality insufficient. The risk engine cannot "
                    "produce a defensible verdict with this many unavailable "
                    "parameters."
                ),
                input_value={
                    "data_quality_score": state.data_quality_score(),
                    "unavailable_count": len(state.unavailable_parameters()),
                },
                threshold={"min_quality": 0.5, "max_unavailable": 4},
                source="risk_engine.state.EnvironmentalState",
            )
        )
        result.triggered = True
        result.forced_label = "INSUFFICIENT_CURRENT_DATA"
        return result

    # 1. Cyclone / official cyclone alert --------------------------------
    if alerts:
        if alerts.get("has_active_cyclone_alert") is True:
            result.hits.append(
                CircuitBreakerHit(
                    rule_id="CB-CYC-001",
                    rule_description="Official cyclone warning issued for this sector.",
                    input_value=alerts.get("cyclone_name") or "ACTIVE",
                    threshold="any",
                    source=str(alerts.get("issuing_agency") or "advisory feed"),
                )
            )
            result.triggered = True
            result.forced_label = "EXTREME_DANGER_CYCLONE"
        if alerts.get("port_danger_signal") is not None and alerts.get("port_danger_signal") >= 7:
            result.hits.append(
                CircuitBreakerHit(
                    rule_id="CB-CYC-002",
                    rule_description="Port Danger Signal >= 7 — vessels must remain in harbour.",
                    input_value=alerts.get("port_danger_signal"),
                    threshold=7,
                    source=str(alerts.get("issuing_agency") or "advisory feed"),
                )
            )
            result.triggered = True
            if not result.forced_label:
                result.forced_label = "EXTREME_DANGER"

    # 2. Geofence violations ---------------------------------------------
    if geofence:
        if geofence.get("inside_naval_zone_violation") is True:
            result.hits.append(
                CircuitBreakerHit(
                    rule_id="CB-GEO-001",
                    rule_description="Vessel is inside a naval restricted zone.",
                    input_value=geofence.get("dist_to_naval_zone_km"),
                    threshold=0.0,
                    source="geofence_service",
                )
            )
            result.triggered = True
            result.forced_label = "EXTREME_DANGER"
        if geofence.get("inside_imbl_buffer_warning") is True:
            result.hits.append(
                CircuitBreakerHit(
                    rule_id="CB-GEO-002",
                    rule_description="Vessel is inside the 10 km IMBL buffer.",
                    input_value=geofence.get("dist_to_imbl_km"),
                    threshold=10.0,
                    source="geofence_service",
                )
            )
            result.triggered = True
            if result.forced_label not in ("EXTREME_DANGER", "EXTREME_DANGER_CYCLONE"):
                result.forced_label = "HIGH_RISK_IMBL"

    # 3. Manufacturer hard limits ----------------------------------------
    # NOTE: wind_gust is reported in m/s by every provider; the
    # vessel's max_manufacturer_wind_kmh is in km/h. Convert.
    gust = state.value("wind_gust")
    if gust is not None and (gust * 3.6) > vessel.max_manufacturer_wind_kmh:
        result.hits.append(
            CircuitBreakerHit(
                rule_id="CB-WND-001",
                rule_description="Wind gust exceeds the vessel's manufacturer maximum wind.",
                input_value=gust,
                threshold=vessel.max_manufacturer_wind_kmh / 3.6,
                source="vessel.max_manufacturer_wind_kmh",
            )
        )
        result.triggered = True
        if not result.forced_label:
            result.forced_label = "HIGH_RISK_GUST"

    hs = state.value("wave_height")
    if hs is not None and hs > vessel.max_safe_wave_height_m:
        result.hits.append(
            CircuitBreakerHit(
                rule_id="CB-WAV-001",
                rule_description="Significant wave height exceeds the capsize threshold for this vessel.",
                input_value=hs,
                threshold=round(vessel.max_safe_wave_height_m, 2),
                source="vessel.max_safe_wave_height_m",
            )
        )
        result.triggered = True
        if not result.forced_label:
            result.forced_label = "HIGH_RISK_CAPSIZE"

    return result
