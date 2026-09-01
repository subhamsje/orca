"""
PyTest Suite for Audit Hardening Features (Parts A & B)
Tests Dark-Fleet Anomaly Matching, Environmental Hazards, HMAC Signing, GPS Plausibility,
Rate Limiting, Bayesian SAR Resampling, and Governance.
"""

import time
import pytest
from services.dark_fleet_service import dark_fleet_service
from services.environmental_service import environmental_service
from utils.packet_encoder import pack_telemetry, unpack_telemetry
from services.geofence_service import geofence_service
from services.closed_loop_service import closed_loop_service
from services.sar_drift_service import sar_drift_service
from services.model_governance_service import model_governance_service

def test_dark_fleet_anomaly_detection():
    res = dark_fleet_service.detect_anomalies(16.0215, 73.4821)
    assert "anomalies" in res
    assert res["anomalies_found"] >= 1
    anom = res["anomalies"][0]
    assert anom["status"] == "ANOMALY_DETECTED"
    assert "sar_revisit_note" in anom

def test_environmental_hazard_detection():
    res = environmental_service.detect_environmental_hazards(16.0215, 73.4821, chl_mg_m3=3.8, sst_c=28.5)
    assert res["hazards_detected_count"] == 1
    assert res["hazards"][0]["hazard_type"] == "possible_algal_bloom"
    assert res["hazards"][0]["recommendation"] == "avoid_fishing_this_zone"

def test_hmac_packet_authentication():
    # 1. Test valid HMAC signature (24 bytes)
    pkt = pack_telemetry(16.0215, 73.4821, 28, True, device_key=b"SECRET_KEY_123456")
    assert len(pkt) == 24
    decoded = unpack_telemetry(pkt, device_key=b"SECRET_KEY_123456")
    assert decoded["latitude"] == 16.0215
    assert decoded["sos_flag"] == True
    assert decoded["hmac_verified"] == True

    # 2. Test tampered payload detection
    tampered_pkt = bytearray(pkt)
    tampered_pkt[2] ^= 0xFF
    with pytest.raises(ValueError, match="HMAC Packet Signature Verification Failed"):
        unpack_telemetry(bytes(tampered_pkt), device_key=b"SECRET_KEY_123456")

def test_gps_plausibility_check():
    res1 = geofence_service.check_gps_plausibility("VESSEL-99", 16.0000, 73.0000, new_timestamp=1000)
    assert res1["plausible"] == True

    res2 = geofence_service.check_gps_plausibility("VESSEL-99", 20.0000, 78.0000, new_timestamp=1010)
    assert res2["plausible"] == False
    assert res2["location_confidence"] == "low"

def test_closed_loop_rate_limiting():
    closed_loop_service._device_last_submission.clear()
    r1 = closed_loop_service.ingest_catch_report(16.0215, 73.4821, "Bangda", 80.0, "Gillnet", device_id="RATE-DEV-01")
    assert r1["status"] == "success"

    r2 = closed_loop_service.ingest_catch_report(16.0215, 73.4821, "Bangda", 80.0, "Gillnet", device_id="RATE-DEV-01")
    assert r2["status"] == "rate_limited"

def test_bayesian_sar_sighting_update():
    initial = sar_drift_service.simulate_drift_trajectory(16.0215, 73.4821, 6.0)
    updated = sar_drift_service.apply_bayesian_sighting_update(initial, 16.0100, 73.5000, 0.90)
    assert updated["bayesian_update_applied"] == True
    assert updated["updated_search_radius_km"] < initial["prioritized_search_radius_km"]

def test_model_governance_logging():
    res1 = model_governance_service.record_model_version("v4.0.1", {"w_sst": 0.36, "w_chl": 0.34, "w_grad": 0.30}, 150)
    assert res1["status"] == "recorded"
    
    res2 = model_governance_service.record_human_override("OFFICER-01", "Coast Guard", "High Swell Surge", "STAY ASHORE")
    assert res2["status"] == "logged"
