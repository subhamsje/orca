"""
ORCA 4.0 — Authentication & authorisation primitives.

The ORCA backend is intended to operate in two deployment modes:

1. ``single-tenant`` (development, on-prem pilot) — a static list of
   authority tokens issued to operators and used as bearer tokens.
2. ``institutional`` (production) — tokens are issued by an external
   identity provider. This module handles both: bearer tokens are
   validated against ``SETTINGS.authority_tokens`` for development,
   and the verification hook is intentionally pluggable so a future
   OIDC validator can drop in without changing call-sites.

We never log the token value.
"""

from __future__ import annotations

from typing import Iterable

from fastapi import Depends, Header, status

from utils.config import SETTINGS
from utils.errors import Forbidden, Unauthorized


def _extract_bearer(authorization: str | None) -> str:
    if not authorization:
        raise Unauthorized("Missing Authorization header.")
    parts = authorization.strip().split()
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1]:
        raise Unauthorized("Malformed Authorization header.")
    return parts[1]


def verify_authority_token(token: str) -> None:
    """Raises ``Unauthorized`` when the token does not match an issued
    authority token. Empty / missing tokens always fail."""
    if not token:
        raise Unauthorized("Missing bearer token.")
    if not SETTINGS.authority_tokens:
        # No tokens configured — refuse in production, allow in dev.
        if SETTINGS.environment == "production":
            raise Unauthorized("No authority tokens configured for this deployment.")
        return
    if token not in SETTINGS.authority_tokens:
        raise Unauthorized("Token is not recognised.")


def require_authority(
    authorization: str | None = Header(default=None, alias="Authorization"),
) -> str:
    """FastAPI dependency: validate the bearer token and return its
    (sanitised) identity string. Use as ``Depends(require_authority)``
    on endpoints that mutate authority records or override safety."""
    token = _extract_bearer(authorization)
    verify_authority_token(token)
    # Never echo the token back to the caller.
    return f"token:{hash(token) & 0xffff:04x}"


def require_scope(*required_scopes: str):
    """Build a FastAPI dependency that requires the caller to hold every
    given scope. Scopes are conveyed via the ``X-ORCA-Scopes`` header
    (comma-separated)."""

    def dependency(
        authorization: str | None = Header(default=None, alias="Authorization"),
        scopes_header: str | None = Header(default=None, alias="X-ORCA-Scopes"),
    ) -> str:
        token = _extract_bearer(authorization)
        verify_authority_token(token)
        granted = _parse_scopes(scopes_header)
        missing = [s for s in required_scopes if s not in granted]
        if missing:
            raise Forbidden(
                "Caller lacks required scope(s).",
                details={"missing_scopes": list(missing)},
            )
        return f"token:{hash(token) & 0xffff:04x}"

    return dependency


def _parse_scopes(header_value: str | None) -> frozenset[str]:
    if not header_value:
        return frozenset()
    return frozenset(s.strip() for s in header_value.split(",") if s.strip())