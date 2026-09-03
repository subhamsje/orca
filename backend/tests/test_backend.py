"""
PyTest Suite for ORCA 4.0 Multi-Agent Pipeline & Specialized Microservices
Sponsored by ISRO / SIH26176 / INCOIS / IMD
"""

import asyncio
import pytest
from services.ocean_service import ocean_service
from services.weather_service import weather_service
from services.wave_service import wave_service
from services.pfz_service import pfz_service
from services.safety_service import safety_service
from services.economic_service import economic_service
from services.nlg_service import nlg_service
from orchestrator import MultiAgentOrchestrator
from database.repository import db_repository

def test_ocean_service():
    res = asyncio.run(ocean_service.fetch_ocean_metrics(16.0215, 73.4821))
    assert "sea_surface_temp_c" in res
    assert "chlorophyll_mg_m3" in res
    if res["sea_surface_temp_c"] is not None:
        assert res["sea_surface_temp_c"] > 0.0

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
    assert pfz_res["species_matrix"]["Bangda (Indian Mackerel)"] >= 0

def test_safety_circuit_breaker():
    safety_override = safety_service.evaluate_safety_and_circuit_breaker(
        weather_metrics={"wind_speed_kmh": 20},
        wave_metrics={"significant_wave_height_m": 1.0},
        alerts={"has_active_cyclone_alert": True},
        vessel_length_m=8.5
    )
    assert safety_override["override_active"] == True
    assert safety_override["risk_score"] == 100

def test_economic_harbor_arbitrage():
    econ_res = economic_service.optimize_trip_economics(
        target_ground={"distance_km": 14.2, "likely_species": ["Bangda", "Surmai"]},
        vessel_profile={"length_m": 8.5, "engine_hp": 9.9},
        fuel_liters=14.0
    )
    assert "best_docking_harbor" in econ_res
    assert econ_res["max_expected_profit_inr"] > 0
    assert len(econ_res["harbor_comparisons"]) >= 1

def test_voice_nlg_multilingual():
    transcript = nlg_service.synthesize_explanation(
        safety_eval={"risk_score": 52, "verdict_label": "MODERATE RISK / CAUTION"},
        pfz_eval={"top_grounds": [{"name": "Area 1 - Malvan Deep Front", "distance_km": 14.2}]},
        weather_metrics={"wind_speed_kmh": 15.0},
        wave_metrics={"significant_wave_height_m": 1.2},
        route_eval={"fuel_consumption_est_liters": 12.0},
        language="Marathi"
    )
    assert "plain_language_text" in transcript
    assert len(transcript["plain_language_text"]) > 0

def test_full_pipeline_orchestrator():
    orchestrator = MultiAgentOrchestrator()
    res = asyncio.run(orchestrator.execute_pipeline(16.0215, 73.4821, vessel_length_m=8.5, language="Marathi"))
    assert res["verdict"] in ["SAFE TO VENTURE", "MODERATE RISK / CAUTION", "DATA_UNAVAILABLE — cannot compute safety"]
    assert "economics" in res
    assert "telemetry" in res
    assert res["telemetry"]["execution_ms"] is not None
