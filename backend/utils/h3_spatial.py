"""
Uber H3 Spatial Hexagonal Indexing Engine
Discretizes spatial marine coordinates into Uber H3 Resolution 7 cells (~1.2 km²).
"""

import h3
from typing import List, Tuple, Dict, Any

def latlon_to_h3(lat: float, lon: float, resolution: int = 7) -> str:
    """Converts a latitude/longitude coordinate pair to an H3 Hexagon ID."""
    return h3.geo_to_h3(lat, lon, resolution)

def h3_to_latlon(hex_id: str) -> Tuple[float, float]:
    """Returns the center lat/lon coordinate of an H3 Hexagon ID."""
    return h3.h3_to_geo(hex_id)

def get_surrounding_hexagons(hex_id: str, ring_radius: int = 2) -> List[str]:
    """Returns surrounding k-ring neighbor hexagon IDs for spatial bounding queries."""
    return list(h3.k_ring(hex_id, ring_radius))

def get_h3_cell_boundary(hex_id: str) -> List[Tuple[float, float]]:
    """Returns lat/lon polygon boundary vertices for rendering map overlays."""
    return h3.h3_to_geo_boundary(hex_id)

def hex_distance(hex1: str, hex2: str) -> int:
    """Returns discrete grid step distance between two H3 hexagons."""
    return h3.h3_distance(hex1, hex2)
