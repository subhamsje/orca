"""
Async Multi-Agent Orchestrator DAG & Event Bus Engine
Coordinates parallel execution of specialist agents:
- MaritimeWorldModelService (Vessel Twin, Ocean State, Risk State, Geofences)
- OceanService (SST, Chlorophyll, Currents)
- WeatherService (Winds, Gusts)
- WaveService (Hs, Swell Period)
- AlertsService (IMD Cyclone Alerts)
- SafetyAgent (Digital Twin Capsizing Rules)
- PFZAgent (Multi-Species Bio-Thermal Envelope)
- MultiObjectiveOptimizationEngine (Pareto-Optimal Safest / Fuel / Value Routes)
- PathfinderService (A* Geofence & Hazard Detour)
- EconomicService (Multi-Harbor Net ROI)
- CollisionAvoidanceAgent (CPA/TCPA Guard)
- OSINTAgent (NASA VIIRS, AGMARKNET, Security Alerts)
- NLGService (Plain-Language Voice Translation)
- AgentEventBus (Inter-agent event log & provenance)
"""

import asyncio
import time
from typing import Dict, Any

from services.ocean_service import ocean_service
from services.weather_service import weather_service
from services.wave_service import wave_service
from services.alerts_service import alerts_service
from services.pfz_service import pfz_service
from services.safety_service import safety_service
from services.geofence_service import geofence_service
from services.pathfinder_service import pathfinder_service
from services.nlg_service import nlg_service
from services.economic_service import economic_service
from services.collision_service import collision_service
from services.osint_service import osint_service
from services.event_bus import agent_event_bus, AgentMessage
from services.world_model_service import world_model_service
from services.optimization_engine_service import optimization_engine
from database.repository import db_repository

class MultiAgentOrchestrator:
    async def execute_pipeline(
        self,
        lat: float,
        lon: float,
        vessel_length_m: float = 8.5,
        language: str = "Marathi",
        query_text: str = None
    ) -> Dict[str, Any]:
        t0 = time.time()

        # Step 1: Parallel async environmental data ingestion
        ocean_res, weather_res, wave_res, alerts_res = await asyncio.gather(
            ocean_service.fetch_ocean_metrics(lat, lon),
            weather_service.fetch_weather_metrics(lat, lon),
            wave_service.fetch_wave_metrics(lat, lon),
            alerts_service.check_active_alerts(lat, lon)
        )

        # Step 2: Maritime World Model Assembly
        world_model = world_model_service.assemble_world_model(
            lat=lat, lon=lon, vessel_length_m=vessel_length_m,
            ocean_metrics=ocean_res, weather_metrics=weather_res, wave_metrics=wave_res
        )

        await agent_event_bus.publish(AgentMessage(
            sender="WorldModelService",
            event_type="WORLD_MODEL_ASSEMBLED",
            payload=world_model
        ))

        # Step 3: Safety Circuit Breaker & Hydrodynamics Evaluation
        vessel_profile = {"length_m": vessel_length_m, "beam_m": 2.2}
        safety_res = safety_service.evaluate_safety_and_circuit_breaker(
            weather_res, wave_res, alerts_res, vessel_length_m, vessel_profile
        )

        await agent_event_bus.publish(AgentMessage(
            sender="SafetyAgent",
            event_type="SAFETY_EVALUATED",
            payload=safety_res,
            confidence=0.99
        ))

        # Step 4: Multi-Species Habitat Suitability Index (HSI) Matrix
        pfz_res = await pfz_service.compute_habitat_suitability(ocean_res, lat, lon)

        await agent_event_bus.publish(AgentMessage(
            sender="PFZAgent",
            event_type="HSI_MATRIX_COMPUTED",
            payload=pfz_res,
            confidence=0.92
        ))

        # Step 5: Multi-Objective Routing Optimization (Safest, Lowest Fuel, Highest Value)
        target_coords = pfz_res["top_grounds"][0]["coordinates"]
        multi_route_res = optimization_engine.solve_multi_objective_routes(
            origin_lat=lat, origin_lon=lon, target_lat=target_coords[0], target_lon=target_coords[1], vessel_length_m=vessel_length_m
        )
        route_res = pathfinder_service.compute_optimal_path([lat, lon], target_coords, vessel_length_m)

        # Step 6: Multi-Harbor Eco-Economic ROI Optimizer
        econ_res = economic_service.compute_trip_roi(
            vessel_profile=vessel_profile,
            target_species="Bangda (Mackerel)",
            est_catch_kg=85.0,
            origin_lat=lat,
            origin_lon=lon
        )

        # Step 7: Predictive CPA/TCPA Collision Avoidance Guard
        collision_res = collision_service.calculate_cpa_tcpa(
            own_lat=lat, own_lon=lon, own_speed_knots=8.0, own_cog_deg=240.0,
            target_lat=lat + 0.015, target_lon=lon - 0.015, target_speed_knots=12.0, target_cog_deg=160.0
        )

        # Step 8: Maritime OSINT Sector Intelligence Correlation
        osint_res = osint_service.correlate_sector_intelligence(lat, lon, radius_km=30.0)

        # Step 9: Natural Language Synthesizer (NLG Voice)
        nlg_res = nlg_service.synthesize_explanation(
            safety_res, pfz_res, weather_res, wave_res, route_res, language
        )

        # Step 10: Persistent SQLite Audit Log Storage
        db_repository.save_trip_log(
            lat=lat, lon=lon,
            verdict=safety_res["verdict_label"],
            risk_score=safety_res["risk_score"],
            circuit_breaker=safety_res["override_active"],
            vessel_length_m=vessel_length_m
        )

        dt_ms = (time.time() - t0) * 1000.0

        return {
            "coordinate": {"lat": lat, "lon": lon},
            "vessel_length_m": vessel_length_m,
            "language": language,
            "verdict": safety_res["verdict_label"],
            "risk_score": safety_res["risk_score"],
            "circuit_breaker_triggered": safety_res["override_active"],
            "override_reason": safety_res.get("override_reason"),
            "world_model": world_model,
            "pfz_grounds": pfz_res["top_grounds"],
            "species_matrix": pfz_res["species_matrix"],
            "route": route_res,
            "multi_objective_routes": multi_route_res,
            "economics": econ_res,
            "collision_guard": collision_res,
            "osint_sector_intelligence": osint_res,
            "geofence_status": geofence_service.inspect_coordinates(lat, lon),
            "explanation": nlg_res,
            "provenance": world_model["provenance"],
            "inter_agent_event_bus": agent_event_bus.get_event_history(limit=10),
            "telemetry": {
                "execution_ms": round(dt_ms, 2),
                "services_triggered": ["world_model", "ocean", "weather", "wave", "alerts", "pfz", "safety", "gis", "multi_objective_optimization", "pathfinding", "economics", "collision", "osint", "event_bus", "db_persistence", "nlg"]
            }
        }

orchestrator = MultiAgentOrchestrator()
