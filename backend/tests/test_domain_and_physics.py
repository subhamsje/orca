"""
Domain Bio-Physics & Geodesic Unit Tests
"""

import pytest
from utils.vessel_twin import calculate_max_safe_wave_height, evaluate_vessel_seaworthiness, calculate_fuel_consumption
from utils.h3_spatial import latlon_to_h3, h3_to_latlon, haversine_distance_km, calculate_bearing_deg, latlon_offset_km
from utils.packet_encoder import pack_telemetry, unpack_telemetry, parse_nmea_gprmc

def test_vessel_twin_hydrodynamics():
    max_safe = calculate_max_safe_wave_height(length_m=8.5, beam_m=2.2)
    assert 1.5 <= max_safe <= 2.5

    eval_calm = evaluate_vessel_seaworthiness(wave_height_m=1.0, wind_speed_kmh=15.0, vessel_profile={"length_m": 8.5})
    assert eval_calm["safe_for_operations"] is True

def test_vessel_fuel_curve():
    fuel_res = calculate_fuel_consumption(distance_km=30.0, vessel_profile={"engine_hp": 9.9, "cruise_speed_knots": 8.0})
    assert fuel_res["transit_hours"] > 0
    assert fuel_res["fuel_consumption_liters"] > 0
    assert fuel_res["transit_minutes"] == int(round(fuel_res["transit_hours"] * 60))

def test_h3_spatial_and_geodesics():
    lat, lon = 16.0215, 73.4821
    hex_id = latlon_to_h3(lat, lon, resolution=7)
    assert hex_id is not None

    c_lat, c_lon = h3_to_latlon(hex_id)
    assert abs(c_lat - lat) < 0.05
    assert abs(c_lon - lon) < 0.05

    dist = haversine_distance_km(16.05, 73.46, 15.50, 73.83)
    assert 50.0 <= dist <= 80.0

    bearing = calculate_bearing_deg(16.0, 73.0, 17.0, 73.0)
    assert bearing == 0.0 or bearing == 360.0

    dest_lat, dest_lon = latlon_offset_km(16.0, 73.0, 111.0, 0.0)
    assert abs(dest_lat - 17.0) < 0.1

def test_binary_packet_codec_and_crc():
    packed = pack_telemetry(lat=16.0215, lon=73.4821, risk_score=28, sos_flag=False, battery_pct=92)
    assert len(packed) in [16, 24]

    unpacked = unpack_telemetry(packed)
    assert unpacked["crc_valid"] is True
    assert abs(unpacked["latitude"] - 16.0215) < 0.001
    assert abs(unpacked["longitude"] - 73.4821) < 0.001
    assert unpacked["risk_score"] == 28
    assert unpacked["sos_flag"] is False
    assert unpacked["battery_pct"] == 92

def test_nmea_parser():
    nmea = "$GPRMC,123519,A,1602.1500,N,07348.2100,E,08.2,240.0,010926,,,A*77"
    parsed = parse_nmea_gprmc(nmea)
    assert parsed is not None
    assert parsed["valid"] is True
    assert abs(parsed["latitude"] - 16.0358) < 0.01
    assert abs(parsed["longitude"] - 73.8035) < 0.01
    assert parsed["speed_knots"] == 8.2
    assert parsed["course_over_ground_deg"] == 240.0
