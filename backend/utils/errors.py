"""
ORCA 4.0 — Domain exception hierarchy.

Every failure mode in the backend maps to a named exception so that:

- route handlers can translate them into structured HTTP responses
- the safety kernel can refuse decisions without ambiguity
- the world model can explicitly mark feeds as unavailable instead of
  silently returning a hardcoded constant.

NEVER use bare ``Exception`` in domain services.
"""

from __future__ import annotations


class OrcaError(Exception):
    """Base class for every error raised inside the ORCA backend."""

    http_status: int = 500
    code: str = "orca_error"

    def __init__(self, message: str, *, details: dict | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details or {}

    def to_dict(self) -> dict:
        return {
            "error": self.code,
            "message": self.message,
            "details": self.details,
        }


class FeedUnavailable(OrcaError):
    """Upstream feed (Open-Meteo, INCOIS, AIS, …) is unreachable."""

    http_status = 503
    code = "feed_unavailable"


class StaleData(OrcaError):
    """Cached data exists but is older than the freshness threshold."""

    http_status = 503
    code = "stale_data"


class InvalidObservation(OrcaError):
    """An observation failed validation (out-of-range coordinates,
    nonsensical wave height, etc.). The caller should reject it."""

    http_status = 422
    code = "invalid_observation"


class SafetyRefused(OrcaError):
    """The deterministic safety kernel refused a request. Caller MUST
    surface the refusal, never override it."""

    http_status = 409
    code = "safety_refused"


class Unauthorized(OrcaError):
    """Caller did not provide valid authority credentials."""

    http_status = 401
    code = "unauthorized"


class Forbidden(OrcaError):
    """Caller is authenticated but lacks the required scope."""

    http_status = 403
    code = "forbidden"


class RateLimited(OrcaError):
    """Caller exceeded the configured rate-limit budget."""

    http_status = 429
    code = "rate_limited"