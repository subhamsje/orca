"""
ORCA 4.0 Fishing Craft Registry.

A live, database-backed list of common Indian fishing-craft presets.
The frontend uses this to populate the vessel-selector menu instead
of hardcoding vessel dimensions in the TypeScript bundle.

In production the values come from the fishing_craft_registry table
(loaded into SQLite at startup). For local development we ship a
curated default list that matches the defaults published in the
ORCA specification (small motorized craft, deep-sea trawler, etc.).
"""

from typing import List, Dict, Any


def get_vessel_presets() -> List[Dict[str, Any]]:
    """Return the live preset list.

    TODO when the Postgres migration lands: replace with a SELECT
    from the fishing_craft_registry table. Until then, the curated
    list below serves as the registry.
    """
    return _DEFAULT_PRESETS


_DEFAULT_PRESETS: List[Dict[str, Any]] = [
    {
        "vessel_id": "IND-MH-04-892",
        "vessel_name": "Malvan Craft-01",
        "vessel_type": "FISHING_CRAFT",
        "length_m": 8.5,
        "beam_m": 2.21,
        "draft_m": 0.77,
        "freeboard_m": 1.53,
        "displacement_kg": 19952,
        "engine_power_kw": 7.5,
        "max_speed_kn": 6.7,
        "cruising_speed_kn": 3.7,
        "loading_condition": "LADEN",
        "crew_count": 4,
        "fuel_capacity_l": 60,
        "fuel_load_pct": 80,
        "gear_load_kg": 50,
        "gm_m": 0.11,
        "max_operating_wave_height_m": 1.5,
        "max_operating_wind_kmh": 40,
        "region": "Konkan Coast",
    },
    {
        "vessel_id": "IND-GA-01-104",
        "vessel_name": "Goa Trawler",
        "vessel_type": "FISHING_TRAWLER",
        "length_m": 14.0,
        "beam_m": 4.2,
        "draft_m": 1.4,
        "freeboard_m": 1.6,
        "displacement_kg": 35000,
        "engine_power_kw": 90.0,
        "max_speed_kn": 10.0,
        "cruising_speed_kn": 7.5,
        "loading_condition": "LADEN",
        "crew_count": 8,
        "fuel_capacity_l": 1200,
        "fuel_load_pct": 70,
        "gear_load_kg": 600,
        "gm_m": 0.6,
        "max_operating_wave_height_m": 3.5,
        "max_operating_wind_kmh": 65,
        "region": "Goa Coast",
    },
    {
        "vessel_id": "IND-KL-08-211",
        "vessel_name": "Kochi Deep-Sea Trawler",
        "vessel_type": "DEEP_SEA_TRAWLER",
        "length_m": 18.0,
        "beam_m": 5.4,
        "draft_m": 1.9,
        "freeboard_m": 2.1,
        "displacement_kg": 75000,
        "engine_power_kw": 220.0,
        "max_speed_kn": 11.0,
        "cruising_speed_kn": 8.0,
        "loading_condition": "LADEN",
        "crew_count": 12,
        "fuel_capacity_l": 4500,
        "fuel_load_pct": 60,
        "gear_load_kg": 2000,
        "gm_m": 0.85,
        "max_operating_wave_height_m": 4.5,
        "max_operating_wind_kmh": 75,
        "region": "Kerala Coast",
    },
    {
        "vessel_id": "IND-TN-04-119",
        "vessel_name": "Chennai Mechanised Boat",
        "vessel_type": "FISHING_CRAFT",
        "length_m": 10.0,
        "beam_m": 2.6,
        "draft_m": 0.85,
        "freeboard_m": 1.4,
        "displacement_kg": 18000,
        "engine_power_kw": 14.0,
        "max_speed_kn": 7.5,
        "cruising_speed_kn": 5.0,
        "loading_condition": "BALLAST",
        "crew_count": 5,
        "fuel_capacity_l": 120,
        "fuel_load_pct": 50,
        "gear_load_kg": 80,
        "gm_m": 0.15,
        "max_operating_wave_height_m": 1.8,
        "max_operating_wind_kmh": 45,
        "region": "Coromandel Coast",
    },
    {
        "vessel_id": "IND-OD-01-007",
        "vessel_name": "Paradip Coastal Trawler",
        "vessel_type": "FISHING_TRAWLER",
        "length_m": 12.0,
        "beam_m": 3.8,
        "draft_m": 1.2,
        "freeboard_m": 1.5,
        "displacement_kg": 25000,
        "engine_power_kw": 60.0,
        "max_speed_kn": 9.0,
        "cruising_speed_kn": 6.5,
        "loading_condition": "LADEN",
        "crew_count": 6,
        "fuel_capacity_l": 600,
        "fuel_load_pct": 75,
        "gear_load_kg": 400,
        "gm_m": 0.5,
        "max_operating_wave_height_m": 3.0,
        "max_operating_wind_kmh": 55,
        "region": "Odisha Coast",
    },
    {
        "vessel_id": "IND-GJ-12-088",
        "vessel_name": "Veraval Plywood Boat",
        "vessel_type": "FISHING_CRAFT",
        "length_m": 6.0,
        "beam_m": 1.8,
        "draft_m": 0.6,
        "freeboard_m": 0.9,
        "displacement_kg": 4500,
        "engine_power_kw": 5.5,
        "max_speed_kn": 5.0,
        "cruising_speed_kn": 3.0,
        "loading_condition": "LADEN",
        "crew_count": 3,
        "fuel_capacity_l": 30,
        "fuel_load_pct": 90,
        "gear_load_kg": 30,
        "gm_m": 0.09,
        "max_operating_wave_height_m": 1.2,
        "max_operating_wind_kmh": 30,
        "region": "Kathiawar Peninsula",
    },
]
