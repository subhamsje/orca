"""
ORCA 4.0 Canonical Data Orchestrator (provider-abstraction edition).

Runs every registered Provider in parallel through the new abstraction
(`providers/base.py`), then applies per-parameter source selection
(preferring observed > satellite > model, and lowest priority number).
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
    OBSERVED,
    NEAR_REAL_TIME,
    NOWCAST,
    FORECAST,
    MODEL,
    STALE,
)
from providers.base import PROVIDERS, Provider, list_providers
import providers  # noqa: F401  (registers all providers on import)
import providers.registry  # noqa: F401  (side-effect: register providers)

log = logging.getLogger("orca.canonical")


async def collect_all(lat: float, lon: float, timestamp: Optional[float] = None) -> List[CanonicalRecord]:
    """Run every registered provider in parallel. Each provider has its
    own timeout, retry, circuit breaker, and rate limit."""
    tasks = [p.safe_fetch(lat, lon, timestamp) for p in PROVIDERS.values()]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    out: List[CanonicalRecord] = []
    for r in results:
        if isinstance(r, list):
            out.extend(r)
    return out


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

        for src in order:
            for c in candidates:
                if c.source_id == src and c.state != STALE:
                    out[param] = c
                    break
            if param in out:
                break
        if param in out:
            continue
        for src in order:
            for c in candidates:
                if c.source_id == src:
                    out[param] = c
                    break
            if param in out:
                break
        if param in out:
            continue
        out[param] = candidates[0]
    return out


async def build_canonical_report(
    lat: float,
    lon: float,
    timestamp: Optional[float] = None,
) -> Dict[str, CanonicalRecord]:
    all_records = await collect_all(lat, lon, timestamp)
    return select_best(all_records)
