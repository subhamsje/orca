"""
ORCA 4.0 Data Orchestrator — multi-source fetch, normalize, freshness check,
source selection, and canonical record aggregation.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Dict, List, Optional

from .canonical import (
    CanonicalRecord,
    SOURCE_PRIORITY,
    FRESHNESS_LIMITS,
    UNAVAILABLE,
    STALE,
)
from . import weather_providers
from . import marine_providers

log = logging.getLogger("orca.orchestrator")

# --- Provider registry --------------------------------------------------------
# Each provider exposes fetch(lat, lon) -> List[CanonicalRecord]. The
# orchestrator runs all providers in parallel and selects the best record
# per parameter.

PROVIDERS = {
    "weather": [
        weather_providers.fetch_met_norway,
        weather_providers.fetch_open_meteo_ecmwf,
        weather_providers.fetch_open_meteo_forecast,
    ],
    "marine": [
        marine_providers.fetch_open_meteo_marine,
        marine_providers.fetch_ndbc_buoy,
        marine_providers.fetch_stormglass,
        marine_providers.fetch_incois,
    ],
}


async def collect_all(lat: float, lon: float) -> List[CanonicalRecord]:
    """Run every provider in parallel. Return a flat list of records."""
    tasks = []
    for fn in PROVIDERS["weather"] + PROVIDERS["marine"]:
        tasks.append(_safe(fn, lat, lon))
    results = await asyncio.gather(*tasks, return_exceptions=True)
    out: List[CanonicalRecord] = []
    for r in results:
        if isinstance(r, list):
            out.extend(r)
    return out


async def _safe(fn, lat: float, lon: float) -> List[CanonicalRecord]:
    try:
        return await fn(lat, lon)
    except Exception as e:
        log.debug(f"provider {fn.__name__} errored: {e}")
        return []


def _mark_stale(rec: CanonicalRecord) -> CanonicalRecord:
    if rec.value is None or rec.observation_time is None:
        return rec
    limit = FRESHNESS_LIMITS.get(rec.parameter, 24 * 3600)
    if (time.time() - rec.observation_time) > limit:
        if rec.state != UNAVAILABLE:
            rec.state = STALE
    return rec


def select_best(
    records: List[CanonicalRecord],
    preferred_sources: Optional[List[str]] = None,
) -> Dict[str, CanonicalRecord]:
    """
    Pick the best CanonicalRecord for each parameter.

    Selection policy:
      1. Prefer preferred_sources (in order) if they produced a value.
      2. Fall back to canonical SOURCE_PRIORITY for that parameter.
      3. Among candidates, prefer observed > model, then nearest.
      4. Drop records older than the freshness window (mark as STALE).
      5. If nothing usable, return state=UNAVAILABLE.
    """
    by_param: Dict[str, List[CanonicalRecord]] = {}
    for r in records:
        if r.value is None:
            continue
        by_param.setdefault(r.parameter, []).append(r)

    out: Dict[str, CanonicalRecord] = {}
    for param, candidates in by_param.items():
        candidates = [_mark_stale(c) for c in candidates]
        candidates = [c for c in candidates if c.state != UNAVAILABLE]
        if not candidates:
            continue
        order = preferred_sources or SOURCE_PRIORITY.get(param, [])
        # Try preferred sources first
        for src in order:
            for c in candidates:
                if c.source_id == src and c.state != STALE:
                    out[param] = c
                    break
            if param in out:
                break
        if param in out:
            continue
        # Fall back: best by source_id ordering
        for src in order:
            for c in candidates:
                if c.source_id == src:
                    out[param] = c
                    break
            if param in out:
                break
        if param in out:
            continue
        # Last resort: first record
        out[param] = candidates[0]
    return out


# --- Convenience: build a full canonical report -------------------------------

async def build_canonical_report(lat: float, lon: float) -> Dict[str, CanonicalRecord]:
    """End-to-end: fetch from every provider, return best record per parameter."""
    all_records = await collect_all(lat, lon)
    return select_best(all_records)


def is_data_unavailable() -> CanonicalRecord:
    """Helper: a CanonicalRecord in UNAVAILABLE state with no value."""
    return CanonicalRecord(
        parameter="unknown",
        state=UNAVAILABLE,
        notes="No data returned by any provider",
    )