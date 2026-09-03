"""
ORCA 4.0 Provider Abstraction Layer.

A Provider is a typed wrapper around an external data feed. The
abstraction enforces:

  - A standard interface (`fetch(lat, lon, timestamp) -> List[CanonicalRecord]`)
  - Per-provider timeouts and retry policies
  - A simple per-provider circuit breaker (rate of failures -> OPEN for
    a cooldown period)
  - A bounded per-provider rate limit (token bucket)
  - Health monitoring (provider_health[provider_id] = { ... })

The risk engine, the orchestrator, and the canonical orchestrator all
talk to providers through this layer. No service file is allowed to
construct an httpx client and call an external API directly.
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Dict, List, Optional, Tuple

import httpx

from data_providers.canonical import CanonicalRecord


log = logging.getLogger("orca.providers")


# --------------------------------------------------------------------------- #
# Provider health (per-instance)                                             #
# --------------------------------------------------------------------------- #


@dataclass
class CircuitBreaker:
    """
    Simple circuit breaker. After `failure_threshold` consecutive
    failures, the breaker OPENS for `cooldown_seconds`. While OPEN,
    calls return immediately with PROVIDER_OPEN. After cooldown, the
    breaker enters HALF_OPEN: a single test call decides whether to
    close (success) or reopen (failure).
    """

    failure_threshold: int = 3
    cooldown_seconds: float = 60.0
    state: str = "CLOSED"  # CLOSED | OPEN | HALF_OPEN
    consecutive_failures: int = 0
    opened_at: float = 0.0

    def allow(self) -> bool:
        if self.state == "OPEN":
            if (time.time() - self.opened_at) > self.cooldown_seconds:
                self.state = "HALF_OPEN"
                return True
            return False
        return True

    def record_success(self) -> None:
        self.consecutive_failures = 0
        self.state = "CLOSED"

    def record_failure(self) -> None:
        self.consecutive_failures += 1
        if (
            self.state == "HALF_OPEN"
            or self.consecutive_failures >= self.failure_threshold
        ):
            self.state = "OPEN"
            self.opened_at = time.time()


@dataclass
class TokenBucket:
    """Simple token bucket rate limiter."""
    capacity: float
    refill_per_sec: float
    tokens: float = field(init=False)
    last_refill: float = field(default_factory=time.time, init=False)

    def __post_init__(self) -> None:
        self.tokens = self.capacity

    def take(self, n: float = 1.0) -> bool:
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_per_sec)
        self.last_refill = now
        if self.tokens >= n:
            self.tokens -= n
            return True
        return False


# --------------------------------------------------------------------------- #
# Provider record                                                             #
# --------------------------------------------------------------------------- #


@dataclass
class ProviderHealth:
    provider_id: str
    last_success: Optional[float] = None
    last_failure: Optional[float] = None
    total_calls: int = 0
    total_failures: int = 0
    total_skipped_open: int = 0
    total_skipped_rate: int = 0
    average_latency_ms: float = 0.0
    last_error: str = ""


PROVIDER_HEALTH: Dict[str, ProviderHealth] = {}
CIRCUIT_BREAKERS: Dict[str, CircuitBreaker] = {}
RATE_LIMITERS: Dict[str, TokenBucket] = {}


def _health(provider_id: str) -> ProviderHealth:
    if provider_id not in PROVIDER_HEALTH:
        PROVIDER_HEALTH[provider_id] = ProviderHealth(provider_id=provider_id)
    return PROVIDER_HEALTH[provider_id]


def _breaker(provider_id: str) -> CircuitBreaker:
    if provider_id not in CIRCUIT_BREAKERS:
        CIRCUIT_BREAKERS[provider_id] = CircuitBreaker()
    return CIRCUIT_BREAKERS[provider_id]


def _limiter(provider_id: str) -> TokenBucket:
    if provider_id not in RATE_LIMITERS:
        # Sensible defaults: 60 calls / 60 s. Per-provider overrides via
        # env var ORCA_RATE_<ID>_RPM.
        rpm = 60
        try:
            rpm = int(os.environ.get(f"ORCA_RATE_{provider_id.upper()}_RPM", "60"))
        except Exception:
            pass
        RATE_LIMITERS[provider_id] = TokenBucket(
            capacity=rpm, refill_per_sec=rpm / 60.0
        )
    return RATE_LIMITERS[provider_id]


# --------------------------------------------------------------------------- #
# Provider base class                                                         #
# --------------------------------------------------------------------------- #


FetchFn = Callable[[float, float, Optional[float]], Awaitable[List[CanonicalRecord]]]


@dataclass
class Provider:
    """
    Wraps a provider-specific fetch function. The fetcher must return
    a list of CanonicalRecord — empty if the upstream failed or has no
    matching data. Providers MUST NOT fabricate values.
    """

    provider_id: str
    display_name: str
    fetch_fn: FetchFn
    parameters: List[str]  # canonical parameters this provider can supply
    requires_credentials: List[str] = field(default_factory=list)
    priority: int = 100  # lower = preferred
    timeout_s: float = 4.0
    max_retries: int = 1
    backoff_s: float = 0.6

    def has_credentials(self) -> bool:
        for c in self.requires_credentials:
            if not os.environ.get(c):
                return False
        return True

    async def safe_fetch(
        self,
        lat: float,
        lon: float,
        timestamp: Optional[float] = None,
    ) -> List[CanonicalRecord]:
        if self.requires_credentials and not self.has_credentials():
            return []

        h = _health(self.provider_id)
        br = _breaker(self.provider_id)
        rate = _limiter(self.provider_id)

        if not br.allow():
            h.total_skipped_open += 1
            return []
        if not rate.take():
            h.total_skipped_rate += 1
            return []

        attempts = 0
        last_err: str = ""
        while attempts <= self.max_retries:
            t0 = time.time()
            try:
                result = await asyncio.wait_for(
                    self.fetch_fn(lat, lon, timestamp),
                    timeout=self.timeout_s,
                )
                elapsed_ms = (time.time() - t0) * 1000
                h.total_calls += 1
                h.last_success = time.time()
                h.average_latency_ms = (
                    h.average_latency_ms * 0.8 + elapsed_ms * 0.2
                    if h.total_calls > 1
                    else elapsed_ms
                )
                br.record_success()
                return result or []
            except Exception as e:
                attempts += 1
                last_err = f"{type(e).__name__}: {e}"
                log.debug(
                    "provider %s attempt %d failed: %s", self.provider_id, attempts, last_err
                )
                if attempts <= self.max_retries:
                    await asyncio.sleep(self.backoff_s * attempts)
        h.total_calls += 1
        h.total_failures += 1
        h.last_failure = time.time()
        h.last_error = last_err
        br.record_failure()
        return []


PROVIDERS: Dict[str, Provider] = {}


def register_provider(provider: Provider) -> Provider:
    PROVIDERS[provider.provider_id] = provider
    return provider


def list_providers() -> List[Dict[str, Any]]:
    """Return a snapshot of provider health for the API."""
    out: List[Dict[str, Any]] = []
    for pid, p in PROVIDERS.items():
        h = _health(pid)
        br = _breaker(pid)
        out.append(
            {
                "provider_id": pid,
                "display_name": p.display_name,
                "parameters": p.parameters,
                "priority": p.priority,
                "requires_credentials": p.requires_credentials,
                "credentials_configured": p.has_credentials(),
                "circuit_breaker_state": br.state,
                "consecutive_failures": br.consecutive_failures,
                "last_success": h.last_success,
                "last_failure": h.last_failure,
                "total_calls": h.total_calls,
                "total_failures": h.total_failures,
                "average_latency_ms": round(h.average_latency_ms, 1),
                "last_error": h.last_error,
            }
        )
    return out


# --------------------------------------------------------------------------- #
# HTTP helper shared by providers                                              #
# --------------------------------------------------------------------------- #


_HTTP_POOL: Optional[httpx.AsyncClient] = None


def get_http_client() -> httpx.AsyncClient:
    """Reuse a single connection pool across providers."""
    global _HTTP_POOL
    if _HTTP_POOL is None or _HTTP_POOL.is_closed:
        _HTTP_POOL = httpx.AsyncClient(
            timeout=httpx.Timeout(6.0, connect=3.0),
            limits=httpx.Limits(max_keepalive_connections=40, max_connections=120),
            headers={"User-Agent": "ORCA-4.0/marine-decision-engine"},
        )
    return _HTTP_POOL


async def safe_get_json(
    url: str,
    params: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None,
    timeout: float = 4.0,
) -> Optional[Dict[str, Any]]:
    try:
        client = get_http_client()
        r = await client.get(url, params=params or {}, headers=headers or {}, timeout=timeout)
        if r.status_code != 200:
            return None
        return r.json()
    except Exception as e:
        log.debug("safe_get_json %s failed: %s", url, e)
        return None
