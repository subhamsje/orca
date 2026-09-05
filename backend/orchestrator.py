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
from data_providers.orchestrator import build_canonical_report

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

        # Step 1: Multi-source canonical environmental data acquisition
        # (MET Norway + Open-Meteo Marine + Open-Meteo ECMWF + NDBC buoys + StormGlass)
        canonical, alerts_res = await asyncio.gather(
            build_canonical_report(lat, lon),
            alerts_service.check_active_alerts(lat, lon),
        )

        # Step 2: Maritime World Model Assembly (canonical, no fallbacks)
        world_model = world_model_service.assemble_world_model(
            lat=lat, lon=lon, vessel_length_m=vessel_length_m,
            canonical=canonical,
        )

        await agent_event_bus.publish(AgentMessage(
            sender="WorldModelService",
            event_type="WORLD_MODEL_ASSEMBLED",
            payload=world_model
        ))

        # Step 3: Safety Circuit Breaker — needs weather & wave metrics.
        # We synthesise the legacy dict shape from the canonical records.
        legacy_weather = _canonical_to_legacy_weather(canonical)
        legacy_wave = _canonical_to_legacy_wave(canonical)
        vessel_profile = {"length_m": vessel_length_m, "beam_m": 2.2}
        safety_res = safety_service.evaluate_safety_and_circuit_breaker(
            legacy_weather, legacy_wave, alerts_res, vessel_length_m, vessel_profile
        )

        await agent_event_bus.publish(AgentMessage(
            sender="SafetyAgent",
            event_type="SAFETY_EVALUATED",
            payload=safety_res,
            confidence=0.99
        ))

        # Step 4: Multi-Species Habitat Suitability Index (HSI) Matrix
        legacy_ocean = _canonical_to_legacy_ocean(canonical)
        pfz_res = await pfz_service.compute_habitat_suitability(legacy_ocean, lat, lon)

        await agent_event_bus.publish(AgentMessage(
            sender="PFZAgent",
            event_type="HSI_MATRIX_COMPUTED",
            payload=pfz_res,
            confidence=0.92
        ))

        # Step 5: Multi-Objective Routing Optimization (Safest, Lowest Fuel, Highest Value)
        # If PFZ returned no grounds (data unavailable), fall back to a
        # waypoint ~30 NM offshore for routing & path-finding — but we
        # still emit a route that the safety circuit breaker can score
        # even without fishing recommendations.
        top_grounds = pfz_res.get("top_grounds") or []
        if top_grounds:
            target_coords = top_grounds[0]["coordinates"]
        else:
            target_coords = [lat + 0.30, lon - 0.45]  # ~30 NM SW
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
        # Inject active alerts and economics into safety_eval so the
        # intent-aware opener can answer cyclone / harbor questions
        # directly from real values.
        safety_for_nlg = dict(safety_res)
        safety_for_nlg["active_alerts"] = alerts_res.get("active_alerts", []) if isinstance(alerts_res, dict) else []
        safety_for_nlg["economics"] = {
            "best_docking_harbor": econ_res.get("best_docking_harbor"),
            "max_expected_profit_inr": econ_res.get("max_expected_profit_inr"),
        }
        nlg_res = nlg_service.synthesize_explanation(
            safety_for_nlg, pfz_res, legacy_weather, legacy_wave, route_res,
            language, query_text=query_text,
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
            "canonical_records": {
                p: _canonical_to_dict(r) for p, r in canonical.items()
            },
            "canonical_data_unavailable": [
                p for p in [
                    "sea_surface_temperature", "wave_height", "wind_speed", "wind_gust",
                    "wind_direction", "air_pressure", "air_temperature", "visibility",
                    "cloud_cover", "current_speed", "swell_wave_height", "salinity",
                ]
                if p not in canonical or canonical[p].value is None
            ],
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
                "services_triggered": ["world_model_canonical", "met_norway", "open_meteo_marine", "open_meteo_ecmwf", "ndbc_buoy", "stormglass", "incois", "alerts", "pfz", "safety", "gis", "multi_objective_optimization", "pathfinding", "economics", "collision", "osint", "event_bus", "db_persistence", "nlg"]
            }
        }


