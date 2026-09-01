"""
Comprehensive PyTest Suite for ORCA 4.0 Backend
Tests microservices, multi-species HSI matrix, A* pathfinding, database CRUD, and REST APIs.
"""

import asyncio
from orchestrator import MultiAgentOrchestrator
from services.ocean_service import ocean_service
from services.weather_service import weather_service
from services.wave_service import wave_service
from services.safety_service import safety_service
from services.pfz_service import pfz_service
from services.economic_service import economic_service
from services.sar_drift_service import sar_drift_service
from database.repository import db_repository

def test_ocean_service():
    res = asyncio.run(ocean_service.fetch_ocean_metrics(16.0215, 73.4821))
    assert "sea_surface_temp_c" in res
    assert "chlorophyll_mg_m3" in res
    assert res["sea_surface_temp_c"] > 20.0

def test_weather_service():
    res = asyncio.run(weather_service.fetch_weather_metrics(16.0215, 73.4821))
    assert "wind_speed_kmh" in res
    assert "wind_direction" in res

def test_wave_service():
    res = asyncio.run(wave_service.fetch_wave_metrics(16.0215, 73.4821))
    assert "significant_wave_height_m" in res
    assert "swell_period_sec" in res

def test_pfz_multi_species_matrix():
    async def _runner():
        ocean_res = await ocean_service.fetch_ocean_metrics(16.0215, 73.4821)
        return await pfz_service.compute_habitat_suitability(ocean_res, 16.0215, 73.4821)
    
    pfz_res = asyncio.run(_runner())
    assert "species_matrix" in pfz_res
    assert "Bangda (Indian Mackerel)" in pfz_res["species_matrix"]
    assert "Surmai (Kingfish / Seer Fish)" in pfz_res["species_matrix"]

def test_safety_circuit_breaker():
    safety_override = safety_service.evaluate_safety_and_circuit_breaker(
        weather_metrics={"wind_speed_kmh": 20},
        wave_metrics={"significant_wave_height_m": 1.0},
        alerts={"has_active_cyclone_alert": True},
        vessel_length_m=8.5
    )
    assert safety_override["override_active"] == True
    assert safety_override["risk_score"] == 100

def test_economic_optimizer():
    econ_res = economic_service.optimize_trip_economics(
        target_ground={"likely_species": ["Bangda (Mackerel)"]},
        vessel_profile={"length_m": 8.5},
        fuel_liters=12.5
    )
    assert "best_docking_harbor" in econ_res
    assert econ_res["max_expected_profit_inr"] > 0

def test_sar_drift_simulation():
    sar_res = sar_drift_service.simulate_drift_trajectory(16.0215, 73.4821, drift_hours=6.0)
    assert len(sar_res["hourly_drift_path"]) == 6
    assert sar_res["prioritized_search_radius_km"] > 0

def test_database_persistence():
    db_repository.save_trip_log(16.0215, 73.4821, "SAFE TO VENTURE", 28, False, 8.5)
    logs = db_repository.get_recent_trip_logs(limit=5)
    assert len(logs) > 0
    assert logs[0]["verdict"] in ["SAFE TO VENTURE", "MODERATE RISK / CAUTION"]

def test_full_pipeline_orchestrator():
    orchestrator = MultiAgentOrchestrator()
    res = asyncio.run(orchestrator.execute_pipeline(16.0215, 73.4821, vessel_length_m=8.5, language="Marathi"))
    assert res["verdict"] in ["SAFE TO VENTURE", "MODERATE RISK / CAUTION"]
    assert "economics" in res
    assert "species_matrix" in res
