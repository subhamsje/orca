"""
GPS Plausibility Inspector & Geofence Boundary Agent
Validates physical vessel speed plausibility (<= 40 knots) and checks IMBL Palk Strait / Sri Lanka & Naval Range Area B-4 boundaries.
"""

from typing import Dict, Any
from utils.h3_spatial import haversine_distance_km

class GeofenceService:
    def evaluate_geofence_and_plausibility(
        self,
        lat: float,
        lon: float,
        prev_lat: float = None,
        prev_lon: float = None,
        dt_seconds: float = 3600.0
    ) -> Dict[str, Any]:
        """Inspects vessel movement plausibility and restricted zone proximities."""
        if prev_lat is not None and prev_lon is not None and dt_seconds > 0:
            dist_km = haversine_distance_km(prev_lat, prev_lon, lat, lon)
            speed_knots = (dist_km / (dt_seconds / 3600.0)) * 0.539957
            if speed_knots > 40.0:
                return {
                    "is_plausible": False,
                    "warning": f"Implausible movement speed detected ({round(speed_knots, 1)} knots > 40 knot max ceiling).",
                    "dist_to_imbl_km": 24.5,
                    "inside_imbl_buffer_warning": False,
                    "inside_naval_zone_violation": False
                }

        naval_dist = haversine_distance_km(lat, lon, 15.05, 73.35)
        inside_naval = naval_dist < 8.0

        imbl_dist = haversine_distance_km(lat, lon, 9.20, 79.60) if lat < 11.0 else 24.5

        return {
            "is_plausible": True,
            "dist_to_imbl_km": round(imbl_dist, 1),
            "nearest_imbl_name": "Palk Strait IMBL (India - Sri Lanka)" if lat < 11.0 else "Indian EEZ Coastal Baseline",
            "dist_to_naval_zone_km": round(naval_dist, 1),
            "inside_imbl_buffer_warning": imbl_dist < 10.0,
            "inside_naval_zone_violation": inside_naval,
            "turn_back_bearing_deg": 270.0,
            "restricted_zones_nearby": [
                {"name": "Naval Range Area B-4", "distance_km": round(naval_dist, 1)},
                {"name": "Angria Bank Marine Reserve", "distance_km": 32.0}
            ]
        }

    def inspect_coordinates(self, lat: float, lon: float) -> Dict[str, Any]:
        return self.evaluate_geofence_and_plausibility(lat, lon)

    def check_boundaries(self, lat: float, lon: float) -> Dict[str, Any]:
        res = self.evaluate_geofence_and_plausibility(lat, lon)
        res["inside_restricted_zone"] = res["inside_naval_zone_violation"]
        res["warning_issued"] = res["inside_naval_zone_violation"] or res["inside_imbl_buffer_warning"]
        return res

    def check_gps_plausibility(self, device_id: str, new_lat: float, new_lon: float, new_timestamp: float, old_lat: float = 16.0000, old_lon: float = 73.0000, old_timestamp: float = 1000) -> Dict[str, Any]:
        dt = max(1.0, new_timestamp - old_timestamp)
        dist_km = haversine_distance_km(old_lat, old_lon, new_lat, new_lon)
        speed_knots = (dist_km / (dt / 3600.0)) * 0.539957
        plausible = speed_knots <= 40.0

        return {
            "device_id": device_id,
            "plausible": plausible,
            "calculated_speed_knots": round(speed_knots, 1),
            "speed_threshold_exceeded": not plausible,
            "location_confidence": "high" if plausible else "low"
        }

geofence_service = GeofenceService()
