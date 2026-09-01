"""
Tests for Closed-Loop Machine Learning, Power Modules & Dark-Fleet Scanner
"""

import pytest
from services.closed_loop_service import closed_loop_service
from services.economic_service import economic_service
from services.sar_drift_service import sar_drift_service
from services.dark_fleet_service import dark_fleet_service
from services.offline_sync_service import offline_sync_service

def test_closed_loop_valid_ingestion_and_weight_nudge():
    closed_loop_service._device_last_submission.clear()
    res = closed_loop_service.ingest_catch_report(
        lat=16.0215,
        lon=73.4821,
        species="Bangda",
        weight_kg=115.0,
        net_type="Gillnet",
        sst_observed=28.2,
        device_id="POWER-TEST-01"
    )
    assert res["status"] == "success"
    assert "CATCH-" in res["report_id"]
    assert res["model_calibration_active"] is True
    assert "h3_spatial_cell" in res

def test_closed_loop_outlier_rejection():
    closed_loop_service._device_last_submission.clear()
    res_bad = closed_loop_service.ingest_catch_report(
        lat=16.0215,
        lon=73.4821,
        species="Bangda",
        weight_kg=9000.0,
        net_type="Gillnet",
        device_id="POWER-TEST-OUTLIER"
    )
    assert res_bad["status"] == "rejected"

def test_economic_roi_optimizer_harbors():
    target = {"likely_species": ["Surmai", "Bangda"]}
    profile = {"length_m": 8.5, "engine_hp": 9.9}
    res = economic_service.optimize_trip_economics(target_ground=target, vessel_profile=profile, fuel_liters=14.0)
    assert "best_docking_harbor" in res
    assert res["max_expected_profit_inr"] > 0

def test_dark_fleet_radar_scanner():
    scan_res = dark_fleet_service.scan_sector_anomalies(center_lat=16.0215, center_lon=73.4821, radius_km=30.0)
    assert scan_res["total_radar_contacts"] > 0
    assert "anomalies" in scan_res

def test_offline_forecast_bundler():
    bundle = offline_sync_service.generate_sector_bundle(center_lat=16.0215, center_lon=73.4821, forecast_hours=72)
    assert bundle["forecast_duration_hours"] == 72
    assert "timeline" in bundle
