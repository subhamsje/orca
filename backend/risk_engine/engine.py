"""
ORCA 4.0 Continuous Maritime Safety Risk Engine.

The engine produces an ORCA Maritime Safety Risk Index in [0, 100]
(0 = no known risk, 100 = maximum modeled risk). It is NOT a probability
of capsize; it is a hazard-weighted additive score normalized to 0-100.

Design rules:
  - Monotonicity: increasing any single hazard cannot decrease the
    final score. (Cross-terms can only add risk.)
  - Reproducibility: given the same EnvironmentalState + VesselProfile
    + alerts + geofence, the result is bit-identical.
  - Reconcilable: each component is exposed as a number; the total is
    the sum of components (clamped at 100). The frontend can therefore
    render "wave +18, wind +12, ..." that adds up to the displayed
    total.
  - Defensive: when data is insufficient, the engine returns
    INSUFFICIENT_CURRENT_DATA rather than a fabricated low number.
"""

from __future__ import annotations

import math
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from risk_engine.state import EnvironmentalState
from risk_engine.vessel import VesselProfile
from risk_engine.hazards import (
    wave_height_hazard,
    wind_hazard,
    gust_hazard,
    current_hazard,
    visibility_hazard,
    pressure_hazard,
    precipitation_hazard,
    wave_vessel_interaction_hazard,
    official_warning_hazard,
)
from risk_engine.circuit_breaker import (
    CircuitBreakerResult,
    evaluate_circuit_breaker,
)


# Hazard weights (configurable, version-controlled, sum to 1.0).
WEIGHTS = {
    "wave_height": 0.18,
    "wave_vessel_interaction": 0.18,
    "wind": 0.12,
    "gust": 0.10,
    "current": 0.08,
    "visibility": 0.08,
    "pressure": 0.10,
    "precipitation": 0.06,
    "official_warning": 0.10,
}
assert abs(sum(WEIGHTS.values()) - 1.0) < 1e-9, "WEIGHTS must sum to 1.0"


@dataclass
class RiskComponent:
    name: str
    score: float               # 0..1
    weighted_contribution: float  # score * weight, 0..1
    details: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RiskResult:
    risk_score: int            # 0..100 (clamped)
    risk_label: str            # SAFE | CAUTION | HIGH | EXTREME | INSUFFICIENT
    risk_uncertainty: float    # 0..1
    data_confidence: float     # 0..1
    components: List[RiskComponent]
    circuit_breaker: CircuitBreakerResult
    data_quality_score: float
    unavailable_parameters: List[str]
    calculation_version: str
    configuration_version: str
    risk_equation: str
    raw_score_before_cb: int = 0   # score before any CB override (for reconciliation)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "risk_score": self.risk_score,
            "risk_label": self.risk_label,
            "risk_uncertainty": self.risk_uncertainty,
            "data_confidence": self.data_confidence,
            "components": [c.__dict__ for c in self.components],
            "circuit_breaker": self.circuit_breaker.to_dict(),
            "data_quality_score": self.data_quality_score,
            "unavailable_parameters": self.unavailable_parameters,
            "calculation_version": self.calculation_version,
            "configuration_version": self.configuration_version,
            "risk_equation": self.risk_equation,
            "raw_score_before_cb": self.raw_score_before_cb,
        }


CALCULATION_VERSION = "ORCA-MRSI-v1.0.0"
CONFIGURATION_VERSION = "ORCA-WEIGHTS-v1.0.0"
RISK_EQUATION_DOC = (
    "ORCA_MRSI = clamp_0_100( 100 * sum_i( weight_i * hazard_i ) ) "
    "where hazard_i is each maritime hazard in [0,1] and the sum of "
    "weights is 1.0.  Circuit-breaker hits suppress the score with a "
    "forced verdict (EXTREME_DANGER / HIGH_RISK / INSUFFICIENT)."
)


def _label_for(score: int) -> str:
    if score < 20:
        return "SAFE"
    if score < 40:
        return "PROCEED_WITH_CAUTION"
    if score < 70:
        return "HIGH_RISK"
    return "EXTREME_DANGER"