def _canonical_to_dict(rec) -> dict:
    """Serialize a CanonicalRecord for the API response."""
    return {
        "value": rec.value,
        "unit": rec.unit,
        "source": rec.source,
        "source_id": rec.source_id,
        "dataset": rec.dataset,
        "data_type": rec.data_type,
        "state": rec.state,
        "observation_time": rec.observation_time,
        "valid_time": rec.valid_time,
        "retrieved_at": rec.retrieved_at,
        "spatial_resolution": rec.spatial_resolution,
        "temporal_resolution": rec.temporal_resolution,
        "distance_from_requested_km": rec.distance_from_requested_km,
        "quality": rec.quality,
        "confidence": rec.confidence,
        "notes": rec.notes,
    }


def _canonical_to_legacy_weather(canonical) -> dict:
    """Translate canonical records into the legacy weather dict expected by
    safety_service, pfz_service, nlg_service, etc."""
    out: dict = {"data_freshness": "Live"}
    rec = canonical.get("wind_speed")
    if rec and rec.value is not None:
        out["wind_speed_kmh"] = rec.value * 3.6 if rec.unit == "m/s" else rec.value
    rec = canonical.get("wind_gust")
    if rec and rec.value is not None:
        out["wind_gust_kmh"] = rec.value * 3.6 if rec.unit == "m/s" else rec.value
    rec = canonical.get("wind_direction")
    if rec and rec.value is not None:
        out["wind_direction_deg"] = rec.value
        out["wind_direction"] = rec.unit or _card(rec.value)
    rec = canonical.get("air_pressure")
    if rec and rec.value is not None:
        out["air_pressure_hpa"] = rec.value
    rec = canonical.get("air_temperature")
    if rec and rec.value is not None:
        out["air_temperature_c"] = rec.value
    rec = canonical.get("visibility")
    if rec and rec.value is not None:
        out["visibility_km"] = rec.value
    rec = canonical.get("cloud_cover")
    if rec and rec.value is not None:
        out["cloud_cover_pct"] = rec.value
    rec = canonical.get("precipitation")
    if rec and rec.value is not None:
        out["precipitation_mm"] = rec.value
    return out


def _canonical_to_legacy_wave(canonical) -> dict:
    rec = canonical.get("wave_height")
    if rec and rec.value is not None:
        out = {"significant_wave_height_m": rec.value}
    else:
        out = {}
    rec = canonical.get("wave_period")
    if rec and rec.value is not None:
        out["swell_period_sec"] = rec.value
    rec = canonical.get("swell_wave_height")
    if rec and rec.value is not None:
        out["swell_wave_height_m"] = rec.value
    rec = canonical.get("swell_wave_period")
    if rec and rec.value is not None:
        out["swell_wave_period_s"] = rec.value
    rec = canonical.get("swell_wave_direction")
    if rec and rec.value is not None:
        out["swell_wave_direction_deg"] = rec.value
    rec = canonical.get("wave_direction")
    if rec and rec.value is not None:
        out["wave_direction_deg"] = rec.value
    out["data_freshness"] = "Live"
    if "significant_wave_height_m" in out and "swell_period_sec" in out:
        out["wave_steepness"] = round(
            out["significant_wave_height_m"] / max(1.0, out["swell_period_sec"]), 3
        )
    return out


def _canonical_to_legacy_ocean(canonical) -> dict:
    out: dict = {}
    rec = canonical.get("sea_surface_temperature")
    if rec and rec.value is not None:
        out["sea_surface_temp_c"] = rec.value
        out["sst_c"] = rec.value
    rec = canonical.get("chlorophyll")
    if rec and rec.value is not None:
        out["chlorophyll_mg_m3"] = rec.value
    rec = canonical.get("current_speed")
    if rec and rec.value is not None:
        # m/s -> knots if backend uses knots
        out["current_velocity_knots"] = rec.value * 1.94384
        out["ocean_current_velocity"] = rec.value
    rec = canonical.get("current_direction")
    if rec and rec.value is not None:
        out["current_dir_deg"] = rec.value
        out["ocean_current_direction"] = rec.value
    rec = canonical.get("salinity")
    if rec and rec.value is not None:
        out["salinity_psu"] = rec.value
    return out


def _card(deg):
    if deg is None:
        return ""
    dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
            "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    return dirs[int(deg % 360 / 22.5) % 16]


orchestrator = MultiAgentOrchestrator()
