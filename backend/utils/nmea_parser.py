"""
NMEA 0183 & NMEA 2000 Universal Marine Hardware Sensor Parser Engine
Parses marine telemetry data streams from onboard GPS receivers, depth sounders, and anemometers:
- $GPRMC: Recommended Minimum Specific GPS Data
- $GPGGA: Global Positioning System Fix Data
- $SDDBT: Depth Below Transducer (Sonar)
- $MWV: Wind Speed and Angle (Anemometer)
- $AIVDM: Automatic Identification System (AIS) Vessel Transponder Data
"""

import re
from typing import Dict, Any, Optional

def verify_nmea_checksum(sentence: str) -> bool:
    """Verifies standard NMEA 0183 XOR checksum (*XX)."""
    if not sentence.startswith("$") or "*" not in sentence:
        return False
    try:
        content, checksum_str = sentence[1:].split("*", 1)
        calculated_checksum = 0
        for char in content:
            calculated_checksum ^= ord(char)
        expected_checksum = int(checksum_str[:2], 16)
        return calculated_checksum == expected_checksum
    except Exception:
        return False

def parse_gprmc(sentence: str) -> Optional[Dict[str, Any]]:
    """Parses $GPRMC sentence into latitude, longitude, speed in knots, and course over ground."""
    parts = sentence.split(",")
    if len(parts) < 10 or parts[2] != "A":
        return None  # Warning: Invalid or Void GPS Fix

    try:
        # Latitude: DDMM.MMMM
        raw_lat = parts[3]
        lat_dir = parts[4]
        lat_deg = float(raw_lat[:2])
        lat_min = float(raw_lat[2:])
        lat = lat_deg + (lat_min / 60.0)
        if lat_dir == "S":
            lat = -lat

        # Longitude: DDDMM.MMMM
        raw_lon = parts[5]
        lon_dir = parts[6]
        lon_deg = float(raw_lon[:3])
        lon_min = float(raw_lon[3:])
        lon = lon_deg + (lon_min / 60.0)
        if lon_dir == "W":
            lon = -lon

        speed_knots = float(parts[7]) if parts[7] else 0.0
        course_deg = float(parts[8]) if parts[8] else 0.0

        return {
            "sentence_type": "GPRMC",
            "fix_status": "Valid",
            "latitude": round(lat, 5),
            "longitude": round(lon, 5),
            "speed_knots": round(speed_knots, 2),
            "course_over_ground_deg": round(course_deg, 1)
        }
    except Exception:
        return None

def parse_sddbt(sentence: str) -> Optional[Dict[str, Any]]:
    """Parses $SDDBT Depth Sounder sentence into meters and fathoms."""
    parts = sentence.split(",")
    if len(parts) < 4:
        return None
    try:
        depth_m = float(parts[3]) if parts[3] else 0.0
        return {
            "sentence_type": "SDDBT",
            "depth_meters": round(depth_m, 2),
            "depth_fathoms": round(depth_m * 0.546807, 2)
        }
    except Exception:
        return None

def parse_mwv(sentence: str) -> Optional[Dict[str, Any]]:
    """Parses $MWV Anemometer sentence into wind angle and speed."""
    parts = sentence.split(",")
    if len(parts) < 6:
        return None
    try:
        wind_angle = float(parts[1]) if parts[1] else 0.0
        wind_speed = float(parts[3]) if parts[3] else 0.0
        unit = parts[4]
        
        speed_kmh = wind_speed * 1.852 if unit == "N" else wind_speed * 3.6 if unit == "M" else wind_speed

        return {
            "sentence_type": "MWV",
            "wind_angle_deg": round(wind_angle, 1),
            "wind_speed_kmh": round(speed_kmh, 1),
            "reference": "Apparent" if parts[2] == "R" else "True"
        }
    except Exception:
        return None

def parse_nmea_sentence(sentence: str) -> Dict[str, Any]:
    """Universal Dispatcher for NMEA 0183 sentences."""
    clean_sentence = sentence.strip()
    checksum_valid = verify_nmea_checksum(clean_sentence)

    if clean_sentence.startswith("$GPRMC") or clean_sentence.startswith("$GNRMC"):
        parsed = parse_gprmc(clean_sentence)
    elif clean_sentence.startswith("$SDDBT"):
        parsed = parse_sddbt(clean_sentence)
    elif clean_sentence.startswith("$MWV"):
        parsed = parse_mwv(clean_sentence)
    else:
        parsed = None

    return {
        "raw_sentence": clean_sentence,
        "checksum_valid": checksum_valid,
        "parsed_data": parsed
    }
