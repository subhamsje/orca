"""
ORCA 4.0 Canonical Data Acquisition Layer — Provenance + Freshness Schema.

Every environmental value that reaches the user comes through a CanonicalRecord.
If no trustworthy value can be obtained, the record has state=UNAVAILABLE and
value=None. The frontend renders this as "— DATA UNAVAILABLE".

This module is the single source of truth for the data contract.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional

# --- Canonical states ---------------------------------------------------------

UNAVAILABLE = "UNAVAILABLE"  # no source returned a usable value
OBSERVED = "OBSERVED"  # real instrument / station / buoy
NEAR_REAL_TIME = "NEAR_REAL_TIME"  # satellite obs disseminated minutes ago
NOWCAST = "NOWCAST"  # model valid for the very near future (0-3h)
FORECAST = "FORECAST"  # model valid later
MODEL = "MODEL"  # generic numerical model
SATELLITE = "SATELLITE"  # raw satellite product
BUOY = "BUOY"  # NDBC / moored buoy
STATION = "STATION"  # land/coastal station
CACHED = "CACHED"  # served from a recent cache because live fetch failed
STALE = "STALE"  # value is older than the freshness threshold


# --- Freshness thresholds (per parameter, in seconds) -----------------------

FRESHNESS_LIMITS = {
    # Atmospheric NWP runs every 3-6h. We accept up to 6h as "fresh" (nowcast).
    "sea_surface_temperature": 6 * 3600,    # satellite pass + NRT
    "wave_height": 6 * 3600,                # NWP cycle
    "wave_period": 6 * 3600,
    "swell_wave_height": 6 * 3600,
    "swell_wave_period": 6 * 3600,
    "swell_wave_direction": 6 * 3600,
    "wind_speed": 3 * 3600,                 # 3h NWP
    "wind_direction": 3 * 3600,
    "wind_gust": 3 * 3600,
    "wind_wave_height": 3 * 3600,
    "wind_wave_period": 3 * 3600,
    "wave_direction": 3 * 3600,
    "current_speed": 6 * 3600,              # hourly model
    "current_direction": 6 * 3600,
    "air_pressure": 3 * 3600,
    "air_temperature": 3 * 3600,
    "visibility": 3 * 3600,
    "cloud_cover": 3 * 3600,
    "precipitation": 3 * 3600,
    "relative_humidity": 3 * 3600,
    "chlorophyll": 24 * 3600,              # daily OCM-3
    "salinity": 24 * 3600,
    "tide_height": 5 * 60,                  # rapid tide updates
    "sea_surface_height": 6 * 3600,        # altimetry
}


def is_fresh(parameter: str, observation_time_unix: float) -> bool:
    """Return True if the observation is within its freshness window."""
    limit = FRESHNESS_LIMITS.get(parameter)
    if limit is None:
        return True
    age = time.time() - observation_time_unix
    return age <= limit


# --- Canonical record --------------------------------------------------------

@dataclass
class CanonicalRecord:
    parameter: str
    value: Optional[float] = None
    unit: str = ""

    # Location
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance_from_requested_km: Optional[float] = None

    # Source
    source: str = ""           # e.g. "Open-Meteo Marine API"
    source_id: str = ""       # e.g. "open-meteo:marine"
    dataset: str = ""         # e.g. "ERA5 wave reanalysis"
    data_type: str = ""       # OBSERVED | SATELLITE | BUOY | STATION | MODEL | etc.
    state: str = UNAVAILABLE  # OBSERVED | NEAR_REAL_TIME | NOWCAST | FORECAST | MODEL | CACHED | STALE | UNAVAILABLE

    # Time
    observation_time: Optional[float] = None   # unix seconds
    valid_time: Optional[float] = None
    retrieved_at: float = field(default_factory=time.time)

    # Quality
    spatial_resolution: str = ""
    temporal_resolution: str = ""
    quality: str = "UNKNOWN"   # GOOD | FAIR | POOR | UNKNOWN
    confidence: float = 0.0

    # Notes
    notes: str = ""

    def is_fresh(self) -> bool:
        if self.observation_time is None:
            return False
        return is_fresh(self.parameter, self.observation_time)

    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in asdict(self).items() if v not in (None, "", 0.0) or k in ("retrieved_at",)}

    def with_value(self, value: float, **kw) -> "CanonicalRecord":
        self.value = value
        for k, v in kw.items():
            if hasattr(self, k):
                setattr(self, k, v)
        return self

    def mark_unavailable(self, reason: str = "") -> "CanonicalRecord":
        self.value = None
        self.state = UNAVAILABLE
        self.notes = reason
        return self


# --- Source priority (lower = preferred) -------------------------------------
# The source-selection engine picks the lowest-numbered source that returns a
# fresh CanonicalRecord.

SOURCE_PRIORITY = {
    "sea_surface_temperature": [
        ("open-meteo:marine:sst_nrt",   "Open-Meteo Marine SST NRT"),
        ("open-meteo:ecmwf:sst",        "Open-Meteo ECMWF SST"),
        ("met-norway:air_temp_proxy",   "MET Norway air temperature"),
    ],
    "wave_height": [
        ("open-meteo:marine:wave_height_nrt", "Open-Meteo Marine Wave NRT"),
        ("open-meteo:ecmwf:wave_height",      "Open-Meteo ECMWF Wave"),
        ("ndbc:buoy:spec",                   "NDBC Realtime Buoy (nearest)"),
    ],
    "wind_speed": [
        ("met-norway:wind",          "MET Norway Locationforecast (yr.no)"),
        ("open-meteo:ecmwf:wind",    "Open-Meteo ECMWF Wind"),
        ("open-meteo:forecast:wind", "Open-Meteo Forecast Wind"),
    ],
    "wind_direction": [
        ("met-norway:wind",          "MET Norway Locationforecast (yr.no)"),
        ("open-meteo:ecmwf:wind",    "Open-Meteo ECMWF Wind Direction"),
    ],
    "air_pressure": [
        ("met-norway:pressure",      "MET Norway Locationforecast (yr.no)"),
        ("open-meteo:ecmwf:pressure", "Open-Meteo ECMWF Pressure"),
    ],
    "air_temperature": [
        ("met-norway:temp",          "MET Norway Locationforecast (yr.no)"),
        ("open-meteo:ecmwf:temp",    "Open-Meteo ECMWF 2m Temp"),
    ],
    "current_speed": [
        ("open-meteo:marine:current", "Open-Meteo Marine Surface Current"),
    ],
    "chlorophyll": [
        ("open-meteo:ecmwf:chlorophyll", "Open-Meteo ECMWF Chlorophyll proxy"),
    ],
    "salinity": [
        ("open-meteo:marine:hourly:salinity", "Open-Meteo Marine Salinity"),
    ],
    "precipitation": [
        ("met-norway:precip",       "MET Norway Precipitation"),
        ("open-meteo:ecmwf:precip", "Open-Meteo ECMWF Precipitation"),
    ],
    "visibility": [
        ("open-meteo:ecmwf:visibility", "Open-Meteo ECMWF Visibility"),
    ],
    "cloud_cover": [
        ("met-norway:cloud",         "MET Norway Cloud Cover"),
        ("open-meteo:ecmwf:cloud",   "Open-Meteo ECMWF Cloud"),
    ],
}
