"""
Live Ocean & Satellite Imager Ingestion Service.

This service was previously a hardcoded-fallback stub that returned
`sst=28.4, current=0.45, chlorophyll=1.65` whenever the Open-Meteo
endpoint failed. Those fallbacks have been REMOVED (2026-09-03) — when
the live fetch fails the service now returns None for every value, and
provenance flags the failure.

The authoritative path for ocean state is the `data_providers/`
canonical layer; this legacy module is kept only for back-compat with
older tests and is no longer invoked by the orchestrator.
"""

import asyncio
import time
from typing import Dict, Any, Optional
import httpx


OPEN_METEO_MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"


def _now_unix() -> float:
    return time.time()


async def _safe_get(client: httpx.AsyncClient, url: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    try:
        r = await client.get(url, params=params, timeout=4.0)
        if r.status_code != 200:
            return None
        return r.json()
    except Exception:
        return None


class OceanService:
    """Returns None for every value on failure. NEVER invents a fallback."""

    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None

    async def get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=4.0)
        return self._client

    async def fetch_ocean_metrics(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Fetch real-time ocean state. On any failure, returns None for the
        environmental values and a provenance block that flags the failure.

        Production callers should prefer the canonical data layer
        (data_providers.orchestrator.build_canonical_report), which uses
        multiple providers in parallel. This module is retained for tests
        that need a single-tenant call.
        """
        try:
            client = await self.get_client()
            params = {
                "latitude": lat,
                "longitude": lon,
                "hourly": "sea_surface_temperature,ocean_current_velocity,ocean_current_direction",
                "timezone": "auto",
            }
            data = await _safe_get(client, OPEN_METEO_MARINE_URL, params)
        except Exception:
            data = None

        if data is None:
            return {
                "sea_surface_temp_c": None,
                "chlorophyll_mg_m3": None,
                "thermal_gradient_c_km": None,
                "current_velocity_knots": None,
                "upwelling_active": None,
                "dineof_gap_filled": False,
                "data_freshness": "UNAVAILABLE — provider call failed",
                "satellite_provenance": {
                    "satellites": [],
                    "ocean_models": [],
                    "data_freshness": "UNAVAILABLE",
                    "confidence_score": 0.0,
                },
            }

        hourly = data.get("hourly", {})
        sst_list = hourly.get("sea_surface_temperature", [])
        current_speed_list = hourly.get("ocean_current_velocity", [])

        sst = (
            float(sst_list[0]) if sst_list and sst_list[0] is not None else None
        )
        current_speed = (
            float(current_speed_list[0])
            if current_speed_list and current_speed_list[0] is not None
            else None
        )

        return {
            "sea_surface_temp_c": round(sst, 2) if sst is not None else None,
            "chlorophyll_mg_m3": None,  # Open-Meteo does not expose chlorophyll
            "thermal_gradient_c_km": None,
            "current_velocity_knots": (
                round(current_speed * 1.94384, 2)
                if current_speed is not None
                else None
            ),
            "upwelling_active": None,
            "dineof_gap_filled": False,
            "data_freshness": "Live Open-Meteo Marine (current=)",
            "satellite_provenance": {
                "satellites": ["Open-Meteo Marine API"],
                "ocean_models": ["ERA5 wave reanalysis"],
                "data_freshness": "NEAR-REAL-TIME",
                "confidence_score": 0.85,
            },
        }


ocean_service = OceanService()
