"""
Dark-Fleet SAR vs. AIS Anomaly Radar Agent.

The previous implementation had hard-coded `mock_sar_detections` and
`mock_ais_feeds` arrays of fake radar tracks. Those have been REMOVED
(2026-09-03) — synthetic tracks can be mistaken for real detections and
must never ship to production.

This service is now UNAVAILABLE until a real SAR satellite feed (e.g.
ISRO RISAT, Copernicus Sentinel-1) and a real AIS feed (e.g. AIS Hub,
MarineTraffic) are integrated. The H3 spatial-matching logic is
preserved so it can be re-enabled once the feeds are wired in.
"""

import time
from typing import Dict, Any
from utils.h3_spatial import latlon_to_h3, get_surrounding_hexagons


class DarkFleetAgent:
    def scan_sector_anomalies(
        self,
        center_lat: float,
        center_lon: float,
        radius_km: float = 30.0,
    ) -> Dict[str, Any]:
        return {
            "total_radar_contacts": 0,
            "anomalies_found": 0,
            "anomalies": [],
            "sar_revisit_interval_days": "6-12 days",
            "authority_role_required": True,
            "data_provenance": {
                "sources": [],
                "is_simulated": False,
                "is_unavailable": True,
                "queried_at": time.time(),
                "queried_coordinate": {"lat": center_lat, "lon": center_lon},
                "notes": (
                    "Dark-fleet SAR vs. AIS integration is unimplemented in "
                    "this deployment. A previous version returned hard-coded "
                    "mock SAR detections, which is forbidden in production."
                ),
            },
        }

    def detect_anomalies(
        self,
        search_lat: float,
        search_lon: float,
        search_radius_km: float = 50.0,
    ) -> Dict[str, Any]:
        return self.scan_sector_anomalies(search_lat, search_lon, search_radius_km)


dark_fleet_service = DarkFleetAgent()
