"""
Uber H3 Spatial Hexagonal Indexing & Geodesic Calculation Engine
Discretizes spatial marine coordinates into Uber H3 Resolution 7 cells (~1.2 km²),
calculates Haversine distances, initial navigational bearings, and spatial bounding boxes.
"""

import math
from typing import List, Tuple, Dict, Any, Optional

try:
    import h3
except ImportError:
    h3 = None

def latlon_to_h3(lat: float, lon: float, resolution: int = 7) -> str:
    """Converts a latitude/longitude coordinate pair to an H3 Hexagon ID."""
    if h3 is None:
        return f"mock_hex_res{resolution}_{round(lat, 3)}_{round(lon, 3)}"
    return h3.geo_to_h3(lat, lon, resolution)

def h3_to_latlon(hex_id: str) -> Tuple[float, float]:
    """Returns the center lat/lon coordinate of an H3 Hexagon ID."""
    if h3 is None or hex_id.startswith("mock_hex"):
        parts = hex_id.split("_")
        if len(parts) >= 4:
            return float(parts[2]), float(parts[3])
        return 16.0, 73.0
    return h3.h3_to_geo(hex_id)

def get_surrounding_hexagons(hex_id: str, ring_radius: int = 2) -> List[str]:
    """Returns surrounding k-ring neighbor hexagon IDs for spatial bounding queries."""
    if h3 is None or hex_id.startswith("mock_hex"):
        return [hex_id]
    return list(h3.k_ring(hex_id, ring_radius))

def get_h3_cell_boundary(hex_id: str) -> List[Tuple[float, float]]:
    """Returns lat/lon polygon boundary vertices for rendering map overlays."""
    if h3 is None or hex_id.startswith("mock_hex"):
        lat, lon = h3_to_latlon(hex_id)
        d = 0.005
        return [(lat - d, lon - d), (lat - d, lon + d), (lat + d, lon + d), (lat + d, lon - d)]
    return h3.h3_to_geo_boundary(hex_id)

def hex_distance(hex1: str, hex2: str) -> int:
    """Returns discrete grid step distance between two H3 hexagons."""
    if h3 is None or hex1.startswith("mock_hex") or hex2.startswith("mock_hex"):
        c1, c2 = h3_to_latlon(hex1), h3_to_latlon(hex2)
        return max(1, int(haversine_distance_km(c1[0], c1[1], c2[0], c2[1]) / 1.2))
    return h3.h3_distance(hex1, hex2)

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two GPS coordinates using the Haversine formula:
    a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
    c = 2 ⋅ atan2( √a, √(1−a) )
    d = R ⋅ c
    """
    R_EARTH_KM = 6371.0088
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)

    a = math.sin(d_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R_EARTH_KM * c, 3)

def calculate_bearing_deg(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates initial navigational forward azimuth/bearing (0° - 360°) from point 1 to point 2:
    θ = atan2( sin Δλ ⋅ cos φ2 , cos φ1 ⋅ sin φ2 − sin φ1 ⋅ cos φ2 ⋅ cos Δλ )
    """
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_lambda = math.radians(lon2 - lon1)

    y = math.sin(d_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(d_lambda)
    bearing = math.degrees(math.atan2(y, x))
    return round((bearing + 360.0) % 360.0, 1)

def latlon_offset_km(lat: float, lon: float, distance_km: float, bearing_deg: float) -> Tuple[float, float]:
    """
    Calculates destination GPS coordinate given start point, distance (km), and bearing (degrees).
    """
    R_EARTH_KM = 6371.0088
    d_div_r = distance_km / R_EARTH_KM
    bearing_rad = math.radians(bearing_deg)
    lat_rad = math.radians(lat)
    lon_rad = math.radians(lon)

    dest_lat_rad = math.asin(
        math.sin(lat_rad) * math.cos(d_div_r) +
        math.cos(lat_rad) * math.sin(d_div_r) * math.cos(bearing_rad)
    )
    dest_lon_rad = lon_rad + math.atan2(
        math.sin(bearing_rad) * math.sin(d_div_r) * math.cos(lat_rad),
        math.cos(d_div_r) - math.sin(lat_rad) * math.sin(dest_lat_rad)
    )

    return round(math.degrees(dest_lat_rad), 5), round(math.degrees(dest_lon_rad), 5)
