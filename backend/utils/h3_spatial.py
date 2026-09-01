"""
Uber H3 Spatial Hexagonal Indexing Engine & Geodesics
Discretizes spatial marine coordinates into Uber H3 Resolution 7 cells (~1.2 km²).
"""

import h3
import math
from typing import List, Tuple, Dict, Any

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return round(r * c, 2)

def calculate_bearing_deg(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    lat1_rad, lat2_rad = math.radians(lat1), math.radians(lat2)
    dlon_rad = math.radians(lon2 - lon1)
    y = math.sin(dlon_rad) * math.cos(lat2_rad)
    x = math.cos(lat1_rad) * math.sin(lat2_rad) - math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(dlon_rad)
    bearing = math.degrees(math.atan2(y, x))
    return round((bearing + 360.0) % 360.0, 1)

def latlon_offset_km(lat: float, lon: float, offset_x_km: float, offset_y_km: float) -> Tuple[float, float]:
    dlat = offset_x_km / 111.0
    dlon = offset_y_km / (111.0 * math.cos(math.radians(lat)))
    return round(lat + dlat, 5), round(lon + dlon, 5)

def latlon_to_h3(lat: float, lon: float, resolution: int = 7) -> str:
    if hasattr(h3, 'geo_to_h3'):
        return h3.geo_to_h3(lat, lon, resolution)
    elif hasattr(h3, 'latlng_to_cell'):
        return h3.latlng_to_cell(lat, lon, resolution)
    return f"mock_hex_res7_{round(lat, 3)}_{round(lon, 3)}"

def h3_to_latlon(hex_id: str) -> Tuple[float, float]:
    if hex_id.startswith("mock_hex"):
        parts = hex_id.split("_")
        if len(parts) >= 4:
            try:
                return float(parts[2]), float(parts[3])
            except Exception:
                pass
        return 16.0215, 73.4821

    if hasattr(h3, 'h3_to_geo'):
        return h3.h3_to_geo(hex_id)
    elif hasattr(h3, 'cell_to_latlng'):
        return h3.cell_to_latlng(hex_id)
    return 16.0215, 73.4821

def get_surrounding_hexagons(hex_id: str, ring_radius: int = 2) -> List[str]:
    if hex_id.startswith("mock_hex"):
        return [hex_id]
    if hasattr(h3, 'k_ring'):
        return list(h3.k_ring(hex_id, ring_radius))
    elif hasattr(h3, 'grid_disk'):
        return list(h3.grid_disk(hex_id, ring_radius))
    return [hex_id]

def get_h3_cell_boundary(hex_id: str) -> List[Tuple[float, float]]:
    if hex_id.startswith("mock_hex"):
        return [(16.02, 73.48), (16.03, 73.49), (16.01, 73.47)]
    if hasattr(h3, 'h3_to_geo_boundary'):
        return h3.h3_to_geo_boundary(hex_id)
    elif hasattr(h3, 'cell_to_boundary'):
        return h3.cell_to_boundary(hex_id)
    return [(16.02, 73.48), (16.03, 73.49)]
