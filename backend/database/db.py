"""
Database Engine & Async SQLite Connection Setup
"""

import os
import sqlite3
from typing import Dict, Any, List

DB_FILE = os.path.join(os.path.dirname(__file__), "orca_local.db")

def get_db_connection():
    """Returns a connection to the local SQLite database."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database schema if tables do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Table 1: Vessel Digital Twin Profiles
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vessel_profiles (
        vessel_id TEXT PRIMARY KEY,
        vessel_name TEXT NOT NULL,
        length_m REAL NOT NULL,
        engine_hp REAL NOT NULL,
        fuel_capacity_l REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Table 2: Trip Assessment Audit Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS trip_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        verdict TEXT NOT NULL,
        risk_score INTEGER NOT NULL,
        circuit_breaker INTEGER NOT NULL,
        vessel_length_m REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Table 3: Closed-Loop Catch Reports
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS catch_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        species TEXT NOT NULL,
        weight_kg REAL NOT NULL,
        net_type TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()

# Initialize DB on module load
init_db()
