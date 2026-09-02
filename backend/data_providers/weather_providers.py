"""
ORCA 4.0 Atmospheric Data Providers.

Each provider exposes a fetch function that returns a list[CanonicalRecord]
or an empty list on failure. Never invent data; return an empty list and
the source selector will mark state=UNAVAILABLE.
"""

from __future__ import annotations

import logging
import time
from typing import List
import httpx

from .canonical import (
    CanonicalRecord,
    NEAR_REAL_TIME,
    NOWCAST,
    MODEL,
    SATELLITE,
    STATION,
    BUOY,
    OBSERVED,
    FORECAST,
    UNAVAILABLE,
)

log = logging.getLogger("orca.providers.atmos")


def _now() -> float:
    return time.time()


def _http() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        timeout=6.0,
        headers={"User-Agent": "ORCA-4.0/marine-decision"},
    )


# --------------------------------------------------------------------------- #
# 1) MET Norway Locationforecast (yr.no) — best free NWP, 6h forecasts
# --------------------------------------------------------------------------- #

async def fetch_met_norway(lat: float, lon: float) -> List[CanonicalRecord]:
    """MET Norway's yr.no Locationforecast is ECMWF-derived, free, no API key."""
    try:
        async with _http() as c:
            r = await c.get(
                "https://api.met.no/weatherapi/locationforecast/2.0/compact",
                params={"lat": lat, "lon": lon},
                headers={"User-Agent": "ORCA-4.0-marine-research, contact@isro.gov.in"},
            )
        if r.status_code != 200:
            return []
        d = r.json()
        updated_at = d.get("properties", {}).get("meta", {}).get("updated_at")
        obs_time = _parse_iso(updated_at) if updated_at else _now()
        series = d.get("properties", {}).get("timeseries", [])
        # First entry is the most-recent nowcast.
        if not series:
            return []
        first = series[0]
        details = first.get("data", {}).get("instant", {}).get("details", {})
        out: List[CanonicalRecord] = []
        age_min = (_now() - obs_time) / 60
        freshness_state = NOWCAST if age_min < 60 else FORECAST

        if "wind_speed" in details:
            out.append(
                CanonicalRecord(
                    parameter="wind_speed",
                    value=float(details["wind_speed"]),
                    unit="m/s",
                    latitude=lat,
                    longitude=lon,
                    source="MET Norway (yr.no)",
                    source_id="met-norway:wind",
                    dataset="Locationforecast 2.0 (ECMWF-derived)",
                    data_type=STATION,
                    state=freshness_state,
                    observation_time=obs_time,
                    valid_time=obs_time,
                    spatial_resolution="~2.5 km",
                    temporal_resolution="hourly",
                    quality="GOOD",
                    confidence=0.92,
                    notes="ECMWF-derived NWP via MET Norway public API",
                )
            )
        if "wind_from_direction" in details:
            out.append(
                CanonicalRecord(
                    parameter="wind_direction",
                    value=float(details["wind_from_direction"]),
                    unit="deg",
                    latitude=lat,
                    longitude=lon,
                    source="MET Norway (yr.no)",
                    source_id="met-norway:wind",
                    dataset="Locationforecast 2.0",
                    data_type=STATION,
                    state=freshness_state,
                    observation_time=obs_time,
                    valid_time=obs_time,
                    spatial_resolution="~2.5 km",
                    quality="GOOD",
                    confidence=0.92,
                )
            )
        if "air_pressure_at_sea_level" in details:
            out.append(
                CanonicalRecord(
                    parameter="air_pressure",
                    value=float(details["air_pressure_at_sea_level"]),
                    unit="hPa",
                    latitude=lat,
                    longitude=lon,
                    source="MET Norway (yr.no)",
                    source_id="met-norway:pressure",
                    dataset="Locationforecast 2.0",
                    data_type=STATION,
                    state=freshness_state,
                    observation_time=obs_time,
                    valid_time=obs_time,
                    spatial_resolution="~2.5 km",
                    quality="GOOD",
                    confidence=0.95,
                )
            )
        if "air_temperature" in details:
            out.append(
                CanonicalRecord(
                    parameter="air_temperature",
                    value=float(details["air_temperature"]),
                    unit="°C",
                    latitude=lat,
                    longitude=lon,
                    source="MET Norway (yr.no)",
                    source_id="met-norway:temp",
                    dataset="Locationforecast 2.0",
                    data_type=STATION,
                    state=freshness_state,
                    observation_time=obs_time,
                    valid_time=obs_time,
                    spatial_resolution="~2.5 km",
                    quality="GOOD",
                    confidence=0.94,
                )
            )
        if "cloud_area_fraction" in details:
            out.append(
                CanonicalRecord(
                    parameter="cloud_cover",
                    value=float(details["cloud_area_fraction"]),
                    unit="%",
                    latitude=lat,
                    longitude=lon,
                    source="MET Norway (yr.no)",
                    source_id="met-norway:cloud",
                    dataset="Locationforecast 2.0",
                    data_type=STATION,
                    state=freshness_state,
                    observation_time=obs_time,
                    valid_time=obs_time,
                    quality="GOOD",
                    confidence=0.92,
                )
            )
        if "relative_humidity" in details:
            out.append(
                CanonicalRecord(
                    parameter="relative_humidity",
                    value=float(details["relative_humidity"]),
                    unit="%",
                    latitude=lat,
                    longitude=lon,
                    source="MET Norway (yr.no)",
                    source_id="met-norway:rh",
                    dataset="Locationforecast 2.0",
                    data_type=STATION,
                    state=freshness_state,
                    observation_time=obs_time,
                    valid_time=obs_time,
                    quality="GOOD",
                    confidence=0.92,
                )
            )
        if "precipitation_amount" in first.get("data", {}).get("next_1_hours", {}).get("details", {}):
            precip = first["data"]["next_1_hours"]["details"]["precipitation_amount"]
            out.append(
                CanonicalRecord(
                    parameter="precipitation",
                    value=float(precip),
                    unit="mm",
                    latitude=lat,
                    longitude=lon,
                    source="MET Norway (yr.no)",
                    source_id="met-norway:precip",
                    dataset="Locationforecast 2.0 (next 1h)",
                    data_type=STATION,
                    state=freshness_state,
                    observation_time=obs_time,
                    valid_time=obs_time,
                    quality="GOOD",
                    confidence=0.85,
                )
            )
        return out
    except Exception as e:
        log.debug(f"met-norway failed: {e}")
        return []


