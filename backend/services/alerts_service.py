"""
Disaster Warning & Coastal Advisory Microservice.

Honest implementation: this service does NOT have an integrated feed
into IMD, INCOIS Early Warning, or any other authoritative alert
source. Without an integrated feed, the deterministic answer is
"no active alert" for every coordinate. Test/stage demo overrides
allow injecting a cyclone state for specific coordinates only via the
``set_demo_override`` API — never as a hidden side-effect of lat/lon.

When the alerts integration ships, the
``_query_authoritative_alerts()`` method is the place to add it.
"""

import asyncio
import time
from typing import Dict, Any, Optional


class AlertsService:
    def __init__(self) -> None:
        self._demo_override_cyclone: bool = False
        self._demo_override_squall: bool = False
        self._demo_override_region: Optional[str] = None
        # ``None`` means "no authoritative feed integrated yet".
        # ``True`` / ``False`` would represent real feed output.
        self._feed_status: Optional[str] = None

    def set_demo_override(
        self,
        cyclone: bool = False,
        squall: bool = False,
        region: Optional[str] = None,
    ) -> None:
        """Allows test runners and stage demos to toggle disaster states
        for explicit coordinate ranges (see set_demo_region)."""
        self._demo_override_cyclone = cyclone
        self._demo_override_squall = squall
        self._demo_override_region = region

    def set_demo_region(self, region: Optional[str]) -> None:
        """Restrict the demo cyclone override to a named region. Pass
        ``None`` to clear. Currently supported: 'paradip'."""
        self._demo_override_region = region

    def _is_in_demo_region(self, lat: float, lon: float) -> bool:
        region = self._demo_override_region
        if region is None:
            return False
        # Single explicit demo region for SIH stage demonstration.
        if region == "paradip":
            # Bounding box around Paradip (Odisha) for the IMD stage demo.
            return 19.5 <= lat <= 21.0 and 85.5 <= lon <= 87.5
        return False

    async def _query_authoritative_alerts(self, lat: float, lon: float) -> Dict[str, Any]:
        """Hook for the eventual integration with IMD CWD / INCOIS EWC.
        Until that integration ships, returns the no-alert state with
        honest provenance."""
        await asyncio.sleep(0.005)  # async yield
        return {
            "has_active_cyclone_alert": False,
            "cyclone_name": None,
            "cyclone_intensity": None,
            "has_squall_warning": False,
            "has_high_wave_alert": False,
            "has_tsunami_alert": False,
            "port_danger_signal": None,
            "alert_bulletin_id": None,
            "issuing_agency": None,
            "bulletin_timestamp": None,
            "advisory_text": "No active alerts reported.",
            "data_provenance": {
                "sources": [],
                "is_simulated": True,
                "simulation_reason": (
                    "No authoritative alert feed integrated yet. "
                    "Override only via set_demo_override()."
                ),
                "queried_at": time.time(),
            },
        }

    async def check_active_alerts(self, lat: float, lon: float) -> Dict[str, Any]:
        """Queries official marine disaster advisory feeds."""
        base = await self._query_authoritative_alerts(lat, lon)

        if self._demo_override_cyclone and self._is_in_demo_region(lat, lon):
            base.update(
                {
                    "has_active_cyclone_alert": True,
                    "cyclone_name": "Very Severe Cyclonic Storm 'SAGAR' (DEMO)",
                    "cyclone_intensity": "VSCS (120-130 km/h gusts)",
                    "has_squall_warning": True,
                    "has_high_wave_alert": True,
                    "port_danger_signal": 8,
                    "alert_bulletin_id": "IMD-DEMO-OVERRIDE-PARADIP",
                    "issuing_agency": "IMD Cyclone Warning Division (DEMO OVERRIDE)",
                    "bulletin_timestamp": time.strftime(
                        "%Y-%m-%dT%H:%M:%SZ", time.gmtime()
                    ),
                    "advisory_text": (
                        "[DEMO] Active cyclone override enabled for Paradip region. "
                        "Fishermen are strictly advised not to venture into the sea."
                    ),
                    "data_provenance": {
                        "sources": ["IMD CWD (DEMO override)"],
                        "is_simulated": True,
                        "simulation_reason": "set_demo_override(cyclone=True) active",
                        "queried_at": time.time(),
                    },
                }
            )
            return base

        return base


alerts_service = AlertsService()
