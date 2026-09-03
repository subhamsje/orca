"""
ORCA 4.0 Maritime Hazard Calculations.

Each function returns a dict:
  {
    "score":     float in [0, 1] — normalized hazard score,
    "value":     raw input value that drove the score,
    "unit":      input unit,
    "details":   extra explainability (e.g. relative wave angle),
    "thresholds": list of (threshold, label) pairs used,
    "source":    EnvVar.source_id of the underlying record,
  }

Hazard design rules:
  - Score is monotonic in the dangerous input direction
    (more wind => higher score, worse visibility => higher score).
  - Score is bounded in [0, 1]; the engine never returns > 1.
  - Score is None when the underlying EnvVar is missing
    (UNAVAILABLE) — the engine then flags INSUFFICIENT_CURRENT_DATA.
  - The thresholds below are documented and version-controlled.
"""

from __future__ import annotations

import math
from typing import Any, Dict, Optional

from risk_engine.state import EnvironmentalState, EnvVar
from risk_engine.vessel import VesselProfile


# ---- Threshold tables (version-controlled, no hidden magic) ------------------ #


# Wave height vs vessel H_crit (relative).
WAVE_TABLE = [
    (0.0, 0.00, "calm"),
    (0.30, 0.15, "light"),
    (0.55, 0.40, "moderate"),
    (0.75, 0.65, "rough"),
    (0.90, 0.85, "very rough"),
    (1.00, 1.00, "danger"),
    (1.50, 1.00, "extreme"),
]


# Wind speed in km/h, indexed by vessel max wind (manufacturer).
WIND_TABLE_KMH = [
    (0.0, 0.00, "calm"),
    (15.0, 0.10, "light breeze"),
    (30.0, 0.30, "moderate breeze"),
    (50.0, 0.55, "strong breeze"),
    (70.0, 0.80, "near gale"),
    (90.0, 1.00, "gale"),
]


# Gust factor in km/h (peak wind on top of mean wind).
GUST_TABLE_KMH = [
    (0.0, 0.00, "calm"),
    (20.0, 0.20, "breezy"),
    (40.0, 0.45, "gusty"),
    (60.0, 0.70, "very gusty"),
    (80.0, 0.90, "danger gust"),
    (100.0, 1.00, "extreme gust"),
]


# Current speed in m/s.
CURRENT_TABLE_MS = [
    (0.0, 0.00, "slack"),
    (0.3, 0.20, "gentle drift"),
    (0.6, 0.40, "noticeable"),
    (1.0, 0.65, "strong"),
    (1.5, 0.85, "very strong"),
    (2.0, 1.00, "extreme"),
]


# Visibility in km (low visibility is dangerous).
VISIBILITY_TABLE_KM = [
    (0.1, 1.00, "fog"),
    (0.5, 0.95, "thick fog"),
    (1.0, 0.85, "very poor"),
    (2.0, 0.70, "poor"),
    (4.0, 0.55, "moderate"),
    (6.0, 0.40, "fair"),
    (10.0, 0.20, "good"),
    (15.0, 0.10, "excellent"),
    (100.0, 0.00, "unlimited"),
]


# Air pressure in hPa (very low pressure is a tropical-cyclone signal).
PRESSURE_TABLE_HPA = [
    (980.0, 1.00, "cyclone core"),
    (990.0, 0.85, "very low"),
    (1000.0, 0.55, "low"),
    (1005.0, 0.30, "slightly low"),
    (1013.0, 0.00, "standard"),
    (1025.0, 0.10, "high"),
    (1050.0, 0.30, "very high"),
]


# Precipitation in mm.
PRECIP_TABLE_MM = [
    (0.0, 0.00, "dry"),
    (2.0, 0.30, "light"),
    (10.0, 0.55, "moderate"),
    (30.0, 0.80, "heavy"),
    (60.0, 1.00, "extreme"),
]


# Relative wave angle in degrees — 0 = head sea (worst), 180 = following sea.
# Head/quartering seas impose greater loads than beam seas.
RELATIVE_WAVE_ANGLE_BAND = [
    ((0, 30), 1.00, "head sea (0-30°)"),
    ((30, 60), 0.85, "head sea (30-60°)"),
    ((60, 120), 0.50, "beam sea (60-120°)"),
    ((120, 150), 0.40, "quartering sea (120-150°)"),
    ((150, 180), 0.25, "following sea (150-180°)"),
]