def compute_risk(
    state: EnvironmentalState,
    vessel: VesselProfile,
    alerts: Optional[Dict[str, Any]] = None,
    geofence: Optional[Dict[str, Any]] = None,
    weights: Optional[Dict[str, float]] = None,
) -> RiskResult:
    """Deterministic, reproducible risk score."""

    # 1. Deterministic safety circuit breaker
    cb = evaluate_circuit_breaker(state, vessel, alerts=alerts, geofence=geofence)

    # 2. Compute each hazard
    w = weights or WEIGHTS
    hz = {
        "wave_height": wave_height_hazard(state, vessel),
        "wave_vessel_interaction": wave_vessel_interaction_hazard(state, vessel),
        "wind": wind_hazard(state, vessel),
        "gust": gust_hazard(state, vessel),
        "current": current_hazard(state, vessel),
        "visibility": visibility_hazard(state, vessel),
        "pressure": pressure_hazard(state, vessel),
        "precipitation": precipitation_hazard(state, vessel),
        "official_warning": official_warning_hazard(state, vessel),
    }

    components: List[RiskComponent] = []
    total = 0.0
    n_known = 0
    n_total = len(w)
    for name, h in hz.items():
        s = h.get("score")
        if s is None:
            comp = RiskComponent(
                name=name,
                score=0.0,
                weighted_contribution=0.0,
                details={"status": "DATA_UNAVAILABLE", **(h or {})},
            )
        else:
            s_clamped = max(0.0, min(1.0, float(s)))
            weight = float(w.get(name, 0.0))
            contrib = s_clamped * weight
            total += contrib
            n_known += 1
            comp = RiskComponent(
                name=name,
                score=round(s_clamped, 4),
                weighted_contribution=round(contrib, 4),
                details={k: v for k, v in h.items() if k not in ("score",)},
            )
        components.append(comp)

    # 3. Confidence = fraction of hazards we have data for, scaled by data quality
    data_confidence = round(
        (n_known / max(n_total, 1)) * state.data_quality_score(), 3
    )
    # Uncertainty: combination of data gaps and freshness degradation.
    n_stale = sum(1 for v in state.variables.values() if v.freshness == "STALE")
    n_unav = sum(1 for v in state.variables.values() if v.freshness == "UNAVAILABLE")
    risk_uncertainty = round(
        min(1.0, 0.4 * (n_stale / max(n_total, 1)) + 0.6 * (n_unav / max(n_total, 1))), 3
    )

    # 4. Convert to 0-100 (monotonic in each hazard).
    final_score = max(0, min(100, round(total * 100.0)))

    # 5. Apply circuit breaker override
    risk_label: str
    risk_score_final: int
    if cb.forced_label == "INSUFFICIENT_CURRENT_DATA":
        risk_label = "INSUFFICIENT_CURRENT_DATA"
        risk_score_final = final_score
    elif cb.forced_label == "EXTREME_DANGER_CYCLONE":
        risk_label = "EXTREME_DANGER_CYCLONE"
        risk_score_final = max(final_score, 100)
    elif cb.forced_label == "EXTREME_DANGER":
        risk_label = "EXTREME_DANGER"
        risk_score_final = max(final_score, 90)
    elif cb.forced_label in ("HIGH_RISK_GUST", "HIGH_RISK_CAPSIZE", "HIGH_RISK_IMBL"):
        risk_label = cb.forced_label
        risk_score_final = max(final_score, 75)
    elif cb.triggered:
        risk_label = "HIGH_RISK"
        risk_score_final = max(final_score, 70)
    else:
        risk_label = _label_for(final_score)
        risk_score_final = final_score

    return RiskResult(
        risk_score=risk_score_final,
        risk_label=risk_label,
        risk_uncertainty=risk_uncertainty,
        data_confidence=data_confidence,
        components=components,
        circuit_breaker=cb,
        data_quality_score=state.data_quality_score(),
        unavailable_parameters=state.unavailable_parameters(),
        calculation_version=CALCULATION_VERSION,
        configuration_version=CONFIGURATION_VERSION,
        risk_equation=RISK_EQUATION_DOC,
        raw_score_before_cb=final_score,
    )
