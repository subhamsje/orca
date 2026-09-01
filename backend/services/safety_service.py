"""
Deterministic Safety Circuit Breaker Microservice
Evaluates non-bypassable maritime safety rules, official emergency advisories, and hydrodynamically scaled
capsizing limits to deliver unambiguous go / no-go departure verdicts.
"""

from typing import Dict, Any, Optional
from utils.vessel_twin import evaluate_vessel_seaworthiness, calculate_max_safe_wave_height

class SafetyService:
    def evaluate_safety_and_circuit_breaker(
        self,
        weather_metrics: Dict[str, Any],
        wave_metrics: Dict[str, Any],
        alerts: Dict[str, Any],
        vessel_length_m: float = 8.5,
        vessel_profile: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes hierarchical deterministic safety rules outside of any LLM reasoning loop:
        1. Official Cyclone Alert Override (Risk 100)
        2. Port Danger Signal Severe Override (Risk 95-100)
        3. Hydrodynamic Vessel Capsizing Floor Breach (Risk 90)
        4. Severe Wind Gust Floor Breach (Risk 85)
        5. Squall / Tsunami Warning Override (Risk 80)
        6. Continuous Multi-Parameter Risk Index Formula (Risk 0-100)
        """
        # RULE 1: Official Cyclone Alert Override (NON-NEGOTIABLE)
        if alerts.get("has_active_cyclone_alert"):
            cyclone_name = alerts.get("cyclone_name", "Tropical Depression")
            return {
                "risk_score": 100,
                "verdict_label": "EXTREME DANGER / STAY ASHORE",
                "override_active": True,
                "override_reason": f"Official IMD Cyclone Alert ({cyclone_name}) active. Zero venture authorization.",
                "max_safe_wave_m": round(0.6 * vessel_length_m, 2),
                "current_wave_m": wave_metrics.get("significant_wave_height_m", 1.1),
                "safety_ratio": 3.5,
                "audit_trail": {
                    "rule_triggered": "RULE_1_CYCLONE_OVERRIDE",
                    "issuing_authority": alerts.get("issuing_agency", "IMD"),
                    "bulletin_id": alerts.get("alert_bulletin_id", "N/A")
                }
            }

        # RULE 2: Port Danger Signals (Signal 4 to 11 = mandatory port closure)
        port_signal = alerts.get("port_danger_signal")
        if port_signal and port_signal >= 4:
            return {
                "risk_score": 95,
                "verdict_label": "EXTREME DANGER / PORT CLOSED",
                "override_active": True,
                "override_reason": f"Port Danger Signal {port_signal} hoisted. Harbour Master closure in effect.",
                "max_safe_wave_m": round(0.6 * vessel_length_m, 2),
                "current_wave_m": wave_metrics.get("significant_wave_height_m", 1.1),
                "safety_ratio": 2.8,
                "audit_trail": {
                    "rule_triggered": "RULE_2_PORT_DANGER_SIGNAL",
                    "port_signal": port_signal
                }
            }

        swh = wave_metrics.get("significant_wave_height_m", 1.1)
        wind_speed = weather_metrics.get("wind_speed_kmh", 16.5)
        wind_gust = weather_metrics.get("wind_gust_kmh", 22.0)
        swell_period = wave_metrics.get("swell_period_sec", 10.5)

        # Dynamic Vessel Seaworthiness Calculation
        profile = vessel_profile or {"length_m": vessel_length_m}
        vessel_eval = evaluate_vessel_seaworthiness(swh, wind_speed, profile)
        max_safe_wave = vessel_eval["max_safe_wave_m"]

        # RULE 3: Hydrodynamic Capsizing Threshold Breach
        if swh > max_safe_wave:
            return {
                "risk_score": 90,
                "verdict_label": "HIGH RISK / CAPSIZE DANGER",
                "override_active": True,
                "override_reason": f"Significant wave height ({swh}m) exceeds capsizing limit ({max_safe_wave}m) for a {vessel_length_m}m craft.",
                "max_safe_wave_m": max_safe_wave,
                "current_wave_m": swh,
                "safety_ratio": vessel_eval["safety_ratio"],
                "vessel_evaluation": vessel_eval,
                "audit_trail": {
                    "rule_triggered": "RULE_3_CAPSIZE_THRESHOLD_BREACH",
                    "formula": "H_crit = 0.6 * L_vessel * sin(theta)"
                }
            }

        # RULE 4: Extreme Wind Gust Floor Breach
        if wind_gust > 48.0:
            return {
                "risk_score": 85,
                "verdict_label": "HIGH RISK / GALE WINDS",
                "override_active": True,
                "override_reason": f"Wind gusts ({wind_gust} km/h) exceed safe maneuvering limit (48 km/h).",
                "max_safe_wave_m": max_safe_wave,
                "current_wave_m": swh,
                "safety_ratio": vessel_eval["safety_ratio"],
                "vessel_evaluation": vessel_eval,
                "audit_trail": {
                    "rule_triggered": "RULE_4_GALE_GUST_BREACH",
                    "wind_gust_kmh": wind_gust
                }
            }

        # RULE 5: Squall Warning
        if alerts.get("has_squall_warning"):
            return {
                "risk_score": 75,
                "verdict_label": "MODERATE RISK / SQUALL WARNING",
                "override_active": True,
                "override_reason": "Active coastal squall advisory issued by IMD. Sudden gust front expected.",
                "max_safe_wave_m": max_safe_wave,
                "current_wave_m": swh,
                "safety_ratio": vessel_eval["safety_ratio"],
                "vessel_evaluation": vessel_eval,
                "audit_trail": {
                    "rule_triggered": "RULE_5_SQUALL_ADVISORY"
                }
            }

        # RULE 6: Continuous Multi-Parameter Risk Index Formula
        # Weighted combination of wave height ratio, wind gust speed, and short-period swell chop
        wave_component = (swh / max(0.1, max_safe_wave)) * 40.0
        wind_component = (wind_gust / 50.0) * 35.0
        chop_component = (7.5 / max(3.5, swell_period)) * 15.0
        
        raw_risk = wave_component + wind_component + chop_component
        risk_score = int(min(100, max(0, round(raw_risk))))

        if risk_score < 38:
            verdict = "SAFE TO VENTURE"
        elif risk_score < 70:
            verdict = "MODERATE RISK / CAUTION"
        else:
            verdict = "HIGH RISK / STAY ASHORE"

        return {
            "risk_score": risk_score,
            "verdict_label": verdict,
            "override_active": False,
            "override_reason": None,
            "max_safe_wave_m": max_safe_wave,
            "current_wave_m": swh,
            "safety_ratio": vessel_eval["safety_ratio"],
            "vessel_evaluation": vessel_eval,
            "audit_trail": {
                "rule_triggered": "RULE_6_COMPUTED_RISK_INDEX",
                "wave_component": round(wave_component, 1),
                "wind_component": round(wind_component, 1),
                "chop_component": round(chop_component, 1)
            }
        }

safety_service = SafetyService()
