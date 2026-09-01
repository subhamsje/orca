"""
Database Repository for CRUD Operations
"""

from database.db import get_db_connection
from typing import Dict, Any, List

class DatabaseRepository:
    @staticmethod
    def save_trip_log(lat: float, lon: float, verdict: str, risk_score: int, circuit_breaker: bool, vessel_length_m: float):
        """Saves trip assessment audit log."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO trip_logs (lat, lon, verdict, risk_score, circuit_breaker, vessel_length_m)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (lat, lon, verdict, risk_score, 1 if circuit_breaker else 0, vessel_length_m))
        conn.commit()
        conn.close()

    @staticmethod
    def get_recent_trip_logs(limit: int = 10) -> List[Dict[str, Any]]:
        """Retrieves recent trip logs."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM trip_logs ORDER BY created_at DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @staticmethod
    def save_catch_report(lat: float, lon: float, species: str, weight_kg: float, net_type: str):
        """Saves closed-loop catch report."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO catch_reports (lat, lon, species, weight_kg, net_type)
        VALUES (?, ?, ?, ?, ?)
        """, (lat, lon, species, weight_kg, net_type))
        conn.commit()
        conn.close()

    @staticmethod
    def get_all_catch_reports(limit: int = 20) -> List[Dict[str, Any]]:
        """Retrieves all logged catch reports."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM catch_reports ORDER BY created_at DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

db_repository = DatabaseRepository()
