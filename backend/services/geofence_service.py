"""
GIS Geofencing & Boundary Protection Microservice
Checks vessel position against International Maritime Boundary Lines (IMBL), naval zones, and marine reserves.
"""

from typing import Dict, Any, List

class GeofenceService:
    def check_boundaries(self, lat: float, lon: float) -> Dict[str, Any]:
        """Checks spatial proximity to IMBL boundaries and restricted naval zones."""
        # Simulated distance calculations to Indian territorial boundary line
        dist_to_imbl = 24.5  # kilometers
        dist_to_naval = 18.2  # kilometers

        imbl_buffer_warning = dist_to_imbl < 5.0
        naval_zone_violation = dist_to_naval < 2.0

        return {
            "dist_to_imbl_km": dist_to_imbl,
            "dist_to_naval_zone_km": dist_to_naval,
            "inside_imbl_buffer_warning": imbl_buffer_warning,
            "inside_naval_zone_violation": naval_zone_violation,
            "restricted_zones_nearby": [
                {"name": "Naval Range Area B-4", "distance_km": dist_to_naval},
                {"name": "Angria Bank Marine Reserve", "distance_km": 32.0}
            ]
        }

geofence_service = GeofenceService()
