"""
ORCA 4.0 — Structured logging.

Wraps the standard ``logging`` module so every record carries a
correlation / request ID and the service identity. Records are emitted
in a JSON-compatible structured format so the same logger can be
forwarded to stdout (containers) or to an aggregator without
re-parsing.
"""

from __future__ import annotations

import json
import logging
import os
import socket
import sys
import time
from contextvars import ContextVar
from typing import Any, Dict

from utils.config import SETTINGS


_request_id_ctx: ContextVar[str | None] = ContextVar("orca_request_id", default=None)


def set_request_id(request_id: str) -> None:
    _request_id_ctx.set(request_id)


def current_request_id() -> str | None:
    return _request_id_ctx.get()


class _StructuredFormatter(logging.Formatter):
    """Emit JSON-shaped log records. Falls back to a compact key=value
    layout when stdout is not a TTY (typical for containers)."""

    def format(self, record: logging.LogRecord) -> str:
        payload: Dict[str, Any] = {
            "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(record.created)),
            "level": record.levelname,
            "logger": record.name,
            "service": SETTINGS.service_name,
            "version": SETTINGS.service_version,
            "host": socket.gethostname(),
        }
        rid = current_request_id()
        if rid:
            payload["request_id"] = rid
        if record.getMessage():
            payload["message"] = record.getMessage()
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        for key, value in record.__dict__.items():
            if key in (
                "msg",
                "args",
                "levelname",
                "levelno",
                "name",
                "created",
                "msecs",
                "relativeCreated",
                "exc_info",
                "exc_text",
                "stack_info",
                "lineno",
                "funcName",
                "filename",
                "module",
                "pathname",
                "process",
                "processName",
                "thread",
                "threadName",
                "message",
                "taskName",
            ):
                continue
            payload[key] = value
        return json.dumps(payload, default=str, ensure_ascii=False)


_CONFIGURED = False


def configure_logging(level: str | None = None) -> None:
    """Idempotent root-logger configuration."""
    global _CONFIGURED
    if _CONFIGURED:
        return
    lvl = (level or os.environ.get("LOG_LEVEL") or "INFO").upper()
    handler = logging.StreamHandler(stream=sys.stdout)
    handler.setFormatter(_StructuredFormatter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(lvl)
    # Tame uvicorn default handlers so we don't double-log.
    for noisy in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        logging.getLogger(noisy).handlers.clear()
        logging.getLogger(noisy).propagate = True
    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    if not _CONFIGURED:
        configure_logging()
    return logging.getLogger(name)