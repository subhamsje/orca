"""
Live Ocean Wave & Swell Hydrodynamics Ingestion Microservice.

This service used to return `swh=1.1, period=10.5, swell_h=0.7*hs` whenever
the Open-Meteo Marine call failed. Those hardcoded fallbacks have been
REMOVED (2026-09-03). On any failure the service now returns None for
every value. The authoritative path is the canonical data layer
(data_providers/).
"""

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


class WaveService:
    """Returns None for every value on failure. NEVER invents a fallback."""

    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None

    async def get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=4.0)
        return self._client

    async def fetch_wave_metrics(self, lat: float, lon: float) -> Dict[str, Any]:
        try:
            client = await self.get_client()
            params = {
                "latitude": lat,
                "longitude": lon,
                "hourly": "wave_height,wave_period,swell_wave_height,swell_wave_period,swell_wave_direction,wave_direction",
                "forecast_days": 1,
                "timezone": "auto",
            }
            data = await _safe_get(client, OPEN_METEO_MARINE_URL, params)
        except Exception:
            data = None

        if data is None:
            return {
                "significant_wave_height_m": None,
                "swell_period_sec": None,
                "swell_wave_height_m": None,
                "swell_wave_period_s": None,
                "swell_wave_direction_deg": None,
                "wave_direction_deg": None,
                "wave_steepness": None,
                "data_freshness": "UNAVAILABLE — provider call failed",
            }

        hourly = data.get("hourly", {})
        swh_list = hourly.get("wave_height", [])
        period_list = hourly.get("wave_period", [])
        swell_h_list = hourly.get("swell_wave_height", [])
        swell_p_list = hourly.get("swell_wave_period", [])
        swell_d_list = hourly.get("swell_wave_direction", [])
        wave_d_list = hourly.get("wave_direction", [])

        def _f(arr: list) -> Optional[float]:
            if arr and arr[0] is not None:
                try:
                    return float(arr[0])
                except Exception:
                    return None
            return None

        swh = _f(swh_list)
        period = _f(period_list)
        swell_h = _f(swell_h_list)
        swell_p = _f(swell_p_list)
        swell_d = _f(swell_d_list)
        wave_d = _f(wave_d_list)

        return {
            "significant_wave_height_m": round(swh, 2) if swh is not None else None,
            "swell_period_sec": round(period, 1) if period is not None else None,
            "swell_wave_height_m": round(swell_h, 2) if swell_h is not None else None,
            "swell_wave_period_s": round(swell_p, 1) if swell_p is not None else None,
            "swell_wave_direction_deg": round(swell_d, 0) if swell_d is not None else None,
            "wave_direction_deg": round(wave_d, 0) if wave_d is not None else None,
            "wave_steepness": (
                round(swh / max(1.0, period), 3)
                if swh is not None and period is not None
                else None
            ),
            "data_freshness": "Live Open-Meteo Marine (hourly=)",
        }


wave_service = WaveService()
