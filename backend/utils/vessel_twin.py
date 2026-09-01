"""
Vessel Digital Twin Hydrodynamic Capsizing Evaluator & Fuel Engine
Personalizes seaworthiness safety limits based on vessel dimensions, draft, freeboard, and engine HP.
"""

from typing import Dict, Any, Optional

DEFAULT_VESSEL_PROFILE = {
    "vessel_id": "IND-GENERIC-CRAFT",
    "vessel_type": "Motorized Fiberglass Craft",
    "length_m": 8.5,
    "beam_m": 2.2,
    "engine_hp": 9.9,
    "fuel_capacity_l": 60.0,
    "max_safe_wave_height_m": 1.8,
    "operating_radius_km": 35.0
}

def calculate_max_safe_wave_height(length_m: float, beam_m: Optional[float] = None) -> float:
    base_wave = 0.22 * length_m
    if beam_m:
        base_wave += 0.05 * beam_m
    return round(base_wave, 2)

def calculate_fuel_consumption(distance_km: float, vessel_profile: dict = None, headwind_kmh: float = 0.0) -> Dict[str, Any]:
    profile = vessel_profile or DEFAULT_VESSEL_PROFILE
    base_consumption_per_km = 0.45
    wind_penalty = 1.0 + (max(0.0, headwind_kmh - 10.0) * 0.015)
    liters = round(distance_km * base_consumption_per_km * wind_penalty, 1)
    speed_knots = profile.get("cruise_speed_knots", 8.0)
    speed_kmh = speed_knots * 1.852
    hours = round(distance_km / speed_kmh, 2)
    minutes = int(round(hours * 60))
    return {
        "transit_hours": hours,
        "transit_minutes": minutes,
        "fuel_liters": liters,
        "fuel_consumption_liters": liters
    }

def evaluate_vessel_seaworthiness(wave_height_m: float, wind_speed_kmh: float, vessel_profile: Dict[str, Any] = None) -> Dict[str, Any]:
    profile = vessel_profile or DEFAULT_VESSEL_PROFILE
    length_m = profile.get("length_m", 8.5)
    beam_m = profile.get("beam_m", 2.2)
    max_wave = calculate_max_safe_wave_height(length_m, beam_m)

    wave_ratio = wave_height_m / max_wave if max_wave > 0 else 1.0
    capsize_risk = wave_ratio > 1.0

    return {
        "vessel_length_m": length_m,
        "max_safe_wave_m": max_wave,
        "current_wave_m": wave_height_m,
        "capsize_risk": capsize_risk,
        "safe_for_operations": not capsize_risk,
        "safety_ratio": round(wave_ratio, 2)
    }
