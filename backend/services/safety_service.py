"""
Deterministic Safety Circuit Breaker Microservice
Enforces non-bypassable safety rules and scales capsizing risks dynamically based on vessel profiles.
"""

from typing import Dict, Any, Optional
from utils.vessel_twin import evaluate_vessel_seaworthiness, calculate_max_safe_wave_height

class SafetyService:
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

        prof = vessel_profile or {"length_m": vessel_length_m}
        vessel_eval = evaluate_vessel_seaworthiness(swh, wind_speed, prof)
        max_safe_wave = vessel_eval["max_safe_wave_m"]

        if alerts.get("has_active_cyclone_alert"):
            return {
                "risk_score": 100,
                "verdict_label": "EXTREME DANGER / STAY ASHORE",
                "override_active": True,
                "override_reason": "Official IMD Cyclone Advisory Override Active",
                "vessel_evaluation": vessel_eval,
                "audit_trail": {"rule_triggered": "RULE_1_CYCLONE_OVERRIDE"}
            }

        if swh > max_safe_wave:
            return {
                "risk_score": 90,
                "verdict_label": "HIGH RISK / CAPSIZE DANGER",
                "override_active": True,
                "override_reason": f"Significant wave height ({swh}m) breaches safety limit for a {vessel_length_m}m vessel.",
                "vessel_evaluation": vessel_eval,
                "audit_trail": {"rule_triggered": "RULE_3_CAPSIZE_THRESHOLD_BREACH"}
            }

        if wind_gust > 48.0:
            return {
                "risk_score": 85,
                "verdict_label": "HIGH RISK / GALE WINDS",
                "override_active": True,
                "override_reason": f"Wind gust velocity ({wind_gust} km/h) exceeds safety threshold.",
                "vessel_evaluation": vessel_eval,
                "audit_trail": {"rule_triggered": "RULE_2_GALE_WINDS_OVERRIDE"}
            }

        raw_risk = (
            (swh / max_safe_wave) * 35 +
            (wind_gust / 50.0) * 30 +
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
            "audit_trail": {"rule_triggered": "RULE_4_DETERMINISTIC_FORMULA"}
        }

safety_service = SafetyService()
