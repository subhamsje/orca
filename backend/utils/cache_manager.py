"""
Thread-Safe 72-Hour Rolling Spatial Forecast Cache Manager
Pre-caches spatial grid forecasts to enable sub-5ms lookups and offline PWA synchronization.
"""

import time
import threading
from typing import Dict, Any, Optional

class RollingSpatialCache:
    def __init__(self, ttl_seconds: int = 600, max_entries: int = 500):
        self.ttl = ttl_seconds
        self.max_entries = max_entries
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()
        self._hits = 0
        self._misses = 0

    def _get_key(self, lat: float, lon: float, precision: int = 2) -> str:
        return f"tile_{round(lat, precision)}_{round(lon, precision)}"

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Retrieves entry from cache if not expired."""
        with self._lock:
            if key in self._cache:
                entry = self._cache[key]
                if time.time() - entry["cached_at"] < self.ttl:
                    self._hits += 1
                    return entry["data"]
                else:
                    del self._cache[key]
            self._misses += 1
            return None

    def set(self, key: str, data: Dict[str, Any]):
        """Stores entry in cache with timestamp."""
        with self._lock:
            if len(self._cache) >= self.max_entries:
                # Evict oldest entry
                oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k]["cached_at"])
                del self._cache[oldest_key]
                
            self._cache[key] = {
                "cached_at": time.time(),
                "data": data
            }

    def get_stats(self) -> Dict[str, Any]:
        """Returns cache telemetry stats."""
        with self._lock:
            total_reqs = self._hits + self._misses
            hit_ratio = (self._hits / total_reqs) if total_reqs > 0 else 0.0
            return {
                "total_entries": len(self._cache),
                "hits": self._hits,
                "misses": self._misses,
                "hit_ratio_pct": round(hit_ratio * 100.0, 1),
                "ttl_seconds": self.ttl
            }

    def clear(self):
        """Clears all cached entries."""
        with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0

# Global thread-safe spatial cache singleton
spatial_cache = RollingSpatialCache(ttl_seconds=600)
