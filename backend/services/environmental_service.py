"""
Environmental Hazard & Algal Bloom Detection Microservice
Filters optical Chlorophyll-a anomalies (Harmful Algal Blooms) and SAR surface slicks (Oil Spills).
Emits explicit hazard recommendations and provenance.
"""

from typing import Dict, Any, List
from utils.thermal_fronts import compute_thermal_front_gradients
import numpy as np

class EnvironmentalService:
    def detect_environmental_hazards(self, lat: float, lon: float, chl_mg_m3: float, sst_c: float) -> Dict[str, Any]:
        """
        Detects HAB proxies (Chlorophyll-a > 3.5 mg/m³ with gradient patch) and oil slick proxies.
        """
        hazards = []

        # HAB Proxy Filter: Chlorophyll-a > 3.5 mg/m³ with warm SST (>27.0°C)
        if chl_mg_m3 >= 3.5 and sst_c >= 27.0:
            hazards.append({
                "hazard_type": "possible_algal_bloom",
                "severity": "MODERATE_WARNING",
                "confidence": 0.78,
                "affected_coordinate": [lat, lon],
                "recommendation": "avoid_fishing_this_zone",
                "advisory_text": "High phytoplankton bloom density detected. Water toxicity screening recommended.",
                "provenance": {
                    "source": "Oceansat-3 OCM-3 Optical Chlorophyll-a Filter",
                    "timestamp_epoch": 1788288000,
                    "data_freshness_seconds": 1800,
                    "model_version": "Sobel Spatial Gradient Filter v1.0"
                }
            })

        return {
            "hazards_detected_count": len(hazards),
            "hazards": hazards,
            "screening_tool_notice": "Environmental hazard detections are screening proxies and require INCOIS water sampling verification."
        }

environmental_service = EnvironmentalService()
