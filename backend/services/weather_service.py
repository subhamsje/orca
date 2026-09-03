"""
Live Weather & Surface Wind Ingestion Microservice.

This service used to return `wind=16.5, gust=22, pressure=1012, temp=28,
cloud=45, vis=10` whenever the Open-Meteo call failed. Those hardcoded
fallbacks have been REMOVED (2026-09-03). On any failure the service now
returns None for every value.

The authoritative path is the canonical data layer
(data_providers/weather_providers.py), which queries multiple providers
in parallel and includes MET Norway (yr.no), Open-Meteo ECMWF, and
Open-Meteo Forecast.
"""

from typing import Dict, Any, Optional
import httpx


OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"


def _cardinal(deg: Optional[float]) -> Optional[str]:
    if deg is None:
        return None
    dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
            "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    return dirs[int((deg % 360) / 22.5) % 16]


async def _safe_get(client: httpx.AsyncClient, url: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    try:
        r = await client.get(url, params=params, timeout=4.0)
        if r.status_code != 200:
            return None
        return r.json()
    except Exception:
        return None


class WeatherService:
    """Returns None for every value on failure. NEVER invents a fallback."""

    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None

    async def get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=4.0)
        return self._client

    async def fetch_weather_metrics(self, lat: float, lon: float) -> Dict[str, Any]:
        try:
            client = await self.get_client()
            params = {
                "latitude": lat,
                "longitude": lon,
                "current": "wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,temperature_2m,cloud_cover,visibility",
                "hourly": "wind_speed_10m,wind_direction_10m,wind_gusts_10m",
                "timezone": "auto",
            }
            data = await _safe_get(client, OPEN_METEO_FORECAST_URL, params)
        except Exception:
            data = None

        if data is None:
            return {
                "wind_speed_kmh": None,
                "wind_direction": None,
                "wind_direction_deg": None,
                "wind_gust_kmh": None,
                "air_pressure_hpa": None,
                "air_temperature_c": None,
                "cloud_cover_pct": None,
                "visibility_km": None,
                "data_freshness": "UNAVAILABLE — provider call failed",
            }

        cur = (data.get("current") or {})
        hourly = data.get("hourly") or {}

        def _maybe_current_or_hourly(key: str):
            v = cur.get(key)
            if v is not None:
                return v
            arr = hourly.get(key) or []
            if arr:
                return arr[0]
            return None

        w_speed = _maybe_current_or_hourly("wind_speed_10m")
        w_dir = _maybe_current_or_hourly("wind_direction_10m")
        w_gust = _maybe_current_or_hourly("wind_gusts_10m")
        pressure = cur.get("surface_pressure")
        air_temp = cur.get("temperature_2m")
        cloud = cur.get("cloud_cover")
        visibility_raw = cur.get("visibility")

        return {
            "wind_speed_kmh": round(float(w_speed), 1) if w_speed is not None else None,
            "wind_direction": _cardinal(float(w_dir)) if w_dir is not None else None,
            "wind_direction_deg": round(float(w_dir), 0) if w_dir is not None else None,
            "wind_gust_kmh": round(float(w_gust), 1) if w_gust is not None else None,
            "air_pressure_hpa": round(float(pressure), 1) if pressure is not None else None,
            "air_temperature_c": round(float(air_temp), 1) if air_temp is not None else None,
            "cloud_cover_pct": round(float(cloud), 0) if cloud is not None else None,
            "visibility_km": round(float(visibility_raw) / 1000.0, 1) if visibility_raw is not None else None,
            "data_freshness": "Live Open-Meteo Forecast Stream",
        }


weather_service = WeatherService()