# --------------------------------------------------------------------------- #
# 2) Open-Meteo Forecast (multi-model NWP) — for parameters yr.no doesn't expose
# --------------------------------------------------------------------------- #

async def fetch_open_meteo_forecast(lat: float, lon: float) -> List[CanonicalRecord]:
    try:
        async with _http() as c:
            r = await c.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "current": "wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,temperature_2m,cloud_cover,visibility,relative_humidity_2m,precipitation",
                    "hourly": "precipitation,wind_speed_10m,wind_gusts_10m",
                    "forecast_days": 1,
                    "timezone": "auto",
                },
            )
        if r.status_code != 200:
            return []
        d = r.json()
        cur = d.get("current", {})
        ts = cur.get("time")
        obs = _parse_iso(ts) if ts else _now()
        out: List[CanonicalRecord] = []
        fields = [
            ("wind_speed", "wind_speed_10m", "m/s", "Open-Meteo Forecast Wind"),
            ("wind_direction", "wind_direction_10m", "deg", "Open-Meteo Forecast Wind"),
            ("wind_gust", "wind_gusts_10m", "m/s", "Open-Meteo Forecast Wind"),
            ("air_pressure", "surface_pressure", "hPa", "Open-Meteo Forecast Pressure"),
            ("air_temperature", "temperature_2m", "°C", "Open-Meteo Forecast Temperature"),
            ("cloud_cover", "cloud_cover", "%", "Open-Meteo Forecast Cloud"),
            ("visibility", "visibility", "m", "Open-Meteo Forecast Visibility"),
            ("relative_humidity", "relative_humidity_2m", "%", "Open-Meteo Forecast Humidity"),
        ]
        for param, key, unit, label in fields:
            if key in cur and cur[key] is not None:
                out.append(
                    CanonicalRecord(
                        parameter=param,
                        value=float(cur[key]) if param != "visibility" else float(cur[key]) / 1000.0,
                        unit="km" if param == "visibility" else unit,
                        latitude=lat,
                        longitude=lon,
                        source="Open-Meteo Forecast",
                        source_id=f"open-meteo:forecast:{key}",
                        dataset="Open-Meteo Forecast API (current=)",
                        data_type=STATION,
                        state=NEAR_REAL_TIME if (time.time() - obs) < 1800 else NOWCAST,
                        observation_time=obs,
                        valid_time=obs,
                        spatial_resolution="~1 km",
                        quality="GOOD",
                        confidence=0.88,
                    )
                )
        if "precipitation" in cur and cur["precipitation"] is not None:
            out.append(
                CanonicalRecord(
                    parameter="precipitation",
                    value=float(cur["precipitation"]),
                    unit="mm",
                    latitude=lat,
                    longitude=lon,
                    source="Open-Meteo Forecast",
                    source_id="open-meteo:forecast:precip",
                    dataset="Open-Meteo Forecast current precipitation",
                    data_type=STATION,
                    state=NEAR_REAL_TIME,
                    observation_time=obs,
                    valid_time=obs,
                    quality="GOOD",
                    confidence=0.85,
                )
            )
        return out
    except Exception as e:
        log.debug(f"open-meteo forecast failed: {e}")
        return []


