"""
Vessel Digital Twin & Seaworthiness Hydrodynamic Engine
Models hull dimensions, stability dynamics, capsize thresholds, and fuel efficiency curves for Indian coastal craft.
"""

import math
from typing import Dict, Any, Optional

DEFAULT_VESSEL_PROFILE: Dict[str, Any] = {
    "vessel_id": "IND-GENERIC-CRAFT",
    "vessel_name": "Matsya Jyoti",
    "vessel_type": "Motorized FRP Craft",
    "length_m": 8.5,
    "beam_m": 2.2,
    "draft_m": 0.8,
    "freeboard_m": 0.7,
    "engine_hp": 9.9,
    "fuel_capacity_l": 60.0,
    "fuel_burn_rate_l_hr": 4.5,
    "cruise_speed_knots": 8.0,
    "operating_radius_km": 35.0
}

def calculate_max_safe_wave_height(
    length_m: float,
    beam_m: Optional[float] = None,
    wave_encounter_angle_deg: float = 90.0
) -> float:
    """
    Hydrodynamic Capsizing Wave Threshold:
    H_crit = 0.6 * Vessel Length * max(0.4, sin(encounter_angle))
    Beam-to-Length ratio adjustment: Wider beam craft have higher initial metacentric stability (GM).
    """
    length_m = max(3.0, length_m)
    beam_factor = 1.0
    if beam_m and beam_m > 0:
        ratio = beam_m / length_m
        # Standard beam-to-length ratio ~ 0.25 to 0.35
        beam_factor = min(1.25, max(0.85, ratio / 0.26))
        
    angle_rad = math.radians(wave_encounter_angle_deg)
    angle_factor = max(0.45, abs(math.sin(angle_rad)))
    
    h_crit = 0.60 * length_m * angle_factor * beam_factor
    return round(h_crit, 2)

def calculate_fuel_consumption(
    distance_km: float,
    vessel_profile: Dict[str, Any],
    speed_knots: Optional[float] = None,
    current_headwind_kmh: float = 0.0
) -> Dict[str, float]:
    """
    Estimates fuel burn (liters) and transit time based on cruising speed, engine HP, and headwind resistance.
    """
    speed_kn = speed_knots or vessel_profile.get("cruise_speed_knots", 8.0)
    speed_kmh = speed_kn * 1.852
    
    # Base transit hours
    transit_hours = distance_km / max(4.0, speed_kmh)
    
    # Base fuel burn rate (L/hr)
    engine_hp = vessel_profile.get("engine_hp", 9.9)
    base_l_hr = vessel_profile.get("fuel_burn_rate_l_hr", engine_hp * 0.35)
    
    # Wind resistance penalty factor (exponential drag)
    wind_penalty = 1.0 + (max(0.0, current_headwind_kmh - 15.0) / 40.0) ** 1.5
    
    total_fuel_liters = round(transit_hours * base_l_hr * wind_penalty, 2)
    
    return {
        "transit_hours": round(transit_hours, 2),
        "transit_minutes": int(round(transit_hours * 60)),
        "fuel_consumption_liters": total_fuel_liters,
        "fuel_burn_rate_l_hr": round(base_l_hr * wind_penalty, 2)
    }

def evaluate_vessel_seaworthiness(
    wave_height_m: float,
    wind_speed_kmh: float,
    vessel_profile: Optional[Dict[str, Any]] = None,
    wave_encounter_angle_deg: float = 90.0
) -> Dict[str, Any]:
    """
    Evaluates dynamic seaworthiness safety margin for a specific craft under live sea states.
    """
    profile = {**DEFAULT_VESSEL_PROFILE, **(vessel_profile or {})}
    length_m = profile.get("length_m", 8.5)
    beam_m = profile.get("beam_m", 2.2)
    freeboard_m = profile.get("freeboard_m", 0.7)
    
    max_wave = calculate_max_safe_wave_height(length_m, beam_m, wave_encounter_angle_deg)
    wave_ratio = wave_height_m / max(0.1, max_wave)
    
    # Dynamic freeboard submergence risk
    freeboard_margin_pct = max(0.0, (freeboard_m - (wave_height_m * 0.3)) / max(0.1, freeboard_m)) * 100.0
    
    capsize_risk = bool(wave_ratio >= 1.0 or freeboard_margin_pct < 15.0)
    
    return {
        "vessel_id": profile.get("vessel_id", "IND-GENERIC"),
        "vessel_name": profile.get("vessel_name", "Matsya Jyoti"),
        "vessel_length_m": length_m,
        "vessel_beam_m": beam_m,
        "freeboard_m": freeboard_m,
        "max_safe_wave_m": max_wave,
        "current_wave_m": wave_height_m,
        "safety_ratio": round(wave_ratio, 2),
        "freeboard_margin_pct": round(freeboard_margin_pct, 1),
        "capsize_risk": capsize_risk,
        "safe_for_operations": not capsize_risk
    }
