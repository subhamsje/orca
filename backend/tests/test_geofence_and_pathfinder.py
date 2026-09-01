"""
Tests for GIS Geofencing & Cost-Weighted A* Pathfinder
"""

import pytest
from services.geofence_service import geofence_service
from services.pathfinder_service import pathfinder_service

def test_geofence_sri_lanka_palk_strait():
    # Point very close to Sri Lanka IMBL in Palk Strait
    lat, lon = 9.25, 79.55
    res = geofence_service.check_boundaries(lat, lon)
    assert res["dist_to_imbl_km"] < 10.0
    assert "Sri Lanka" in res["nearest_imbl_name"]
    assert "turn_back_bearing_deg" in res

def test_geofence_naval_range_detection():
    # Inside Naval Area B-4 off Goa (15.0N, 73.3E)
    lat, lon = 15.05, 73.35
    res = geofence_service.check_boundaries(lat, lon)
    assert res["inside_naval_zone_violation"] is True

def test_pathfinder_with_detour():
    start_lat, start_lon = 16.0215, 73.4821
    pfz_dummy = {
        "top_grounds": [
            {"name": "Area 1 - Test Ground", "distance_km": 15.0, "coordinates": [16.10, 73.35]}
        ]
    }
    geofence_dummy = {
        "inside_imbl_buffer_warning": True,
        "dist_to_naval_zone_km": 15.0
    }

    route_res = pathfinder_service.compute_safest_route(
        start_lat=start_lat,
        start_lon=start_lon,
        pfz_grounds=pfz_dummy,
        geofence_info=geofence_dummy
    )

    assert len(route_res["waypoints"]) >= 3
    assert route_res["total_distance_km"] > 0
    assert route_res["estimated_travel_mins"] > 0
    assert route_res["fuel_consumption_est_liters"] > 0
    assert len(route_res["avoided_hazards"]) > 0