# --------------------------------------------------------------------------- #
# 3) Open-Meteo ECMWF (high-res NWP for Indian Ocean)
# --------------------------------------------------------------------------- #

async def fetch_open_meteo_ecmwf(lat: float, lon: float) -> List[CanonicalRecord]:
    try:
        async with _http() as c:
            r = await c.get(
                "https://api.open-meteo.com/v1/ecmwf",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "hourly": "temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,cloud_cover,total_precipitation,visibility",
                    "forecast_days": 1,
                },
            )
        if r.status_code != 200:
            return []
        d = r.json()
        h = d.get("hourly", {})
        times = h.get("time", [])
        if not times:
            return []
        out: List[CanonicalRecord] = []
        for i, t in enumerate(times):
            obs = _parse_iso(t)
            break
        fields = [
            ("wind_speed", "wind_speed_10m", "m/s", "km/h", 3.6),
            ("wind_direction", "wind_direction_10m", "deg", "deg", 1),
            ("wind_gust", "wind_gusts_10m", "m/s", "km/h", 3.6),
            ("air_pressure", "surface_pressure", "hPa", "hPa", 1),
            ("air_temperature", "temperature_2m", "°C", "°C", 1),
            ("cloud_cover", "cloud_cover", "%", "%", 1),
            ("visibility", "visibility", "m", "km", 0.001),
            ("precipitation", "total_precipitation", "mm", "mm", 1),
        ]
        for param, key, src_unit, dst_unit, scale in fields:
            arr = h.get(key, [])
            if arr and arr[0] is not None:
                out.append(
                    CanonicalRecord(
                        parameter=param,
                        value=float(arr[0]) * scale,
                        unit=dst_unit,
                        latitude=lat,
                        longitude=lon,
                        source="Open-Meteo ECMWF",
                        source_id=f"open-meteo:ecmwf:{key}",
                        dataset="ECMWF IFS 0.25° via Open-Meteo",
                        data_type=MODEL,
                        state=NEAR_REAL_TIME,
                        observation_time=obs,
                        valid_time=obs,
                        spatial_resolution="~25 km",
                        temporal_resolution="hourly",
                        quality="GOOD",
                        confidence=0.85,
                    )
                )
        return out
    except Exception as e:
        log.debug(f"open-meteo ecmwf failed: {e}")
        return []


def _parse_iso(s: str) -> float:
    from datetime import datetime
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
    except Exception:
        return _now()