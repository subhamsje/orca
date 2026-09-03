"""
72-Hour Offline Tile Pack Bundler Microservice.

This service was previously a stub that returned a fake 12-hour timeline
hard-coded with `sst=28.4, wave_height=1.1` for any coordinate. That stub
has been REMOVED (2026-09-03) because the values were fabricated.

The offline bundle is now UNIMPLEMENTED — it requires a real
PWA service worker (frontend) and a tile-pack generator that queries the
live canonical data layer. Until both ship, the service returns
`status=UNIMPLEMENTED` with explicit provenance.
"""

import time
from typing import Dict, Any


class OfflineSyncService:
    def generate_offline_bundle(
        self,
        center_lat: float,
        center_lon: float,
        forecast_hours: int = 72,
    ) -> Dict[str, Any]:
        return {
            "status": "UNIMPLEMENTED",
            "reason": (
                "The offline PWA tile pack is not yet built. A previous "
                "stub returned hard-coded SST and wave values, which is "
                "forbidden in production. See ORCA §9 (PWA sync) in the "
                "specification."
            ),
            "center_coordinate": [center_lat, center_lon],
            "forecast_duration_hours": forecast_hours,
            "valid_hours": None,
            "included_layers": [],
            "timeline": [],
            "bundle_size_kb": None,
            "offline_ready": False,
            "queried_at": time.time(),
        }

    def build_offline_bundle(self, *args, **kwargs) -> Dict[str, Any]:
        return self.generate_offline_bundle(*args, **kwargs)

    def generate_sector_bundle(self, *args, **kwargs) -> Dict[str, Any]:
        return self.generate_offline_bundle(*args, **kwargs)


offline_sync_service = OfflineSyncService()
