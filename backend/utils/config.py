"""
ORCA 4.0 — Centralised configuration.

All operational knobs (CORS origins, auth keys, environment toggles,
external endpoints) are loaded once at import time. No service reads
``os.environ`` directly — that keeps secrets contained and makes the
service trivially testable.

Security rule: secrets MUST NEVER be returned through any API response.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import List


def _csv(value: str | None) -> List[str]:
    if not value:
        return []
    return [v.strip() for v in value.split(",") if v.strip()]


@dataclass(frozen=True)
class Settings:
    environment: str = "development"
    demo_mode: bool = True

    # Network / CORS
    cors_allow_origins: List[str] = field(default_factory=lambda: ["http://localhost:5173"])

    # Auth — comma-separated list of accepted static tokens for the
    # governance / authority endpoints. In production these are issued
    # by the institutional IdP, not stored in env. The list here exists
    # only so dev environments can issue a stable token without spinning
    # up an OIDC provider.
    authority_tokens: List[str] = field(default_factory=list)

    # Rate limiting
    rate_limit_per_minute: int = 120

    # Service identity
    service_name: str = "orca-backend"
    service_version: str = "4.0.0"

    # External feed toggles (defaults to live; in CI / offline test envs
    # these can be disabled).
    enable_external_feeds: bool = True

    # Operational thresholds (kept here so tests can override).
    capsize_threshold_multiplier_length: float = 0.22
    capsize_threshold_multiplier_beam: float = 0.05


def load_settings() -> Settings:
    env = (os.environ.get("ENVIRONMENT") or "development").lower()
    is_production = env == "production"

    # CORS: never allow wildcard in production.
    if is_production:
        raw_origins = os.environ.get("CORS_ALLOW_ORIGINS")
        origins = _csv(raw_origins)
        if not origins:
            origins = []
    else:
        raw_origins = os.environ.get("CORS_ALLOW_ORIGINS")
        origins = _csv(raw_origins) or ["http://localhost:5173", "http://127.0.0.1:5173"]

    return Settings(
        environment=env,
        demo_mode=(os.environ.get("DEMO_MODE", "true").lower() == "true"),
        cors_allow_origins=origins,
        authority_tokens=_csv(os.environ.get("ORCA_AUTHORITY_TOKENS")),
        rate_limit_per_minute=int(os.environ.get("RATE_LIMIT_PER_MINUTE", "120")),
        enable_external_feeds=(os.environ.get("ENABLE_EXTERNAL_FEEDS", "true").lower() == "true"),
    )


SETTINGS = load_settings()