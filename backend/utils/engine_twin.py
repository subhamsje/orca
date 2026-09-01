"""
Engine Digital Twin & Propeller Hydrodynamics Simulator
Calculates brake specific fuel consumption (BSFC), propeller slip efficiency,
and thermal engine stress under headwind and swell resistance.
"""

from typing import Dict, Any

def calculate_detailed_engine_metrics(
    distance_km: float,
    vessel_speed_knots: float = 8.0,
    engine_hp: float = 9.9,
    headwind_kmh: float = 15.0,
    wave_height_m: float = 1.1
) -> Dict[str, Any]:
    """
    Computes hydro-acoustic engine load, propeller slip coefficient, and fuel consumption.
    Formula:
    Fuel Rate (L/hr) = (Engine HP * Load Factor * BSFC_g_hp_hr) / Diesel_Density
    """
    base_load_factor = 0.65
    
    # Resistance penalties from headwind and swell
    wind_resistance_penalty = (headwind_kmh / 50.0) * 0.15
    wave_resistance_penalty = (wave_height_m / 2.0) * 0.20
    
    total_load_factor = min(1.0, max(0.40, base_load_factor + wind_resistance_penalty + wave_resistance_penalty))
    
    # BSFC for small 2-stroke / 4-stroke marine outboard diesel: ~240 g/hp-hr
    bsfc = 240.0
    diesel_density_g_l = 835.0
    
    fuel_rate_l_hr = (engine_hp * total_load_factor * bsfc) / diesel_density_g_l
    
    transit_hours = distance_km / max(1.0, vessel_speed_knots * 1.852)
    total_fuel_liters = fuel_rate_l_hr * transit_hours
    
    propeller_slip_pct = round(12.0 + (wave_resistance_penalty * 20.0), 1)

    return {
        "transit_distance_km": round(distance_km, 1),
        "transit_hours": round(transit_hours, 2),
        "effective_load_factor_pct": round(total_load_factor * 100.0, 1),
        "fuel_rate_liters_per_hour": round(fuel_rate_l_hr, 2),
        "total_fuel_consumed_liters": round(total_fuel_liters, 2),
        "propeller_slip_pct": propeller_slip_pct,
        "engine_thermal_stress": "NORMAL" if total_load_factor < 0.85 else "HIGH LOAD / MONITOR TEMP"
    }
