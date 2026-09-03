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
        prof = vessel_profile or {"length_m": vessel_length_m, "beam_m": 2.2}

        # RULE 1: Official Cyclone Alert Override (NON-NEGOTIABLE)
        if alerts and alerts.get("has_active_cyclone_alert"):
            vessel_eval = evaluate_vessel_seaworthiness(wave_metrics.get("significant_wave_height_m", 1.0) or 1.0, weather_metrics.get("wind_speed_kmh", 20.0) or 20.0, prof)
            return {
                "risk_score": 100,
                "verdict_label": "EXTREME DANGER / STAY ASHORE",
                "override_active": True,
                "override_reason": "Official IMD Cyclone Advisory Override Active",
                "vessel_evaluation": vessel_eval,
                "wave_steepness_ratio": 0.25,
                "audit_trail": {"rule_triggered": "RULE_1_CYCLONE_OVERRIDE"}
            }

        swh = wave_metrics.get("significant_wave_height_m") if wave_metrics else 1.2
        wind_speed = weather_metrics.get("wind_speed_kmh") if weather_metrics else 15.0
        wind_gust = weather_metrics.get("wind_gust_kmh", (wind_speed * 1.3) if wind_speed else 20.0) if weather_metrics else 20.0
        swell_period = wave_metrics.get("swell_period_sec", 6.0) if wave_metrics else 6.0

        if swh is None:
            swh = 1.2
        if wind_speed is None:
            wind_speed = 15.0

        vessel_eval = evaluate_vessel_seaworthiness(swh, wind_speed, prof)
        max_safe_wave = vessel_eval["max_safe_wave_m"]

        steepness_ratio = swh / max(1.0, swell_period or 6.0)

        # RULE 3: Hydrodynamic Capsizing Threshold Breach (Hs > H_crit)
        if swh >= max_safe_wave:
            return {
                "risk_score": 90,
                "verdict_label": "HIGH RISK / CAPSIZE DANGER",
                "override_active": True,
                "override_reason": f"Wave height ({swh}m) exceeds safe stability threshold ({max_safe_wave}m) for {prof.get('length_m')}m craft",
                "vessel_evaluation": vessel_eval,
                "wave_steepness_ratio": round(steepness_ratio, 3),
                "audit_trail": {"rule_triggered": "RULE_3_CAPSIZE_THRESHOLD_BREACH"}
            }

        # RULE 2: Dangerous Wave Steepness / Parametric Roll Resonance (Hs / T_s > 0.35)
        if steepness_ratio >= 0.35:
            return {
                "risk_score": 80,
                "verdict_label": "DANGEROUS SEA STATE / HIGH WAVE STEEPNESS",
                "override_active": True,
                "override_reason": f"Wave steepness ratio ({steepness_ratio:.2f}) indicates severe breaking swell danger",
                "vessel_evaluation": vessel_eval,
                "wave_steepness_ratio": round(steepness_ratio, 3),
                "audit_trail": {"rule_triggered": "RULE_2_WAVE_STEEPNESS_RESONANCE"}
            }

        # RULE 4: Extreme Wind Gusts (> 48 km/h)
        if wind_gust and wind_gust >= 48.0:
            return {
                "risk_score": 85,
                "verdict_label": "GALE WINDS / GUST WARNING",
                "override_active": True,
                "override_reason": f"Wind gusts reach {wind_gust} km/h (Gale threshold breached)",
                "vessel_evaluation": vessel_eval,
                "wave_steepness_ratio": round(steepness_ratio, 3),
                "audit_trail": {"rule_triggered": "RULE_4_EXTREME_GUSTS"}
            }

        # Safe Baseline Operation (Physical risk dynamically proportional to wave height)
        base_risk = min(65, int((swh / max_safe_wave) * 50.0 + (wind_speed / 45.0) * 20.0))
        verdict = "SAFE TO VENTURE" if base_risk < 40 else "MODERATE RISK / CAUTION"

        return {
            "risk_score": base_risk,
            "verdict_label": verdict,
            "override_active": False,
            "override_reason": None,
            "vessel_evaluation": vessel_eval,
            "wave_steepness_ratio": round(steepness_ratio, 3),
            "audit_trail": {"rule_triggered": "DETERMINISTIC_DYNAMIC_RISK_EVALUATION"}
        }

safety_service = SafetyAgent()
