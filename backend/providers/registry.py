"""
ORCA 4.0 real provider implementations.

Each provider:
  - is registered with `register_provider(...)`
  - returns an empty list on any failure (no fabricated data)
  - returns a list of CanonicalRecord on success
  - includes full provenance (source, dataset, observation_time,
    spatial_resolution, etc.)

Currently integrated (no credentials required):

  - met_norway       — MET Norway Locationforecast (yr.no) — atmospheric
  - open_meteo_marine — Open-Meteo Marine API — wave + SST + currents + salinity
  - open_meteo_ecmwf — Open-Meteo ECMWF API — atmospheric + wave reanalysis
  - open_meteo_forecast — Open-Meteo Forecast API — atmospheric fallback
  - ndbc_buoy        — NOAA NDBC realtime buoys — point observations

Credentials REQUIRED (not yet implemented — placeholder Provider records
instruct the operator to set the env var):

  - stormglass       — STORMGLASS_API_KEY
  - copernicus_marine — COPERNICUS_USERNAME + COPERNICUS_PASSWORD
  - nasa_earthdata   — NASA_EARTHDATA_USERNAME + NASA_EARTHDATA_PASSWORD
  - incois_erddap    — INCOIS_API_KEY (we try the public ERDDAP without
                        auth but it requires a working dataset ID; the
                        region is documented but no API key is in scope)
  - imd_mausam       — IMD public RSS — no auth, but a parser is
                        required and is part of Phase 4
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import re

from .base import (
    Provider,
    register_provider,
    safe_get_json,
    get_http_client,
)
from data_providers.canonical import (
    CanonicalRecord,
    NEAR_REAL_TIME,
    NOWCAST,
    FORECAST,
    MODEL,
    SATELLITE,
    BUOY,
    OBSERVED,
    STATION,
    CACHED,
    STALE,
    UNAVAILABLE,
)

log = logging.getLogger("orca.providers.impl")


# --------------------------------------------------------------------------- #
# MET Norway (yr.no) — atmospheric NWP                                         #
# --------------------------------------------------------------------------- #


async def _fetch_met_norway(
    lat: float, lon: float, timestamp: Optional[float] = None
) -> List[CanonicalRecord]:
    data = await safe_get_json(
        "https://api.met.no/weatherapi/locationforecast/2.0/compact",
        params={"lat": lat, "lon": lon},
        headers={"User-Agent": "ORCA-4.0-marine-research, contact@isro.gov.in"},
    )
    if not data:
        return []
    updated_at = data.get("properties", {}).get("meta", {}).get("updated_at")
    obs_time = _parse_iso(updated_at) if updated_at else time.time()
    series = data.get("properties", {}).get("timeseries", [])
    if not series:
        return []
    first = series[0]
    details = first.get("data", {}).get("instant", {}).get("details", {})
    out: List[CanonicalRecord] = []
    age_min = (time.time() - obs_time) / 60
    state = NOWCAST if age_min < 360 else FORECAST

    fields = [
        ("wind_speed", "wind_speed", "m/s", "MET Norway wind"),
        ("wind_direction", "wind_from_direction", "deg", "MET Norway wind"),
        ("air_pressure", "air_pressure_at_sea_level", "hPa", "MET Norway pressure"),
        ("air_temperature", "air_temperature", "°C", "MET Norway temperature"),
        ("cloud_cover", "cloud_area_fraction", "%", "MET Norway cloud"),
        ("relative_humidity", "relative_humidity", "%", "MET Norway RH"),
    ]
    for param, key, unit, _ in fields:
        if key in details:
            out.append(
                CanonicalRecord(
                    parameter=param,
                    value=float(details[key]),
                    unit=unit,
                    latitude=lat,
                    longitude=lon,
                    source="MET Norway (yr.no)",
                    source_id=f"met-norway:{param}",
                    dataset="Locationforecast 2.0 (ECMWF-derived)",
                    data_type=STATION,
                    state=state,
                    observation_time=obs_time,
                    valid_time=obs_time,
                    spatial_resolution="~2.5 km",
                    temporal_resolution="hourly",
                    quality="GOOD",
                    confidence=0.92,
                )
            )
    next_1h = first.get("data", {}).get("next_1_hours", {}).get("details", {})
    if "precipitation_amount" in next_1h:
        out.append(
            CanonicalRecord(
                parameter="precipitation",
                value=float(next_1h["precipitation_amount"]),
                unit="mm",
                latitude=lat,
                longitude=lon,
                source="MET Norway (yr.no)",
                source_id="met-norway:precipitation",
                dataset="Locationforecast 2.0 (next 1h)",
                data_type=STATION,
                state=state,
                observation_time=obs_time,
                valid_time=obs_time,
                spatial_resolution="~2.5 km",
                quality="GOOD",
                confidence=0.85,
            )
        )
    return out


# --------------------------------------------------------------------------- #
# Open-Meteo Marine — waves, SST, currents, salinity                            #
# --------------------------------------------------------------------------- #


async def _fetch_open_meteo_marine(
    lat: float, lon: float, timestamp: Optional[float] = None
) -> List[CanonicalRecord]:
    client = get_http_client()
    try:
        r_a, r_b, r_c = await asyncio.gather(
            client.get(
                "https://marine-api.open-meteo.com/v1/marine",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "current": "wave_height,sea_surface_temperature,ocean_current_velocity,ocean_current_direction",
                    "forecast_days": 1,
                    "timezone": "auto",
                },
                timeout=4.0,
            ),
            client.get(
                "https://marine-api.open-meteo.com/v1/marine",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "hourly": "wave_height,wave_period,swell_wave_height,swell_wave_period,swell_wave_direction,wave_direction",
                    "forecast_days": 1,
                    "timezone": "auto",
                },
                timeout=4.0,
            ),
            client.get(
                "https://marine-api.open-meteo.com/v1/marine",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "hourly": "ocean_current_velocity,ocean_current_direction,sea_surface_temperature,salinity",
                    "forecast_days": 1,
                    "timezone": "auto",
                },
                timeout=4.0,
            ),
        )
    except Exception as e:
        log.debug("open-meteo marine transport error: %s", e)
        return []
    out: List[CanonicalRecord] = []
    if r_a.status_code == 200:
        d = r_a.json()
        cur = d.get("current", {})
        if cur:
            obs = _parse_iso(cur.get("time", "")) if cur.get("time") else time.time()
            for param, key, unit in [
                ("wave_height", "wave_height", "m"),
                ("sea_surface_temperature", "sea_surface_temperature", "°C"),
                ("current_speed", "ocean_current_velocity", "m/s"),
                ("current_direction", "ocean_current_direction", "deg"),
            ]:
                if cur.get(key) is not None:
                    out.append(
                        CanonicalRecord(
                            parameter=param,
                            value=float(cur[key]),
                            unit=unit,
                            latitude=lat,
                            longitude=lon,
                            source="Open-Meteo Marine (ERA5 wave reanalysis + NWP)",
                            source_id=f"open-meteo:marine:current:{key}",
                            dataset="Open-Meteo Marine API current=",
                            data_type=MODEL,
                            state=NEAR_REAL_TIME,
                            observation_time=obs,
                            valid_time=obs,
                            spatial_resolution="~8 km coastal, ~25 km offshore",
                            temporal_resolution="hourly",
                            quality="GOOD",
                            confidence=0.82,
                        )
                    )
    if r_b.status_code == 200:
        d = r_b.json()
        h = d.get("hourly", {})
        times = h.get("time", [])
        if times:
            obs0 = _parse_iso(times[0])
            for param, key, unit in [
                ("wave_period", "wave_period", "s"),
                ("swell_wave_height", "swell_wave_height", "m"),
                ("swell_wave_period", "swell_wave_period", "s"),
                ("swell_wave_direction", "swell_wave_direction", "deg"),
                ("wave_direction", "wave_direction", "deg"),
            ]:
                arr = h.get(key, [])
                if arr and arr[0] is not None:
                    out.append(
                        CanonicalRecord(
                            parameter=param,
                            value=float(arr[0]),
                            unit=unit,
                            latitude=lat,
                            longitude=lon,
                            source="Open-Meteo Marine (ERA5 wave reanalysis + NWP)",
                            source_id=f"open-meteo:marine:hourly:{key}",
                            dataset="Open-Meteo Marine API hourly",
                            data_type=MODEL,
                            state=NEAR_REAL_TIME,
                            observation_time=obs0,
                            valid_time=obs0,
                            spatial_resolution="~8 km",
                            temporal_resolution="hourly",
                            quality="GOOD",
                            confidence=0.78,
                        )
                    )
    if r_c.status_code == 200:
        d = r_c.json()
        h = d.get("hourly", {})
        times = h.get("time", [])
        if times:
            obs0 = _parse_iso(times[0])
            for param, key, unit in [
                ("current_speed", "ocean_current_velocity", "m/s"),
                ("current_direction", "ocean_current_direction", "deg"),
                ("sea_surface_temperature", "sea_surface_temperature", "°C"),
                ("salinity", "salinity", "PSU"),
            ]:
                arr = h.get(key, [])
                if arr and arr[0] is not None:
                    out.append(
                        CanonicalRecord(
                            parameter=param,
                            value=float(arr[0]),
                            unit=unit,
                            latitude=lat,
                            longitude=lon,
                            source="Open-Meteo Marine",
                            source_id=f"open-meteo:marine:hourly:{key}",
                            dataset="Open-Meteo Marine API hourly",
                            data_type=MODEL,
                            state=NEAR_REAL_TIME,
                            observation_time=obs0,
                            valid_time=obs0,
                            spatial_resolution="~8 km",
                            temporal_resolution="hourly",
                            quality="GOOD",
                            confidence=0.78,
                        )
                    )
    return out


# --------------------------------------------------------------------------- #
# Open-Meteo ECMWF — higher-resolution atmospheric NWP                          #
# --------------------------------------------------------------------------- #


async def _fetch_open_meteo_ecmwf(
    lat: float, lon: float, timestamp: Optional[float] = None
) -> List[CanonicalRecord]:
    data = await safe_get_json(
        "https://api.open-meteo.com/v1/ecmwf",
        params={
            "latitude": lat,
            "longitude": lon,
            "hourly": "temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,cloud_cover,total_precipitation,visibility",
            "forecast_days": 1,
        },
    )
    if not data:
        return []
    h = data.get("hourly", {})
    times = h.get("time", [])
    if not times:
        return []
    obs = _parse_iso(times[0])
    out: List[CanonicalRecord] = []
    fields = [
        ("wind_speed", "wind_speed_10m", "m/s", 1),
        ("wind_direction", "wind_direction_10m", "deg", 1),
        ("wind_gust", "wind_gusts_10m", "m/s", 1),
        ("air_pressure", "surface_pressure", "hPa", 1),
        ("air_temperature", "temperature_2m", "°C", 1),
        ("cloud_cover", "cloud_cover", "%", 1),
        ("visibility", "visibility", "m", 0.001),
        ("precipitation", "total_precipitation", "mm", 1),
    ]
    for param, key, unit, scale in fields:
        arr = h.get(key, [])
        if arr and arr[0] is not None:
            value = float(arr[0]) * scale
            if param == "visibility":
                unit = "km"
            out.append(
                CanonicalRecord(
                    parameter=param,
                    value=value,
                    unit=unit,
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


# --------------------------------------------------------------------------- #
# Open-Meteo Forecast — atmospheric fallback                                   #
# --------------------------------------------------------------------------- #


async def _fetch_open_meteo_forecast(
    lat: float, lon: float, timestamp: Optional[float] = None
) -> List[CanonicalRecord]:
    data = await safe_get_json(
        "https://api.open-meteo.com/v1/forecast",
        params={
            "latitude": lat,
            "longitude": lon,
            "current": "wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,temperature_2m,cloud_cover,visibility,relative_humidity_2m,precipitation",
            "hourly": "precipitation",
            "forecast_days": 1,
            "timezone": "auto",
        },
    )
    if not data:
        return []
    cur = data.get("current", {})
    if not cur:
        return []
    obs = _parse_iso(cur.get("time", "")) if cur.get("time") else time.time()
    out: List[CanonicalRecord] = []
    fields = [
        ("wind_speed", "wind_speed_10m", "m/s"),
        ("wind_direction", "wind_direction_10m", "deg"),
        ("wind_gust", "wind_gusts_10m", "m/s"),
        ("air_pressure", "surface_pressure", "hPa"),
        ("air_temperature", "temperature_2m", "°C"),
        ("cloud_cover", "cloud_cover", "%"),
        ("visibility", "visibility", "m"),
        ("relative_humidity", "relative_humidity_2m", "%"),
        ("precipitation", "precipitation", "mm"),
    ]
    for param, key, unit in fields:
        if cur.get(key) is not None:
            value = float(cur[key])
            if param == "visibility":
                value = value / 1000.0
                unit = "km"
            out.append(
                CanonicalRecord(
                    parameter=param,
                    value=value,
                    unit=unit,
                    latitude=lat,
                    longitude=lon,
                    source="Open-Meteo Forecast",
                    source_id=f"open-meteo:forecast:{key}",
                    dataset="Open-Meteo Forecast API (current=)",
                    data_type=MODEL,
                    state=NEAR_REAL_TIME,
                    observation_time=obs,
                    valid_time=obs,
                    spatial_resolution="~1 km",
                    temporal_resolution="hourly",
                    quality="GOOD",
                    confidence=0.88,
                )
            )
    return out


# --------------------------------------------------------------------------- #
# NOAA NDBC buoys — point observations                                          #
# --------------------------------------------------------------------------- #

NDBC_STATIONS = [
    ("23001", 0.0, 81.0),
    ("23002", -7.0, 80.0),
    ("23003", -12.0, 93.0),
    ("23005", -15.0, 80.0),
    ("23006", -10.0, 80.0),
    ("23008", -10.0, 70.0),
    ("23009", -15.0, 75.0),
    ("44008", 40.5, -69.0),
    ("41008", 31.4, -80.9),
    ("32012", -19.7, -85.0),
]


def _haversine_km(lat1, lon1, lat2, lon2) -> float:
    from math import radians, sin, cos, asin, sqrt
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * R * asin(min(1.0, sqrt(a)))


def _nearest_ndbc(lat: float, lon: float, max_km: float = 1200.0) -> Optional[Tuple[str, float, float, float]]:
    best = None
    for st, slat, slon in NDBC_STATIONS:
        d = _haversine_km(lat, lon, slat, slon)
        if d <= max_km and (best is None or d < best[1]):
            best = (st, d, slat, slon)
    return best


async def _fetch_ndbc_buoy(
    lat: float, lon: float, timestamp: Optional[float] = None
) -> List[CanonicalRecord]:
    nearest = _nearest_ndbc(lat, lon)
    if not nearest:
        return []
    station_id, distance_km, station_lat, station_lon = nearest
    try:
        client = get_http_client()
        r = await client.get(
            f"https://www.ndbc.noaa.gov/data/realtime2/{station_id}.spec",
            timeout=4.0,
        )
    except Exception as e:
        log.debug("ndbc transport error: %s", e)
        return []
    if r.status_code != 200:
        return []
    text = r.text.strip()
    if not text:
        return []
    lines = text.splitlines()
    if len(lines) < 3:
        return []
    cols = lines[0].split()
    parts = lines[2].split()
    if len(parts) < len(cols):
        return []
    try:
        yy, mo, dd, hh, mn = (
            int(parts[0]),
            int(parts[1]),
            int(parts[2]),
            int(parts[3]),
            int(parts[4]),
        )
        obs = datetime(2000 + yy, mo, dd, hh, mn, 0).timestamp()
    except Exception:
        return []
    out: List[CanonicalRecord] = []
    col_idx = {c: i for i, c in enumerate(cols)}

    def _f(idx: int) -> Optional[float]:
        if idx >= len(parts):
            return None
        try:
            v = float(parts[idx])
            return v if v < 99.0 else None
        except Exception:
            return None

    def _rec(param: str, value: float, unit: str) -> CanonicalRecord:
        return CanonicalRecord(
            parameter=param,
            value=value,
            unit=unit,
            latitude=station_lat,
            longitude=station_lon,
            distance_from_requested_km=distance_km,
            source=f"NOAA NDBC Buoy {station_id}",
            source_id=f"ndbc:buoy:{station_id}:{param}",
            dataset=f"NDBC Realtime {station_id}",
            data_type=BUOY,
            state=OBSERVED,
            observation_time=obs,
            valid_time=obs,
            spatial_resolution="point measurement",
            temporal_resolution="hourly",
            quality="GOOD" if distance_km < 500 else "FAIR",
            confidence=0.95,
            notes=f"Moored buoy at {station_lat:.2f}°N, {station_lon:.2f}°E; {distance_km:.0f} km from query",
        )

    if "WVHT" in col_idx:
        v = _f(col_idx["WVHT"])
        if v is not None:
            out.append(_rec("wave_height", v, "m"))
    if "SwH" in col_idx:
        v = _f(col_idx["SwH"])
        if v is not None:
            out.append(_rec("swell_wave_height", v, "m"))
    if "SwP" in col_idx:
        v = _f(col_idx["SwP"])
        if v is not None:
            out.append(_rec("swell_wave_period", v, "s"))
    if "WWH" in col_idx:
        v = _f(col_idx["WWH"])
        if v is not None:
            out.append(_rec("wind_wave_height", v, "m"))
    if "WWP" in col_idx:
        v = _f(col_idx["WWP"])
        if v is not None:
            out.append(_rec("wind_wave_period", v, "s"))
    if "MWD" in col_idx:
        v = _f(col_idx["MWD"])
        if v is not None:
            out.append(_rec("wave_direction", v, "deg"))
    return out


# --------------------------------------------------------------------------- #
# StormGlass — requires STORMGLASS_API_KEY                                     #
# --------------------------------------------------------------------------- #


async def _fetch_stormglass(
    lat: float, lon: float, timestamp: Optional[float] = None
) -> List[CanonicalRecord]:
    api_key = os.environ.get("STORMGLASS_API_KEY")
    if not api_key:
        return []
    data = await safe_get_json(
        "https://api.stormglass.io/v2/weather/point",
        params={
            "lat": lat,
            "lng": lon,
            "params": "waveHeight,wavePeriod,swellHeight,swellPeriod,swellDirection,windSpeed,windDirection,gust,airTemperature,pressure,cloudCover,visibility,precipitation",
        },
        headers={"Authorization": api_key},
    )
    if not data:
        return []
    hours = data.get("hours", [])
    if not hours:
        return []
    h = hours[0]
    obs = _parse_iso(h.get("time", ""))
    out: List[CanonicalRecord] = []
    spec = [
        ("wave_height", "waveHeight", "m"),
        ("wave_period", "wavePeriod", "s"),
        ("swell_wave_height", "swellHeight", "m"),
        ("swell_wave_period", "swellPeriod", "s"),
        ("swell_wave_direction", "swellDirection", "deg"),
        ("wind_speed", "windSpeed", "m/s"),
        ("wind_direction", "windDirection", "deg"),
        ("wind_gust", "gust", "m/s"),
        ("air_temperature", "airTemperature", "°C"),
        ("air_pressure", "pressure", "hPa"),
        ("cloud_cover", "cloudCover", "%"),
        ("visibility", "visibility", "km"),
        ("precipitation", "precipitation", "mm"),
    ]
    for param, key, unit in spec:
        entry = h.get(key) or {}
        val = (
            entry.get("sg")
            or entry.get("noaa")
            or entry.get("meto")
            or entry.get("fcoo")
            or entry.get("meteo")
        )
        if val is None:
            continue
        if param == "visibility" and val > 100:
            val = val / 1000.0
        out.append(
            CanonicalRecord(
                parameter=param,
                value=float(val),
                unit=unit,
                latitude=lat,
                longitude=lon,
                source="StormGlass (multi-NWP blend)",
                source_id=f"stormglass:{key}",
                dataset="StormGlass weather/point (NOAA + DWD + MET Norway blend)",
                data_type=MODEL,
                state=NEAR_REAL_TIME,
                observation_time=obs,
                valid_time=obs,
                spatial_resolution="point query",
                temporal_resolution="hourly",
                quality="GOOD",
                confidence=0.9,
            )
        )
    return out


# --------------------------------------------------------------------------- #
# Helpers                                                                     #
# --------------------------------------------------------------------------- #


def _parse_iso(s: str) -> float:
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
    except Exception:
        return time.time()


# --------------------------------------------------------------------------- #
# Register all providers                                                      #
# --------------------------------------------------------------------------- #


register_provider(
    Provider(
        provider_id="met_norway",
        display_name="MET Norway (yr.no) Locationforecast",
        fetch_fn=_fetch_met_norway,
        parameters=[
            "wind_speed",
            "wind_direction",
            "wind_gust",
            "air_pressure",
            "air_temperature",
            "cloud_cover",
            "relative_humidity",
            "precipitation",
        ],
        priority=10,
        timeout_s=4.0,
    )
)
register_provider(
    Provider(
        provider_id="open_meteo_marine",
        display_name="Open-Meteo Marine (ERA5 wave reanalysis + NWP)",
        fetch_fn=_fetch_open_meteo_marine,
        parameters=[
            "wave_height",
            "wave_period",
            "swell_wave_height",
            "swell_wave_period",
            "swell_wave_direction",
            "wave_direction",
            "sea_surface_temperature",
            "current_speed",
            "current_direction",
            "salinity",
        ],
        priority=20,
        timeout_s=5.0,
    )
)
register_provider(
    Provider(
        provider_id="open_meteo_ecmwf",
        display_name="Open-Meteo ECMWF IFS 0.25°",
        fetch_fn=_fetch_open_meteo_ecmwf,
        parameters=[
            "wind_speed",
            "wind_direction",
            "wind_gust",
            "air_pressure",
            "air_temperature",
            "cloud_cover",
            "visibility",
            "precipitation",
        ],
        priority=30,
        timeout_s=4.0,
    )
)
register_provider(
    Provider(
        provider_id="open_meteo_forecast",
        display_name="Open-Meteo Forecast (current=)",
        fetch_fn=_fetch_open_meteo_forecast,
        parameters=[
            "wind_speed",
            "wind_direction",
            "wind_gust",
            "air_pressure",
            "air_temperature",
            "cloud_cover",
            "visibility",
            "relative_humidity",
            "precipitation",
        ],
        priority=40,
        timeout_s=4.0,
    )
)
register_provider(
    Provider(
        provider_id="ndbc_buoy",
        display_name="NOAA NDBC Realtime Buoys",
        fetch_fn=_fetch_ndbc_buoy,
        parameters=[
            "wave_height",
            "swell_wave_height",
            "swell_wave_period",
            "wind_wave_height",
            "wind_wave_period",
            "wave_direction",
        ],
        priority=15,
        timeout_s=4.0,
    )
)
register_provider(
    Provider(
        provider_id="stormglass",
        display_name="StormGlass (multi-NWP blend) — REQUIRES STORMGLASS_API_KEY",
        fetch_fn=_fetch_stormglass,
        parameters=[
            "wave_height",
            "wave_period",
            "swell_wave_height",
            "swell_wave_period",
            "swell_wave_direction",
            "wind_speed",
            "wind_direction",
            "wind_gust",
            "air_temperature",
            "air_pressure",
            "cloud_cover",
            "visibility",
            "precipitation",
        ],
        requires_credentials=["STORMGLASS_API_KEY"],
        priority=5,
        timeout_s=4.0,
    )
)


def get_provider(provider_id: str) -> Optional[Provider]:
    return next((p for p in PROVIDERS.values() if p.provider_id == provider_id), None)


__all__ = [
    "get_provider",
    "list_providers",
]
