"""
Deterministic Vessel Digital Twin Safety Circuit Breaker Agent
Enforces non-bypassable safety rules, scales physical capsizing risks dynamically based on vessel profiles,
and evaluates wave steepness ratios (Hs / T_swell).

Solves Cons of Legacy Marine Safety Apps:
- Legacy apps warn based on wind speed alone without knowing boat dimensions.
- ORCA 4.0 SafetyAgent enforces hard deterministic overrides for official IMD cyclones and calculates
  hydrodynamic capsizing wave thresholds (H_crit = 0.22 * L_vessel + 0.05 * B_vessel).
"""

from typing import Dict, Any, Optional
from utils.vessel_twin import evaluate_vessel_seaworthiness, calculate_max_safe_wave_height

class SafetyAgent:
    def evaluate_safety_and_circuit_breaker(
        self,
        weather_metrics: dict,
        wave_metrics: dict,
        alerts: dict,
        vessel_length_m: float = 8.5,
        vessel_profile: Optional[dict] = None
    ) -> Dict[str, Any]:
        swh = wave_metrics.get("significant_wave_height_m", 1.1)
        wind_speed = weather_metrics.get("wind_speed_kmh", 16.5)
        wind_gust = weather_metrics.get("wind_gust_kmh", 22.0)
        swell_period = wave_metrics.get("swell_period_sec", 10.5)

        prof = vessel_profile or {"length_m": vessel_length_m, "beam_m": 2.2}
        vessel_eval = evaluate_vessel_seaworthiness(swh, wind_speed, prof)
        max_safe_wave = vessel_eval["max_safe_wave_m"]

        # Calculate wave steepness (Hs / T_swell)
        steepness_ratio = swh / max(1.0, swell_period)

        # RULE 1: Official Cyclone Alert Override (NON-NEGOTIABLE)
        if alerts.get("has_active_cyclone_alert"):
            return {
                "risk_score": 100,
                "verdict_label": "EXTREME DANGER / STAY ASHORE",
                "override_active": True,
                "override_reason": "Official IMD Cyclone Advisory Override Active",
                "vessel_evaluation": vessel_eval,
                "wave_steepness_ratio": round(steepness_ratio, 3),
                "audit_trail": {"rule_triggered": "RULE_1_CYCLONE_OVERRIDE"}
            }

        # RULE 2: Vessel Capsizing Safety Floor Breach
        if swh > max_safe_wave:
            return {
                "risk_score": 90,
                "verdict_label": "HIGH RISK / CAPSIZE DANGER",
                "override_active": True,
                "override_reason": f"Significant wave height ({swh}m) breaches safety limit for a {vessel_length_m}m vessel.",
                "vessel_evaluation": vessel_eval,
                "wave_steepness_ratio": round(steepness_ratio, 3),
                "audit_trail": {"rule_triggered": "RULE_3_CAPSIZE_THRESHOLD_BREACH"}
            }

        # RULE 3: Gale Wind Gust Breach
        if wind_gust > 48.0:
            return {
                "risk_score": 85,
                "verdict_label": "HIGH RISK / GALE WINDS",
                "override_active": True,
                "override_reason": f"Wind gust velocity ({wind_gust} km/h) exceeds safety threshold.",
                "vessel_evaluation": vessel_eval,
                "wave_steepness_ratio": round(steepness_ratio, 3),
                "audit_trail": {"rule_triggered": "RULE_2_GALE_WINDS_OVERRIDE"}
            }

        # RULE 4: Deterministic Seaworthiness Risk Index Formula
        raw_risk = (
            (swh / max_safe_wave) * 35 +
            (wind_gust / 50.0) * 30 +
            (steepness_ratio / 0.15) * 20 +
            (8.0 / max(4.0, swell_period)) * 15
        )
        risk_score = int(min(100, max(0, raw_risk)))

        if risk_score < 40:
            verdict = "SAFE TO VENTURE"
        elif risk_score < 75:
            verdict = "MODERATE RISK / CAUTION"
        else:
            verdict = "HIGH RISK / STAY ASHORE"

        return {
            "risk_score": risk_score,
            "verdict_label": verdict,
            "override_active": False,
            "vessel_evaluation": vessel_eval,
            "wave_steepness_ratio": round(steepness_ratio, 3),
            "audit_trail": {"rule_triggered": "RULE_4_DETERMINISTIC_FORMULA"}
        }

safety_service = SafetyAgent()
