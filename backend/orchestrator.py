"""
ORCA 4.0 Multi-Service Orchestrator (DAG Runner)
Executes concurrent fan-out for ocean, weather, wave, disaster alert, economic, and SAR microservices,
with database persistence and WebSocket broadcasting.
"""

import asyncio
import time
from typing import Dict, Any, Optional

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
from services.closed_loop_service import closed_loop_service
from database.repository import db_repository

class MultiAgentOrchestrator:
    async def execute_pipeline(
        self,
        lat: float,
        lon: float,
        vessel_length_m: float = 8.5,
        language: str = "Marathi",
        raw_query: Optional[str] = None,
        vessel_profile: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        t0 = time.time()
        ocean_task = asyncio.create_task(ocean_service.fetch_ocean_metrics(lat, lon))
        weather_task = asyncio.create_task(weather_service.fetch_weather_metrics(lat, lon))
        wave_task = asyncio.create_task(wave_service.fetch_wave_metrics(lat, lon))
        alerts_task = asyncio.create_task(alerts_service.check_active_alerts(lat, lon))

        ocean_res, weather_res, wave_res, alerts_res = await asyncio.gather(
            ocean_task, weather_task, wave_task, alerts_task
        )

        current_weights = closed_loop_service.hsi_weights
        pfz_task = asyncio.create_task(
            pfz_service.compute_habitat_suitability(ocean_res, lat, lon, weights=current_weights)
        )
        gis_res = geofence_service.check_boundaries(lat, lon)
        pfz_res = await pfz_task

        profile = vessel_profile or {"length_m": vessel_length_m, "beam_m": 2.2}
        safety_res = safety_service.evaluate_safety_and_circuit_breaker(
            weather_metrics=weather_res,
            wave_metrics=wave_res,
            alerts=alerts_res,
            vessel_length_m=vessel_length_m,
            vessel_profile=profile
        )

        route_res = pathfinder_service.compute_safest_route(
            start_lat=lat,
            start_lon=lon,
            pfz_grounds=pfz_res,
            geofence_info=gis_res,
            vessel_profile=profile
        )

        target_ground = pfz_res["top_grounds"][0] if pfz_res.get("top_grounds") else {"likely_species": ["Bangda"]}
        economic_res = economic_service.optimize_trip_economics(
            target_ground=target_ground,
            vessel_profile=profile,
            fuel_liters=route_res.get("fuel_consumption_est_liters", 6.4)
        )

        explanation_res = nlg_service.synthesize_explanation(
            safety_eval=safety_res,
            pfz_eval=pfz_res,
            weather_metrics=weather_res,
            wave_metrics=wave_res,
            route_eval=route_res,
            language=language
        )

        try:
            db_repository.save_trip_log(
                lat=lat,
                lon=lon,
                verdict=safety_res["verdict_label"],
                risk_score=safety_res["risk_score"],
                circuit_breaker=safety_res["override_active"],
                vessel_length_m=vessel_length_m
            )
        except Exception:
            pass

        return {
            "coordinate": {"lat": lat, "lon": lon},
            "vessel_length_m": vessel_length_m,
            "language": language,
            "verdict": safety_res["verdict_label"],
            "risk_score": safety_res["risk_score"],
            "circuit_breaker_triggered": safety_res["override_active"],
            "override_reason": safety_res.get("override_reason", None),
            "pfz_grounds": pfz_res["top_grounds"],
            "species_matrix": pfz_res.get("species_matrix", {}),
            "route": route_res,
            "economics": economic_res,
            "geofence_status": gis_res,
            "explanation": explanation_res,
            "provenance": explanation_res["provenance_summary"]
        }

orchestrator = MultiAgentOrchestrator()
