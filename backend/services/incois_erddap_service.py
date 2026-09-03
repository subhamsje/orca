"""
ORCA 4.0 INCOIS ERDDAP Data Ingestion Service (no-fallback rebuild).

The previous implementation returned a hard-coded `chlorophyll_a=1.78,
sst=28.5` "climatology cache" whenever the INCOIS ERDDAP HTTP call
failed. That fallback was REMOVED (2026-09-03) — the value was invented
and could not be verified.

This module now returns `None` for every environmental value when the
upstream call fails, with explicit provenance explaining that the
INCOIS feed is unintegrated for this deployment.
"""

import time
from typing import Dict, Any, Optional
import httpx


INCOIS_ERDDAP_BASE = "https://erddap.incois.gov.in/erddap"
DEFAULT_TIMEOUT = 4.0


async def _safe_get(
    client: httpx.AsyncClient,
    url: str,
    params: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    try:
        r = await client.get(url, params=params, timeout=DEFAULT_TIMEOUT)
        if r.status_code != 200:
            return None
        return r.json()
    except Exception:
        return None


class IncoisErddapService:
    """
    Live INCOIS ERDDAP integration. Returns None for every value on
    failure. No fabricated fallback.
    """

    def __init__(self):
        self.server_url = INCOIS_ERDDAP_BASE
        self._client: Optional[httpx.AsyncClient] = None

    async def get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=DEFAULT_TIMEOUT)
        return self._client

    def build_griddap_url(
        self,
        dataset_id: str,
        variables: list,
        lat_range: tuple,
        lon_range: tuple,
        fmt: str = "json",
    ) -> str:
        var_queries = []
        for var in variables:
            var_queries.append(
                f"{var}[(last)][(0.0)][({lat_range[0]}):1:({lat_range[1]})][({lon_range[0]}):1:({lon_range[1]})]"
            )
        query_str = ",".join(var_queries)
        return f"{self.server_url}/griddap/{dataset_id}.{fmt}?{query_str}"

    async def fetch_incois_ocean_data(
        self,
        lat: float,
        lon: float,
        dataset_id: str = "INCOIS_SST",
    ) -> Dict[str, Any]:
        url = self.build_griddap_url(
            dataset_id=dataset_id,
            variables=["sst", "chlorophyll_a"],
            lat_range=(round(lat - 0.1, 2), round(lat + 0.1, 2)),
            lon_range=(round(lon - 0.1, 2), round(lon + 0.1, 2)),
        )

        try:
            client = await self.get_client()
            data = await _safe_get(client, url, {})
        except Exception:
            data = None

        if data is None:
            return {
                "source": "INCOIS ERDDAP",
                "dataset_id": dataset_id,
                "chlorophyll_a_mg_m3": None,
                "sst_c": None,
                "data_freshness": "UNAVAILABLE — INCOIS ERDDAP call failed or no credentials",
                "queried_at": time.time(),
                "queried_coordinate": {"lat": lat, "lon": lon},
                "raw_response": None,
                "status": "UNAVAILABLE",
                "notes": (
                    "INCOIS ERDDAP integration is unverified in this "
                    "deployment. Until a working dataset ID is configured, "
                    "this service returns None."
                ),
            }

        return {
            "source": "INCOIS ERDDAP",
            "dataset_id": dataset_id,
            "chlorophyll_a_mg_m3": None,
            "sst_c": None,
            "data_freshness": "Live INCOIS ERDDAP",
            "queried_at": time.time(),
            "queried_coordinate": {"lat": lat, "lon": lon},
            "raw_response": data,
            "status": "SUCCESS_UNMAPPED",
            "notes": (
                "INCOIS ERDDAP returned a payload but the dataset schema "
                "is not yet mapped to ORCA's canonical record."
            ),
        }


incois_erddap_service = IncoisErddapService()
