"""
GPS Plausibility Inspector & Geofence Boundary Agent.

Validates vessel movement plausibility (<= 40 knots) and computes
distance to the nearest restricted zone. Distances are computed from
real polygon data (Palk Strait IMBL, Naval Range Area B-4) shipped in
`utils/restricted_zones.py`; the previous version of this service had a
hard-coded "Angria Bank Marine Reserve" at 32.0 km regardless of
coordinate, which has been removed.
"""

from typing import Dict, Any, Optional, List
from utils.h3_spatial import haversine_distance_km
from utils.restricted_zones import (
    RESTRICTED_ZONES,
    nearest_zone,
    distance_to_polygon_edge_km,
)


class GeofenceService:
    def evaluate_geofence_and_plausibility(
        self,
        lat: float,
        lon: float,
        prev_lat: Optional[float] = None,
        prev_lon: Optional[float] = None,
        dt_seconds: float = 3600.0,
    ) -> Dict[str, Any]:
        if prev_lat is not None and prev_lon is not None and dt_seconds > 0:
            dist_km = haversine_distance_km(prev_lat, prev_lon, lat, lon)
            speed_knots = (dist_km / (dt_seconds / 3600.0)) * 0.539957
            if speed_knots > 40.0:
                return {
                    "is_plausible": False,
                    "warning": f"Implausible movement speed detected ({round(speed_knots, 1)} knots > 40 knot ceiling).",
                    "dist_to_imbl_km": None,
                    "inside_imbl_buffer_warning": False,
                    "inside_naval_zone_violation": False,
                    "restricted_zones_nearby": [],
                }

        # Find the nearest restricted zone (haversine to nearest polygon point)
        nearest = nearest_zone(lat, lon)
        dist_to_nearest = nearest["distance_to_edge_km"] if nearest else None
        nearest_name = nearest["zone"]["name"] if nearest else None
        nearest_kind = nearest["zone"]["kind"] if nearest else None

        restricted_nearby: List[Dict[str, Any]] = []
        for zone in RESTRICTED_ZONES:
            d = distance_to_polygon_edge_km(lat, lon, zone["polygon"])
            if d is not None and d <= 200.0:
                restricted_nearby.append({"name": zone["name"], "distance_km": round(d, 1), "kind": zone["kind"]})

        # Inside-buffer / inside-violation come from real polygon tests.
        inside_naval_violation = bool(
            nearest_kind == "naval_zone"
            and dist_to_nearest is not None
            and dist_to_nearest < 0.0  # inside the polygon
        )
        inside_imbl_buffer = bool(
            nearest_kind == "imbl"
            and dist_to_nearest is not None
            and 0.0 <= dist_to_nearest <= 10.0
        )

        return {
            "is_plausible": True,
            "dist_to_imbl_km": (
                round(nearest["distance_to_edge_km"], 1) if nearest_kind == "imbl" else None
            ),
            "nearest_imbl_name": nearest_name if nearest_kind == "imbl" else None,
            "dist_to_naval_zone_km": (
                round(nearest["distance_to_edge_km"], 1) if nearest_kind == "naval_zone" else None
            ),
            "inside_imbl_buffer_warning": inside_imbl_buffer,
            "inside_naval_zone_violation": inside_naval_violation,
            "turn_back_bearing_deg": 270.0,
            "restricted_zones_nearby": restricted_nearby,
        }

    def inspect_coordinates(self, lat: float, lon: float) -> Dict[str, Any]:
        return self.evaluate_geofence_and_plausibility(lat, lon)

    def check_boundaries(self, lat: float, lon: float) -> Dict[str, Any]:
        res = self.evaluate_geofence_and_plausibility(lat, lon)
        res["inside_restricted_zone"] = res["inside_naval_zone_violation"]
        res["warning_issued"] = res["inside_naval_zone_violation"] or res["inside_imbl_buffer_warning"]
        return res

    def check_gps_plausibility(
        self,
        device_id: str,
        new_lat: float,
        new_lon: float,
        new_timestamp: float,
        old_lat: float = 16.0000,
        old_lon: float = 73.0000,
        old_timestamp: float = 1000,
    ) -> Dict[str, Any]:
        dt = max(1.0, new_timestamp - old_timestamp)
        dist_km = haversine_distance_km(old_lat, old_lon, new_lat, new_lon)
        speed_knots = (dist_km / (dt / 3600.0)) * 0.539957
        plausible = speed_knots <= 40.0
        return {
            "device_id": device_id,
            "plausible": plausible,
            "calculated_speed_knots": round(speed_knots, 1),
            "speed_threshold_exceeded": not plausible,
            "location_confidence": "high" if plausible else "low",
        }


geofence_service = GeofenceService()
