"""
Tests for Deterministic Safety Circuit Breaker Rules
"""

import pytest
from services.safety_service import safety_service

def test_circuit_breaker_cyclone_override():
    alerts = {"has_active_cyclone_alert": True, "cyclone_name": "Very Severe Cyclone SAGAR"}
    weather = {"wind_speed_kmh": 12.0, "wind_gust_kmh": 15.0}
    wave = {"significant_wave_height_m": 0.8, "swell_period_sec": 10.0}

    eval_res = safety_service.evaluate_safety_and_circuit_breaker(
        weather_metrics=weather,
        wave_metrics=wave,
        alerts=alerts,
        vessel_length_m=12.0
    )
    assert eval_res["override_active"] is True
    assert eval_res["risk_score"] == 100
    assert "EXTREME DANGER" in eval_res["verdict_label"]
    assert eval_res["audit_trail"]["rule_triggered"] == "RULE_1_CYCLONE_OVERRIDE"

def test_circuit_breaker_wave_capsize_breach():
    alerts = {"has_active_cyclone_alert": False}
    weather = {"wind_speed_kmh": 20.0, "wind_gust_kmh": 25.0}
    # 3.2m wave is dangerous for 6.0m small craft (max safe ~ 1.5m)
    wave = {"significant_wave_height_m": 3.2, "swell_period_sec": 8.0}

    eval_res = safety_service.evaluate_safety_and_circuit_breaker(
        weather_metrics=weather,
        wave_metrics=wave,
        alerts=alerts,
        vessel_length_m=6.0
    )
    assert eval_res["override_active"] is True
    assert eval_res["risk_score"] == 90
    assert "CAPSIZE DANGER" in eval_res["verdict_label"]
    assert eval_res["audit_trail"]["rule_triggered"] == "RULE_3_CAPSIZE_THRESHOLD_BREACH"

def test_circuit_breaker_gale_gust_breach():
    alerts = {"has_active_cyclone_alert": False}
    weather = {"wind_speed_kmh": 35.0, "wind_gust_kmh": 55.0}  # Gusts > 48 km/h
    wave = {"significant_wave_height_m": 1.2, "swell_period_sec": 10.0}

    eval_res = safety_service.evaluate_safety_and_circuit_breaker(
        weather_metrics=weather,
        wave_metrics=wave,
        alerts=alerts,
        vessel_length_m=14.0
    )
    assert eval_res["override_active"] is True
    assert eval_res["risk_score"] == 85
    assert "GALE WINDS" in eval_res["verdict_label"]

def test_circuit_breaker_normal_safe_sea():
    alerts = {"has_active_cyclone_alert": False}
    weather = {"wind_speed_kmh": 14.0, "wind_gust_kmh": 18.0}
    wave = {"significant_wave_height_m": 0.9, "swell_period_sec": 11.0}

    eval_res = safety_service.evaluate_safety_and_circuit_breaker(
        weather_metrics=weather,
        wave_metrics=wave,
        alerts=alerts,
        vessel_length_m=8.5
    )
    assert eval_res["override_active"] is False
    assert eval_res["risk_score"] < 40
    assert eval_res["verdict_label"] == "SAFE TO VENTURE"
