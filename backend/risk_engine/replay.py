"""
ORCA 4.0 Assessment Replay Store.

An in-memory LRU store keyed by assessment_id. Each entry holds the
immutable input snapshot (canonical records, vessel profile, alerts,
geofence, timestamp) and the final RiskResult so that any
calculation is reproducible from the snapshot.

The store is bounded; old entries are evicted. A persistent backend
(SQLite / Postgres) can replace the in-memory dict without changing
the public API.
"""

from __future__ import annotations

import hashlib
import json
import threading
import time
from collections import OrderedDict
from dataclasses import asdict
from typing import Any, Dict, List, Optional

from data_providers.canonical import CanonicalRecord
from risk_engine.vessel import VesselProfile
from risk_engine.engine import RiskResult


_MAX_ENTRIES = 500


class AssessmentStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._store: "OrderedDict[str, Dict[str, Any]]" = OrderedDict()

    @staticmethod
    def _fingerprint(payload: Dict[str, Any]) -> str:
        s = json.dumps(payload, sort_keys=True, default=str)
        return hashlib.sha256(s.encode("utf-8")).hexdigest()[:16]

    def save(
        self,
        canonical: Dict[str, CanonicalRecord],
        vessel: VesselProfile,
        result: RiskResult,
        alerts: Optional[Dict[str, Any]] = None,
        geofence: Optional[Dict[str, Any]] = None,
        route: Optional[Dict[str, Any]] = None,
        extra: Optional[Dict[str, Any]] = None,
    ) -> str:
        # Build the immutable input snapshot
        snapshot = {
            "timestamp_utc": time.time(),
            "coordinate": result.components[0].details.get("coordinate") if result.components else None,
            "canonical_records": {
                k: v.to_dict() for k, v in canonical.items() if v is not None
            },
            "vessel_profile": vessel.to_dict(),
            "alerts": alerts or {},
            "geofence": geofence or {},
            "route": route or {},
        }
        # Use a stable fingerprint so re-running with the same inputs
        # always returns the same id (replay-friendly).
        assessment_id = self._fingerprint(snapshot)
        snapshot["risk_result"] = result.to_dict()
        if extra:
            snapshot["extras"] = extra
        with self._lock:
            self._store[assessment_id] = snapshot
            self._store.move_to_end(assessment_id)
            while len(self._store) > _MAX_ENTRIES:
                self._store.popitem(last=False)
        return assessment_id

    def get(self, assessment_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            entry = self._store.get(assessment_id)
            if entry is None:
                return None
            self._store.move_to_end(assessment_id)
            return entry

    def recent(self, limit: int = 20) -> List[Dict[str, Any]]:
        with self._lock:
            items = list(self._store.values())[-limit:]
        return [
            {
                "assessment_id": k,
                "timestamp_utc": v["timestamp_utc"],
                "risk_score": v["risk_result"]["risk_score"],
                "risk_label": v["risk_result"]["risk_label"],
            }
            for k, v in reversed(list(self._store.items())[-limit:])
        ]

    def size(self) -> int:
        with self._lock:
            return len(self._store)


assessment_store = AssessmentStore()
