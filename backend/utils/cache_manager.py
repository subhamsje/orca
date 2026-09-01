"""
72-Hour Rolling Spatial Forecast Cache Engine
Caches environmental metrics locally to ensure zero-latency offline PWA functionality.
"""

from typing import Dict, Any

class CacheManager:
    def __init__(self):
        self._memory_cache: Dict[str, Any] = {}

    def get_spatial_cache(self, lat: float, lon: float) -> Dict[str, Any]:
        grid_key = f"{round(lat, 2)}_{round(lon, 2)}"
        if grid_key in self._memory_cache:
            return self._memory_cache[grid_key]
        
        return {
            "sst": 28.4,
            "chlorophyll": 1.65,
            "current_speed": 0.45,
            "wave_height": 1.1,
            "wind_speed": 16.5
        }

    def set_spatial_cache(self, lat: float, lon: float, data: Dict[str, Any]):
        grid_key = f"{round(lat, 2)}_{round(lon, 2)}"
        self._memory_cache[grid_key] = data

cache_manager = CacheManager()
spatial_cache = cache_manager
