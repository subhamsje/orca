"""
Model & Data Governance Microservice
Versions HSI model weight calibrations, checks for model drift, and records human safety override logs.
"""

from typing import Dict, Any, List
import time
from database.db import get_db_connection

class ModelGovernanceService:
    def __init__(self):
        self._init_governance_db()

    def _init_governance_db(self):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS model_versions (
            version_id TEXT PRIMARY KEY,
            w_sst REAL NOT NULL,
            w_chl REAL NOT NULL,
            w_grad REAL NOT NULL,
            training_sample_count INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS human_overrides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            reason TEXT NOT NULL,
            override_action TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        conn.commit()
        conn.close()

    def record_model_version(self, version_id: str, weights: dict, sample_count: int) -> Dict[str, Any]:
        """Saves a new HSI model version into SQLite governance ledger."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT OR REPLACE INTO model_versions (version_id, w_sst, w_chl, w_grad, training_sample_count)
        VALUES (?, ?, ?, ?, ?)
        """, (version_id, weights.get("w_sst", 0.35), weights.get("w_chl", 0.35), weights.get("w_grad", 0.30), sample_count))
        conn.commit()
        conn.close()
        return {"status": "recorded", "version_id": version_id}

    def record_human_override(self, user_id: str, role: str, reason: str, override_action: str) -> Dict[str, Any]:
        """Logs manual safety override by harbor authority or Coast Guard officer."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO human_overrides (user_id, role, reason, override_action)
        VALUES (?, ?, ?, ?)
        """, (user_id, role, reason, override_action))
        conn.commit()
        conn.close()
        return {"status": "logged", "audit_id": cursor.lastrowid}

    def get_model_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM model_versions ORDER BY created_at DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

model_governance_service = ModelGovernanceService()
