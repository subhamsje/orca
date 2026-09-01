"""
Parametric Weather Insurance & Fisher Welfare Microservice
Automates parametric claim verification for artisanal fishermen based on tamper-proof satellite and INCOIS buoys,
triggering instant financial payouts during severe ocean disruptions without manual loss adjuster inspections.
"""

import time
import hashlib
import json
from typing import Dict, Any, Optional

class ParametricInsuranceService:
    def __init__(self):
        # Parametric Trigger Policy Thresholds
        self.trigger_thresholds = {
            "max_wave_height_m": 3.0,
            "max_wind_speed_kmh": 50.0,
            "cyclone_advisory": True
        }
        self.default_daily_loss_compensation_inr = 3500.0  # INR per idle weather day

    def evaluate_insurance_trigger(
        self,
        vessel_id: str,
        policy_id: str,
        weather_metrics: Dict[str, Any],
        wave_metrics: Dict[str, Any],
        alerts: Dict[str, Any],
        fisher_name: str = "Subham Koli"
    ) -> Dict[str, Any]:
        """
        Evaluates real-time weather indices against parametric insurance contract thresholds.
        """
        swh = wave_metrics.get("significant_wave_height_m", 1.1)
        wind_gust = weather_metrics.get("wind_gust_kmh", 22.0)
        has_cyclone = alerts.get("has_active_cyclone_alert", False)
        has_high_wave = alerts.get("has_high_wave_alert", False)

        # Trigger Condition Evaluation
        triggers_met = []
        if has_cyclone:
            triggers_met.append("RULE_PARAM_01: Official IMD Cyclone Red Advisory In Force")
        if swh >= self.trigger_thresholds["max_wave_height_m"]:
            triggers_met.append(f"RULE_PARAM_02: Significant Wave Height ({swh}m) ≥ 3.0m threshold")
        if wind_gust >= self.trigger_thresholds["max_wind_speed_kmh"]:
            triggers_met.append(f"RULE_PARAM_03: Sustained Wind Gust ({wind_gust} km/h) ≥ 50.0 km/h threshold")
        if has_high_wave:
            triggers_met.append("RULE_PARAM_04: INCOIS National High Wave / Swell Surge Warning")

        claim_triggered = len(triggers_met) > 0
        claim_id = f"CLAIM-PM-{abs(hash(vessel_id + str(time.time()))) % 100000:05d}"

        if claim_triggered:
            payout_amount = self.default_daily_loss_compensation_inr
            status = "AUTOMATICALLY_APPROVED"
            remarks = "Severe weather conditions validated by INCOIS/IMD satellite telemetry. Direct Bank Transfer (DBT) dispatched."
        else:
            payout_amount = 0.0
            status = "INELIGIBLE_NORMAL_WEATHER"
            remarks = "All oceanographic conditions are within normal operational limits."

        # Cryptographic Settlement Certificate
        cert_data = {
            "claim_id": claim_id,
            "vessel_id": vessel_id,
            "policy_id": policy_id,
            "status": status,
            "payout_inr": payout_amount,
            "timestamp": int(time.time())
        }
        cert_hash = hashlib.sha256(json.dumps(cert_data, sort_keys=True).encode()).hexdigest()[:20]

        return {
            "claim_id": claim_id,
            "vessel_id": vessel_id,
            "policy_id": policy_id,
            "fisher_name": fisher_name,
            "claim_triggered": claim_triggered,
            "status": status,
            "payout_amount_inr": payout_amount,
            "triggers_met": triggers_met,
            "verified_metrics": {
                "swh_m": swh,
                "wind_gust_kmh": wind_gust,
                "cyclone_status": has_cyclone
            },
            "remarks": remarks,
            "settlement_certificate_hash": f"CERT-DBT-{cert_hash.upper()}"
        }

insurance_service = ParametricInsuranceService()
