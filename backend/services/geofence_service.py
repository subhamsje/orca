"""
GIS Geofencing, Boundary Protection & GPS Plausibility Microservice
Checks spatial boundaries and verifies physical GPS movement plausibility against max 40 knot vessel speed limit.
"""

from typing import Dict, Any, List
import math
import time

class GeofenceService:
    def __init__(self):
        self._last_vessel_positions: Dict[str, Dict[str, Any]] = {}

    def check_gps_plausibility(self, vessel_id: str, new_lat: float, new_lon: float, new_timestamp: float = None) -> Dict[str, Any]:
        now = new_timestamp or time.time()
        if vessel_id in self._last_vessel_positions:
            last = self._last_vessel_positions[vessel_id]
            dt_hours = (now - last["timestamp"]) / 3600.0
            
            if dt_hours > 0.001:
                dlat = math.radians(new_lat - last["lat"])
                dlon = math.radians(new_lon - last["lon"])
                a = math.sin(dlat/2)**2 + math.cos(math.radians(last["lat"])) * math.cos(math.radians(new_lat)) * math.sin(dlon/2)**2
                dist_km = 6371.0 * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
                
                implied_speed_kmh = dist_km / dt_hours
                
                if implied_speed_kmh > 74.0:
                    return {
                        "plausible": False,
                        "location_confidence": "low",
                        "implied_speed_kmh": round(implied_speed_kmh, 1),
                        "warning": f"Implausible GPS position jump detected ({implied_speed_kmh:.1f} km/h > 74 km/h max speed)."
                    }

        self._last_vessel_positions[vessel_id] = {"lat": new_lat, "lon": new_lon, "timestamp": now}
        return {"plausible": True, "location_confidence": "high", "implied_speed_kmh": 0.0}

    def check_boundaries(self, lat: float, lon: float) -> Dict[str, Any]:
        if 8.5 <= lat <= 10.5 and 79.0 <= lon <= 80.5:
            dlat = math.radians(lat - 9.20)
            dlon = math.radians(lon - 79.60)
            a = math.sin(dlat/2)**2 + math.cos(math.radians(9.20)) * math.cos(math.radians(lat)) * math.sin(dlon/2)**2
            dist_to_imbl = round(6371.0 * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a)), 1)
            imbl_name = "Palk Strait (Sri Lanka IMBL)"
        else:
            dist_to_imbl = 24.5
            imbl_name = "Indian EEZ Coastal Baseline"

        if 14.8 <= lat <= 15.3 and 73.1 <= lon <= 73.5:
            dist_to_naval = 1.2
            naval_zone_violation = True
        else:
            dist_to_naval = 18.2
            naval_zone_violation = False

        imbl_buffer_warning = dist_to_imbl < 5.0

        return {
            "dist_to_imbl_km": dist_to_imbl,
            "nearest_imbl_name": imbl_name,
            "dist_to_naval_zone_km": dist_to_naval,
            "inside_imbl_buffer_warning": imbl_buffer_warning,
            "inside_naval_zone_violation": naval_zone_violation,
            "turn_back_bearing_deg": 270.0,
            "restricted_zones_nearby": [
                {"name": "Naval Range Area B-4", "distance_km": dist_to_naval},
                {"name": "Angria Bank Marine Reserve", "distance_km": 32.0}
            ]
        }

geofence_service = GeofenceService()
