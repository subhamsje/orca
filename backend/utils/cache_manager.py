"""
72-Hour Rolling Spatial Forecast Cache Manager
Pre-caches spatial grid forecasts to enable zero-latency lookups and offline PWA functionality.
"""

import time
from typing import Dict, Any, Optional

class RollingSpatialCache:
    def __init__(self, ttl_seconds: int = 600):
        self.ttl = ttl_seconds
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Retrieves entry from cache if not expired."""
        if key in self._cache:
            entry = self._cache[key]
            if time.time() - entry["cached_at"] < self.ttl:
                return entry["data"]
            else:
                del self._cache[key]
        return None

    def set(self, key: str, data: Dict[str, Any]):
        """Stores entry in cache with timestamp."""
        self._cache[key] = {
            "cached_at": time.time(),
            "data": data
        }

    def clear(self):
        """Clears all cached entries."""
        self._cache.clear()

# Global spatial cache instance
spatial_cache = RollingSpatialCache(ttl_seconds=600)