def _interpolate_table(value: float, table) -> Dict[str, Any]:
    """Walk a threshold table. Returns dict(score, label, threshold, raw)."""
    if value is None:
        return {"score": None, "value": None, "label": "no-data"}
    # Out of bounds clamping
    if value <= table[0][0]:
        return {"score": table[0][1], "value": value, "label": table[0][2], "threshold": table[0][0]}
    if value >= table[-1][0]:
        return {"score": table[-1][1], "value": value, "label": table[-1][2], "threshold": table[-1][0]}
    for i in range(len(table) - 1):
        v_lo, s_lo, lab_lo = table[i]
        v_hi, s_hi, lab_hi = table[i + 1]
        if v_lo <= value <= v_hi:
            t = (value - v_lo) / max(v_hi - v_lo, 1e-9)
            score = s_lo + (s_hi - s_lo) * t
            label = lab_hi if t > 0.5 else lab_lo
            return {"score": score, "value": value, "label": label, "threshold": (v_lo, v_hi)}
    return {"score": 0.0, "value": value, "label": "unknown"}


# ---- Hazard functions --------------------------------------------------------- #


def _env_var_meta(var: Optional[EnvVar]) -> Dict[str, Any]:
    if var is None:
        return {}
    return {
        "source": var.source_id,
        "freshness": var.freshness,
        "distance_km": var.distance_km,
        "observed_at": var.observed_at,
    }


def wave_height_hazard(state: EnvironmentalState, vessel: VesselProfile) -> Dict[str, Any]:
    """
    Wave hazard combines:
      1. wave_height / max_safe_wave_height (vessel-relative)
      2. wave steepness = Hs / T (proxy for breaking sea / capsize risk)

    The same wave state produces a different score for different
    vessels because the relative threshold is vessel-specific.
    """
    hs = state.value("wave_height")
    period = state.value("wave_period")
    if hs is None:
        return {"score": None, "label": "no-data", **_env_var_meta(state.get("wave_height"))}

    h_crit = vessel.max_safe_wave_height_m
    rel = min(1.0, hs / max(h_crit, 0.1))
    base = _interpolate_table(rel, WAVE_TABLE)

    steepness_bonus = 0.0
    if period is not None and period > 0:
        steepness = hs / period
        # Hs/T > 1/7 is already dangerous; > 0.2 is breaking wave territory.
        if steepness > 0.20:
            steepness_bonus = 1.00
        elif steepness > 0.14:
            steepness_bonus = 0.55
        elif steepness > 0.07:
            steepness_bonus = 0.20
    score = min(1.0, base["score"] * 0.85 + steepness_bonus * 0.15)
    return {
        "score": round(score, 3),
        "value": hs,
        "unit": "m",
        "h_crit_m": round(h_crit, 2),
        "relative_to_h_crit": round(rel, 3),
        "steepness": round(hs / period, 3) if period else None,
        "label": base["label"],
        **_env_var_meta(state.get("wave_height")),
    }


def wind_hazard(state: EnvironmentalState, vessel: VesselProfile) -> Dict[str, Any]:
    speed = state.value("wind_speed")
    if speed is None:
        return {"score": None, "label": "no-data", **_env_var_meta(state.get("wind_speed"))}
    max_wind = vessel.max_manufacturer_wind_kmh
    rel = min(1.0, speed / max_wind)
    base = _interpolate_table(speed, WIND_TABLE_KMH)
    # Scale by relative ratio so a 40 km/h wind is more dangerous on a
    # 6m canoe than on a 25m trawler.
    score = min(1.0, base["score"] * (0.5 + 0.5 * rel))
    return {
        "score": round(score, 3),
        "value": speed,
        "unit": "km/h",
        "manufacturer_max_kmh": max_wind,
        "label": base["label"],
        **_env_var_meta(state.get("wind_speed")),
    }


def gust_hazard(state: EnvironmentalState, vessel: VesselProfile) -> Dict[str, Any]:
    gust = state.value("wind_gust")
    if gust is None:
        return {"score": None, "label": "no-data", **_env_var_meta(state.get("wind_gust"))}
    base = _interpolate_table(gust, GUST_TABLE_KMH)
    return {
        "score": round(base["score"], 3),
        "value": gust,
        "unit": "km/h",
        "label": base["label"],
        **_env_var_meta(state.get("wind_gust")),
    }


def current_hazard(state: EnvironmentalState, vessel: VesselProfile) -> Dict[str, Any]:
    cur = state.value("current_speed")
    if cur is None:
        return {"score": None, "label": "no-data", **_env_var_meta(state.get("current_speed"))}
    base = _interpolate_table(cur, CURRENT_TABLE_MS)
    # Add small lift for larger vessels (more cross-section).
    rel = min(1.0, cur / 1.0)
    score = min(1.0, base["score"] * (0.7 + 0.3 * (vessel.length_m / 20.0)))
    return {
        "score": round(score, 3),
        "value": cur,
        "unit": "m/s",
        "label": base["label"],
        **_env_var_meta(state.get("current_speed")),
    }


def visibility_hazard(state: EnvironmentalState, vessel: VesselProfile) -> Dict[str, Any]:
    vis = state.value("visibility")
    if vis is None:
        return {"score": None, "label": "no-data", **_env_var_meta(state.get("visibility"))}
    base = _interpolate_table(vis, VISIBILITY_TABLE_KM)
    return {
        "score": round(base["score"], 3),
        "value": vis,
        "unit": "km",
        "label": base["label"],
        **_env_var_meta(state.get("visibility")),
    }


