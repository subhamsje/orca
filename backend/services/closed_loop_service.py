"""
Closed-Loop Machine Learning Catch Feedback Microservice
Ingests real-world fisher catch reports, applies rate-limiting per device, reputation weighting,
and calibrates HSI model weights dynamically.
"""

from typing import Dict, Any, List
import time
from utils.h3_spatial import latlon_to_h3

class ClosedLoopService:
    def __init__(self):
        self.hsi_weights = {
            "w_sst": 0.35,
            "w_chl": 0.35,
            "w_grad": 0.30
        }
        self._catch_ledger: List[Dict[str, Any]] = []
        self._device_last_submission: Dict[str, float] = {}
        self._vessel_reputation: Dict[str, float] = {}

    def ingest_catch_report(
        self,
        lat: float,
        lon: float,
        species: str,
        weight_kg: float,
        net_type: str,
        sst_observed: float = 28.4,
        device_id: str = "DEFAULT-VESSEL-01"
    ) -> Dict[str, Any]:
        if weight_kg <= 0 or weight_kg > 2000.0:
            return {"status": "rejected", "reason": "Statistical outlier: catch weight unplausible."}

        now = time.time()
        if device_id in self._device_last_submission:
            if now - self._device_last_submission[device_id] < 600.0:
                return {
                    "status": "rate_limited",
                    "reason": "Submission rate limit exceeded. Please wait 10 minutes between reports."
                }

        reputation = self._vessel_reputation.get(device_id, 0.85)
        h3_cell = latlon_to_h3(lat, lon, resolution=7)

        self._device_last_submission[device_id] = now
        report_entry = {
            "timestamp": now,
            "device_id": device_id,
            "coordinate": [lat, lon],
            "h3_spatial_cell": h3_cell,
            "species": species,
            "weight_kg": weight_kg,
            "net_type": net_type,
            "sst_observed": sst_observed,
            "reputation_weight": reputation
        }
        self._catch_ledger.append(report_entry)

        if sst_observed >= 27.5 and sst_observed <= 29.0:
            weight_nudge = 0.005 * reputation
            self.hsi_weights["w_sst"] = round(min(0.50, self.hsi_weights["w_sst"] + weight_nudge), 3)
            self.hsi_weights["w_chl"] = round(max(0.20, self.hsi_weights["w_chl"] - (weight_nudge / 2.0)), 3)

        return {
            "status": "success",
            "report_id": f"CATCH-{len(self._catch_ledger):04d}",
            "h3_spatial_cell": h3_cell,
            "total_reports_processed": len(self._catch_ledger),
            "reputation_weight_applied": reputation,
            "updated_hsi_weights": self.hsi_weights,
            "model_calibration_active": True
        }

closed_loop_service = ClosedLoopService()
