"""
Tests for SAR Monte Carlo Particle Drift & Eco-Economic Multi-Harbor ROI Optimizer
"""

import pytest
from services.sar_drift_service import sar_drift_service
from services.economic_service import economic_service

def test_sar_monte_carlo_drift_simulation():
    res = sar_drift_service.simulate_drift_trajectory(
        last_known_lat=16.0215,
        last_known_lon=73.4821,
        drift_hours=6.0,
        num_particles=500
    )
    assert len(res["hourly_drift_path"]) == 6
    assert "search_ellipse" in res
    assert res["search_ellipse"]["major_axis_km"] > 0
    assert len(res["search_pattern_waypoints"]) > 0
    assert res["prioritized_search_radius_km"] > 0

def test_economic_multi_harbor_optimization():
    target_ground = {
        "name": "Malvan Deep",
        "coordinates": [16.10, 73.35],
        "likely_species": ["Bangda (Indian Mackerel)"]
    }
    eco_res = economic_service.optimize_trip_economics(
        target_ground=target_ground,
        vessel_profile={"length_m": 8.5, "engine_hp": 9.9},
        est_catch_kg=100.0,
        fuel_liters=15.0
    )
    assert "best_docking_harbor" in eco_res
    assert eco_res["max_expected_profit_inr"] > 0
    assert len(eco_res["harbor_comparisons"]) >= 3
    # Check that highest profit harbor is selected
    top_harbor = eco_res["harbor_comparisons"][0]
    assert top_harbor["recommended"] is True
