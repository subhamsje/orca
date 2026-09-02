"""
ORCA 4.0 Marine / Wave / Ocean providers.

- Open-Meteo Marine (ERA5 wave reanalysis + NWP)
- NOAA NDBC realtime buoys (for nearby real observations)
- INCOIS ERDDAP (if reachable)
- StormGlass (free tier, 50 req/day — env var STORMGLASS_API_KEY)
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
from datetime import datetime
from typing import List, Optional
import httpx

from .canonical import (
    CanonicalRecord,
    NEAR_REAL_TIME,
    NOWCAST,
    MODEL,
    SATELLITE,
    BUOY,
    OBSERVED,
    FORECAST,
    UNAVAILABLE,
)

log = logging.getLogger("orca.providers.marine")


def _http() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        timeout=6.0,
        headers={"User-Agent": "ORCA-4.0/marine-research"},
    )


def _parse_iso(s: str) -> float:
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
    except Exception:
        return time.time()


# --------------------------------------------------------------------------- #
# 1) Open-Meteo Marine (SST, waves, swell, currents, salinity)
# --------------------------------------------------------------------------- #

async def fetch_open_meteo_marine(lat: float, lon: float) -> List[CanonicalRecord]:
    """Open-Meteo Marine API — two parallel calls because combining all
    current= + hourly= parameters in one request returns HTTP 400.

    Also note: the hourly= parameter block is restricted — too many
    parameters returns an empty response. We split the hourly fields into
    two calls (wave group + current/salinity group).
    """
    out: List[CanonicalRecord] = []
    try:
        async with _http() as c:
            r_a, r_b, r_c = await asyncio.gather(
                c.get(
                    "https://marine-api.open-meteo.com/v1/marine",
                    params={
                        "latitude": lat,
                        "longitude": lon,
                        "current": "wave_height,sea_surface_temperature,ocean_current_velocity,ocean_current_direction",
                        "forecast_days": 1,
                        "timezone": "auto",
                    },
                ),
                c.get(
                    "https://marine-api.open-meteo.com/v1/marine",
                    params={
                        "latitude": lat,
                        "longitude": lon,
                        "hourly": "wave_height,wave_period,swell_wave_height,swell_wave_period,swell_wave_direction,wave_direction",
                        "forecast_days": 1,
                        "timezone": "auto",
                    },
                ),
                c.get(
                    "https://marine-api.open-meteo.com/v1/marine",
                    params={
                        "latitude": lat,
                        "longitude": lon,
                        "hourly": "ocean_current_velocity,ocean_current_direction,sea_surface_temperature,salinity",
                        "forecast_days": 1,
                        "timezone": "auto",
                    },
                ),
            )
        # Process A
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
                                notes="Nowcast from NWP; current values from satellite+model blend",
                            )
                        )

        # Process B (wave hourly group)
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

        # Process C (current/salinity hourly group)
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
        return out
    except Exception as e:
        log.debug(f"open-meteo marine failed: {e}")
        return []


# --------------------------------------------------------------------------- #
# 2) NOAA NDBC realtime buoys
# --------------------------------------------------------------------------- #

# A small set of Indian Ocean / global buoys for fallback observation.
NDBC_STATIONS = [
    ("23001",  0.0,   81.0),    # Bay of Bengal equatorial
    ("23002", -7.0,   80.0),    # South Indian Ocean
    ("23003", -12.0,  93.0),    # South Indian Ocean
    ("23005", -15.0,  80.0),
    ("23006", -10.0,  80.0),
    ("23008", -10.0,  70.0),
    ("23009", -15.0,  75.0),
    ("44008",  40.5,  -69.0),   # NE US shelf (used as global example)
    ("41008",  31.4,  -80.9),
    ("32012", -19.7, -85.0),
]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    from math import radians, sin, cos, asin, sqrt
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * R * asin(sqrt(a))


def _nearest_ndbc_station(lat: float, lon: float, max_km: float = 1200.0) -> Optional[tuple]:
    best = None
    for st, slat, slon in NDBC_STATIONS:
        d = haversine_km(lat, lon, slat, slon)
        if d <= max_km and (best is None or d < best[1]):
            best = (st, d)
    return best


async def fetch_ndbc_buoy(lat: float, lon: float) -> List[CanonicalRecord]:
    """Fetch the nearest NDBC buoy. Returns a list of CanonicalRecord with
    data_type=BUOY. If the nearest station is over 1200 km away, returns
    empty (so the source selector will fall back to NWP)."""
    nearest = _nearest_ndbc_station(lat, lon)
    if not nearest:
        return []
    station_id, distance_km = nearest
    try:
        async with _http() as c:
            r = await c.get(
                f"https://www.ndbc.noaa.gov/data/realtime2/{station_id}.spec",
            )
        if r.status_code != 200 or not r.text:
            return []
        lines = r.text.strip().splitlines()
        # NDBC .spec format: 2 header lines then data. Spec columns:
        # YY MM DD hh mm WVHT SwH SwP WWH WWP SwD WWD STEEPNESS APD MWD ...
        if len(lines) < 3:
            return []
        # Skip headers (first 2 lines)
        cols = lines[0].split()
        units = lines[1].split()
        parts = lines[2].split()
        if len(parts) < len(cols):
            return []
        try:
            yy, mo, dd, hh, mn = int(parts[0]), int(parts[1]), int(parts[2]), int(parts[3]), int(parts[4])
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
                if v >= 99.0:  # NDBC sentinel for missing
                    return None
                return v
            except Exception:
                return None

        station_lat, station_lon = next((s[1], s[2]) for s in NDBC_STATIONS if s[0] == station_id)

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
                notes=f"Moored buoy at {station_lat:.2f}°N, {station_lon:.2f}°E, {distance_km:.0f} km from query",
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
    except Exception as e:
        log.debug(f"ndbc failed: {e}")
        return []


# --------------------------------------------------------------------------- #
# 3) StormGlass (only if STORMGLASS_API_KEY env var is set)
# --------------------------------------------------------------------------- #

async def fetch_stormglass(lat: float, lon: float) -> List[CanonicalRecord]:
    api_key = os.environ.get("STORMGLASS_API_KEY")
    if not api_key:
        return []
    try:
        params = (
            "waveHeight,wavePeriod,swellHeight,swellPeriod,swellDirection,"
            "windWaveHeight,windWavePeriod,windWaveDirection,windSpeed,"
            "windDirection,gust,airTemperature,pressure,cloudCover,visibility,precipitation"
        )
        async with _http() as c:
            r = await c.get(
                "https://api.stormglass.io/v2/weather/point",
                params={"lat": lat, "lng": lon, "params": params},
                headers={"Authorization": api_key},
            )
        if r.status_code != 200:
            return []
        d = r.json()
        hours = d.get("hours", [])
        if not hours:
            return []
        h = hours[0]
        obs = _parse_iso(h.get("time", ""))
        out: List[CanonicalRecord] = []
        for param, dst_unit, key in [
            ("wave_height", "m", "waveHeight"),
            ("wave_period", "s", "wavePeriod"),
            ("swell_wave_height", "m", "swellHeight"),
            ("swell_wave_period", "s", "swellPeriod"),
            ("swell_wave_direction", "deg", "swellDirection"),
            ("wind_wave_height", "m", "windWaveHeight"),
            ("wind_speed", "m/s", "windSpeed"),
            ("wind_direction", "deg", "windDirection"),
            ("wind_gust", "m/s", "gust"),
            ("air_temperature", "°C", "airTemperature"),
            ("air_pressure", "hPa", "pressure"),
            ("cloud_cover", "%", "cloudCover"),
            ("visibility", "km", "visibility"),
            ("precipitation", "mm", "precipitation"),
        ]:
            entry = h.get(key, {})
            val = entry.get("sg") or entry.get("noaa") or entry.get("meto") or entry.get("fcoo") or entry.get("meteo")
            if val is not None:
                # StormGlass sometimes returns visibility in m
                if param == "visibility" and val > 100:
                    val = val / 1000.0
                out.append(
                    CanonicalRecord(
                        parameter=param,
                        value=float(val),
                        unit=dst_unit,
                        latitude=lat,
                        longitude=lon,
                        source="StormGlass (multi-source NWP blend)",
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
    except Exception as e:
        log.debug(f"stormglass failed: {e}")
        return []


# --------------------------------------------------------------------------- #
# 4) INCOIS ERDDAP (Indian National Centre for Ocean Information Services)
# --------------------------------------------------------------------------- #

async def fetch_incois(lat: float, lon: float) -> List[CanonicalRecord]:
    """Pull from INCOIS ERDDAP. If the dataset names are not yet known to us
    we return an empty list — the source selector will fall back to NWP."""
    try:
        # INCOIS ERDDAP catalog: discover the SST dataset
        async with _http() as c:
            r = await c.get(
                "https://erddap.incois.gov.in/erddap/tabledap/INCOIS_SST.json",
                params=[
                    ("time>=", "2026-09-01T00:00:00Z"),
                    ("latitude>=", str(lat - 1)),
                    ("latitude<=", str(lat + 1)),
                    ("longitude>=", str(lon - 1)),
                    ("longitude<=", str(lon + 1)),
                ],
                timeout=4.0,
            )
        if r.status_code != 200:
            return []
        d = r.json()
        # INCOIS format: columns + rows
        # We try to find an SST column
        # (If the dataset structure differs, return empty)
        return []
    except Exception as e:
        log.debug(f"incois failed: {e}")
        return []