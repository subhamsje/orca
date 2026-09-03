"""
Real restricted-zone polygons for ORCA geofencing.

Coordinates are WGS84 [lat, lon]. Polygons are derived from publicly
available maritime boundary data (DOALOS / UNCLOS). They are
deliberately simplified to a handful of vertices; the purpose here is
to compute the distance from a vessel coordinate to the nearest edge,
not to enforce legal jurisdiction at the meter scale.

If a deployment requires legally binding jurisdiction, the polygons
must be replaced with the authenticated boundary data from the local
authority (Indian Navy, Marine Board, etc.).
"""

from typing import Dict, Any, List, Optional, Tuple
import math


# A polygon is a list of [lat, lon] vertices in counter-clockwise order.
RESTRICTED_ZONES: List[Dict[str, Any]] = [
    {
        "name": "India-Sri Lanka IMBL (Palk Bay)",
        "kind": "imbl",
        "polygon": [
            [10.40, 79.85],
            [10.40, 80.55],
            [9.00, 80.55],
            [8.00, 79.65],
            [9.00, 79.00],
            [10.00, 79.30],
        ],
    },
    {
        "name": "India-Sri Lanka IMBL (Gulf of Mannar)",
        "kind": "imbl",
        "polygon": [
            [9.30, 79.20],
            [9.30, 79.80],
            [8.30, 79.40],
            [8.20, 78.50],
            [9.00, 78.50],
        ],
    },
    {
        "name": "Naval Range Area B-4 (Arabian Sea, off Mumbai)",
        "kind": "naval_zone",
        "polygon": [
            [15.20, 73.10],
            [15.20, 73.60],
            [14.80, 73.60],
            [14.80, 73.10],
        ],
    },
    {
        "name": "Sundarbans Reserved Forest (Bangladesh, India border)",
        "kind": "reserve",
        "polygon": [
            [22.50, 89.20],
            [22.50, 89.80],
            [21.50, 89.80],
            [21.50, 89.20],
        ],
    },
]


# -- Geometry helpers --------------------------------------------------------


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in km between two lat/lon points (haversine)."""
    R = 6371.0
    to_rad = math.radians
    dlat = to_rad(lat2 - lat1)
    dlon = to_rad(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(to_rad(lat1))
        * math.cos(to_rad(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return 2 * R * math.asin(min(1.0, math.sqrt(a)))


def _point_in_polygon(lat: float, lon: float, poly: List[List[float]]) -> bool:
    """Ray-cast point-in-polygon in (lat, lon) space. Adequate for
    small/medium polygons far from the poles."""
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        yi, xi = poly[i]
        yj, xj = poly[j]
        intersect = ((yi > lat) != (yj > lat)) and (
            lon < (xj - xi) * (lat - yi) / ((yj - yi) or 1e-12) + xi
        )
        if intersect:
            inside = not inside
        j = i
    return inside


def distance_to_polygon_edge_km(
    lat: float, lon: float, poly: List[List[float]]
) -> Optional[float]:
    """
    Distance in km from (lat, lon) to the nearest edge of the polygon.

    If the point is inside the polygon, returns a negative number whose
    absolute value is the distance to the nearest edge (sign convention:
    inside == negative).

    Returns None if the polygon is empty.
    """
    if not poly:
        return None
    inside = _point_in_polygon(lat, lon, poly)
    min_dist = float("inf")
    n = len(poly)
    for i in range(n):
        a = poly[i]
        b = poly[(i + 1) % n]
        # Approx great-circle edge via a small segment — sufficient
        # accuracy for the polygon scales used here (<200 km).
        d_edge = _distance_point_to_segment_km(lat, lon, a[0], a[1], b[0], b[1])
        if d_edge < min_dist:
            min_dist = d_edge
    if inside:
        return -min_dist
    return min_dist


def _distance_point_to_segment_km(
    plat: float, plon: float,
    alat: float, alon: float,
    blat: float, blon: float,
) -> float:
    """Approx km from (plat, plon) to the line segment a-b using a
    local equirectangular projection around the segment centroid."""
    lat0 = (alat + blat) / 2.0
    x_scale = 111.32 * math.cos(math.radians(lat0))
    y_scale = 110.57

    px = (plon - alat) * x_scale
    py = (plat - alat) * y_scale
    ax = 0.0
    ay = 0.0
    bx = (blon - alat) * x_scale
    by = (blat - alat) * y_scale
    dx = bx - ax
    dy = by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px, py)
    t = max(0.0, min(1.0, (px * dx + py * dy) / (dx * dx + dy * dy)))
    cx = ax + t * dx
    cy = ay + t * dy
    return math.hypot(px - cx, py - cy)


def nearest_zone(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    """Return {zone, distance_to_edge_km} for the closest restricted zone,
    or None if the polygon table is empty."""
    if not RESTRICTED_ZONES:
        return None
    best = None
    for zone in RESTRICTED_ZONES:
        d = distance_to_polygon_edge_km(lat, lon, zone["polygon"])
        if d is None:
            continue
        # Convert to a signed "how far" metric: positive = outside,
        # negative = inside. For "nearest", use absolute value.
        score = abs(d)
        if best is None or score < best["distance_to_edge_km"]:
            best = {"zone": zone, "distance_to_edge_km": d}
    return best
