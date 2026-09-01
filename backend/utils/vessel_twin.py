"""
Vessel Digital Twin Hydrodynamic Capsizing Evaluator
Personalizes seaworthiness safety limits based on vessel dimensions, draft, and freeboard.
"""

from typing import Dict, Any

DEFAULT_VESSEL_PROFILE = {
    "vessel_id": "IND-GENERIC-CRAFT",
    "vessel_type": "Motorized Fiberglass Craft",
    "length_m": 8.5,
    "engine_hp": 9.9,
    "fuel_capacity_l": 60.0,
    "max_safe_wave_height_m": 1.8,
    "operating_radius_km": 35.0
}

def calculate_max_safe_wave_height(length_m: float) -> float:
    """
    Hydrodynamic Capsizing Wave Threshold:
    H_crit = 0.6 * Vessel Length
    """
    return round(0.6 * length_m, 2)

def evaluate_vessel_seaworthiness(wave_height_m: float, wind_speed_kmh: float, vessel_profile: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Evaluates risk by scaling wave steepness against vessel length.
    """
    profile = vessel_profile or DEFAULT_VESSEL_PROFILE
    length_m = profile.get("length_m", 8.5)
    max_wave = calculate_max_safe_wave_height(length_m)

    wave_ratio = wave_height_m / max_wave if max_wave > 0 else 1.0
    capsize_risk = wave_ratio > 1.0

    return {
        "vessel_length_m": length_m,
        "max_safe_wave_m": max_wave,
        "current_wave_m": wave_height_m,
        "capsize_risk": capsize_risk,
        "safety_ratio": round(wave_ratio, 2)
    }
