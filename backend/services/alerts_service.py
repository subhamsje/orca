"""
ORCA 4.0 Disaster Warning & Coastal Advisory Microservice.

This service is responsible for querying authoritative marine disaster
advisory feeds. It does NOT fabricate alerts.

Status of integrations (last audited 2026-09-03):

  IMD Cyclone Warning Division (CWD):
    Public RSS feed: https://mausam.imd.gov.in/imd_latest/contents/cyclone.php
    Public API: none (no API key, no rate limit, scraping is brittle and not
    suitable for production).
    Status: BLOCKED. Requires IMD MOU and registered API key.

  INCOIS Early Warning Centre (EWC):
    Public portal: https://www.incois.gov.in/portal/earlywarning.jsp
    API: requires INCOIS registration.
    Status: BLOCKED. Requires INCOIS API key.

Until the above feeds are integrated with credentials, the service returns
an UNAVAILABLE state with explicit provenance so the UI can show
"NO ACTIVE OFFICIAL ADVISORY FEED INTEGRATED" rather than implying there
are no advisories.

No set_demo_override() or staged-cyclone API exists. The previous
implementation that injected a fake "VSCS SAGAR (DEMO)" alert for the
Paradip bounding box has been REMOVED — a hazard this serious must never
be fabricated.
"""

import time
from typing import Dict, Any


# Provider status snapshot — used by the API and the frontend banner.
PROVIDER_STATUS = {
    "imd_cwd": {
        "status": "UNAVAILABLE",
        "reason": "IMD CWD has no public API; RSS feed parsing is brittle for production.",
        "url": "https://mausam.imd.gov.in/imd_latest/contents/cyclone.php",
        "registration": "Required: IMD MOU.",
    },
    "incois_ewc": {
        "status": "UNAVAILABLE",
        "reason": "INCOIS EWC requires registered API key.",
        "url": "https://www.incois.gov.in/portal/earlywarning.jsp",
        "registration": "Required: INCOIS API key (set INCOIS_API_KEY env var).",
    },
}


class AlertsService:
    """Alerts service. Returns UNAVAILABLE until a real feed is integrated.

    The previous version of this service supported a
    `set_demo_override(cyclone=True)` API that injected a fabricated
    cyclone alert for any coordinate inside the Paradip bounding box.
    That API was REMOVED on 2026-09-03. A demo cycle must never be
    presented as a real hazard.
    """

    async def check_active_alerts(self, lat: float, lon: float) -> Dict[str, Any]:
        """Return the current advisory state. Until a real feed is
        integrated, every parameter is UNAVAILABLE. Do not invent
        cyclone / squall / warning state.
        """
        return {
            "has_active_cyclone_alert": None,
            "cyclone_name": None,
            "cyclone_intensity": None,
            "has_squall_warning": None,
            "has_high_wave_alert": None,
            "has_tsunami_alert": None,
            "port_danger_signal": None,
            "alert_bulletin_id": None,
            "issuing_agency": None,
            "bulletin_timestamp": None,
            "advisory_text": (
                "UNAVAILABLE — no official cyclone / squall / high-wave "
                "advisory feed is integrated for this point. Refer to "
                "IMD (mausam.imd.gov.in) and INCOIS (incois.gov.in) directly."
            ),
            "data_provenance": {
                "sources": [],
                "is_simulated": False,
                "is_unavailable": True,
                "queried_at": time.time(),
                "queried_coordinate": {"lat": lat, "lon": lon},
                "provider_status": PROVIDER_STATUS,
            },
        }


alerts_service = AlertsService()