def pressure_hazard(state: EnvironmentalState, vessel: VesselProfile) -> Dict[str, Any]:
    p = state.value("air_pressure")
    if p is None:
        return {"score": None, "label": "no-data", **_env_var_meta(state.get("air_pressure"))}
    base = _interpolate_table(p, PRESSURE_TABLE_HPA)
    return {
        "score": round(base["score"], 3),
        "value": p,
        "unit": "hPa",
        "label": base["label"],
        **_env_var_meta(state.get("air_pressure")),
    }


def precipitation_hazard(state: EnvironmentalState, vessel: VesselProfile) -> Dict[str, Any]:
    p = state.value("precipitation")
    if p is None:
        return {"score": None, "label": "no-data", **_env_var_meta(state.get("precipitation"))}
    base = _interpolate_table(p, PRECIP_TABLE_MM)
    return {
        "score": round(base["score"], 3),
        "value": p,
        "unit": "mm",
        "label": base["label"],
        **_env_var_meta(state.get("precipitation")),
    }


def wave_vessel_interaction_hazard(
    state: EnvironmentalState, vessel: VesselProfile
) -> Dict[str, Any]:
    """
    Encounter frequency, encounter period, and relative wave angle.
    Same wave state gives a different risk to a head-sea vs following-sea vessel.

    encounter_period formula (Kijima et al. 1990):
        T_e = T / |1 - (V / gT) * cos(relative_wave_angle)|
    """
    hs = state.value("wave_height")
    period = state.value("wave_period")
    wave_dir = state.value("wave_direction")
    if hs is None or period is None or wave_dir is None or period == 0:
        return {"score": None, "label": "no-data", **_env_var_meta(state.get("wave_height"))}

    heading = vessel.heading_deg
    rel = (wave_dir - heading) % 360.0
    if rel > 180.0:
        rel = 360.0 - rel
    cos_rel = math.cos(math.radians(rel))
    # If wave direction is from a sea-state with no directional data,
    # default to head sea (the worst case).
    if wave_dir is None or wave_dir < 0:
        rel = 0.0
        cos_rel = 1.0

    V = vessel.cruising_speed_kn * 0.5144  # m/s
    g = 9.81
    denom = abs(1.0 - (V * cos_rel) / (g * period))
    if denom < 0.05:
        denom = 0.05  # singular -> treat as capsize-prone
    T_e = period / denom

    # Encounter period classification (a "nasty" band for small craft
    # is 4-8 s; large craft more tolerant).
    nasty_lo = max(3.0, vessel.length_m * 0.5)
    nasty_hi = max(nasty_lo + 4.0, vessel.length_m * 1.0)
    if nasty_lo <= T_e <= nasty_hi:
        enc_score = 1.0
    elif T_e < nasty_lo * 0.5 or T_e > nasty_hi * 1.5:
        enc_score = 0.30
    else:
        # Linear ramp across the band
        if T_e < nasty_lo:
            enc_score = 0.3 + 0.7 * (T_e - nasty_lo * 0.5) / (nasty_lo - nasty_lo * 0.5)
        else:
            enc_score = 0.3 + 0.7 * (nasty_hi * 1.5 - T_e) / (nasty_hi * 1.5 - nasty_hi)
        enc_score = max(0.0, min(1.0, enc_score))

    # Relative wave angle band score (head sea worst).
    band_score = 0.5
    band_label = "beam sea"
    for (lo, hi), s, lab in RELATIVE_WAVE_ANGLE_BAND:
        if lo <= rel < hi:
            band_score = s
            band_label = lab
            break

    score = min(1.0, 0.6 * enc_score + 0.4 * band_score)
    return {
        "score": round(score, 3),
        "relative_wave_angle_deg": round(rel, 1),
        "encounter_period_s": round(T_e, 2),
        "encounter_band": band_label,
        "vessel_heading_deg": heading,
        "wave_direction_deg": wave_dir,
        "vessel_speed_kn": vessel.cruising_speed_kn,
        **_env_var_meta(state.get("wave_height")),
    }


def official_warning_hazard(state: EnvironmentalState, vessel: VesselProfile) -> Dict[str, Any]:
    """Official IMD / INCOIS / Navy advisories. The canonical layer has
    no live feed yet; the value here is 0 by default and only
    non-zero if an explicit advisory record is added later."""
    advisory = state.value("official_warning_severity")
    if advisory is None:
        return {"score": 0.0, "value": 0, "label": "no advisory feed integrated"}
    # 0 = none, 1 = LOW, 2 = MODERATE, 3 = HIGH, 4 = CRITICAL
    score = min(1.0, advisory / 4.0)
    return {
        "score": round(score, 3),
        "value": advisory,
        "label": f"advisory severity {advisory}/4",
    }
