"""
End-to-End API Route Tests with FastAPI TestClient
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_and_health():
    res1 = client.get("/")
    assert res1.status_code == 200
    assert res1.json()["status"] == "online"

    res2 = client.get("/api/v1/health")
    assert res2.status_code == 200
    assert res2.json()["status"] == "healthy"

def test_assess_trip_api():
    payload = {
        "latitude": 16.0215,
        "longitude": 73.4821,
        "vessel_length_m": 8.5,
        "language": "Marathi"
    }
    res = client.post("/api/v1/assess-trip", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "verdict" in data
    assert "risk_score" in data
    assert "route" in data
    assert "economics" in data
    assert "explanation" in data
    assert "provenance" in data
    assert data["telemetry"]["execution_ms"] > 0

def test_sar_drift_api():
    payload = {
        "last_known_lat": 16.0215,
        "last_known_lon": 73.4821,
        "drift_hours": 6.0,
        "num_particles": 500
    }
    res = client.post("/api/v1/sar-drift", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["hourly_drift_path"]) == 6
    assert data["prioritized_search_radius_km"] > 0

def test_catch_report_and_closed_loop_api():
    payload = {
        "latitude": 16.0215,
        "longitude": 73.4821,
        "species": "Bangda",
        "weight_kg": 85.0,
        "net_type": "Gillnet",
        "sst_observed": 28.4
    }
    res = client.post("/api/v1/submit-catch-report", json=payload)
    assert res.status_code == 200
    assert res.json()["status"] == "success"

    summary_res = client.get("/api/v1/closed-loop/summary")
    assert summary_res.status_code == 200
    assert summary_res.json()["total_reports"] >= 1

def test_offline_bundle_api():
    payload = {
        "center_lat": 16.0215,
        "center_lon": 73.4821,
        "forecast_hours": 72
    }
    res = client.post("/api/v1/offline-bundle", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["forecast_duration_hours"] == 72
    assert "timeline" in data

def test_insurance_claim_api():
    payload = {
        "vessel_id": "IND-MH-07-FRP",
        "policy_id": "POL-PRADHAN-MATSYA-884",
        "fisher_name": "Subham Koli",
        "latitude": 16.0215,
        "longitude": 73.4821
    }
    res = client.post("/api/v1/insurance-claim", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "claim_id" in data
    assert "status" in data

def test_dark_fleet_scan_api():
    payload = {
        "center_lat": 16.0215,
        "center_lon": 73.4821,
        "radius_km": 30.0
    }
    res = client.post("/api/v1/dark-fleet-scan", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "anomalies" in data

def test_binary_pack_unpack_api():
    pack_payload = {
        "latitude": 16.0215,
        "longitude": 73.4821,
        "risk_score": 25,
        "sos_flag": False,
        "battery_pct": 95
    }
    pack_res = client.post("/api/v1/binary-packet/pack", json=pack_payload)
    assert pack_res.status_code == 200
    b64_str = pack_res.json()["base64"]

    unpack_res = client.post("/api/v1/binary-packet/unpack", json={"packet_base64": b64_str})
    assert unpack_res.status_code == 200
    unpacked = unpack_res.json()
    assert unpacked["crc_valid"] is True
    assert unpacked["risk_score"] == 25

def test_harbor_prices_api():
    res = client.get("/api/v1/harbor-prices")
    assert res.status_code == 200
    data = res.json()
    assert "harbors" in data
