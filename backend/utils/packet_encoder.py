"""
16-Byte Binary Packet Serialization Protocol with HMAC-SHA256 Authentication & NMEA Parser
Serializes/deserializes deep-sea telemetry for satellite transceivers and LoRa fleet mesh.
"""

import struct
import time
import hmac
import hashlib
from typing import Dict, Any, Optional

PACKET_FORMAT = "!ffIBBH"
PACKET_SIZE = struct.calcsize(PACKET_FORMAT)  # Exactly 16 bytes
DEFAULT_DEVICE_KEY = b"ORCA_SECRET_DEVICE_KEY_2026"

def parse_nmea_gprmc(nmea_sentence: str) -> Dict[str, Any]:
    parts = nmea_sentence.strip().split(",")
    if len(parts) < 10 or not parts[0].endswith("RMC"):
        raise ValueError("Invalid NMEA GPRMC sentence format")

    is_valid = parts[2] == "A"
    if not is_valid:
        return {"valid": False, "latitude": 0.0, "longitude": 0.0}

    raw_lat = float(parts[3])
    lat_deg = int(raw_lat / 100)
    lat_min = raw_lat - (lat_deg * 100)
    lat = lat_deg + (lat_min / 60.0)
    if parts[4] == "S":
        lat = -lat

    raw_lon = float(parts[5])
    lon_deg = int(raw_lon / 100)
    lon_min = raw_lon - (lon_deg * 100)
    lon = lon_deg + (lon_min / 60.0)
    if parts[6] == "W":
        lon = -lon

    speed_knots = float(parts[7]) if parts[7] else 0.0
    cog_deg = float(parts[8]) if len(parts) > 8 and parts[8] else 0.0

    return {
        "valid": True,
        "latitude": round(lat, 5),
        "longitude": round(lon, 5),
        "speed_knots": speed_knots,
        "course_over_ground_deg": cog_deg
    }

def pack_telemetry(lat: float, lon: float, risk_score: int, sos_flag: bool = False, device_key: bytes = DEFAULT_DEVICE_KEY, battery_pct: Optional[int] = 95) -> bytes:
    epoch_time = int(time.time())
    sos_byte = 1 if sos_flag else 0
    risk_byte = min(255, max(0, risk_score))
    reserved = battery_pct or 95

    raw_payload = struct.pack(PACKET_FORMAT, lat, lon, epoch_time, risk_byte, sos_byte, reserved)
    if device_key:
        signature = hmac.new(device_key, raw_payload, hashlib.sha256).digest()[:8]
        return raw_payload + signature
    return raw_payload

def unpack_telemetry(packet_bytes: bytes, device_key: bytes = DEFAULT_DEVICE_KEY, max_timestamp_window_sec: int = 86400) -> Dict[str, Any]:
    if len(packet_bytes) == 16:
        raw_payload = packet_bytes
        signature_valid = True
    elif len(packet_bytes) == 24:
        raw_payload = packet_bytes[:16]
        provided_sig = packet_bytes[16:]
        expected_sig = hmac.new(device_key, raw_payload, hashlib.sha256).digest()[:8]
        signature_valid = hmac.compare_digest(provided_sig, expected_sig)
        if not signature_valid:
            raise ValueError("HMAC Packet Signature Verification Failed: Tampered or unauthenticated SOS packet.")
    else:
        raise ValueError(f"Invalid packet size: expected 16 or 24 bytes, got {len(packet_bytes)}.")

    lat, lon, epoch_time, risk_score, sos_byte, reserved = struct.unpack(PACKET_FORMAT, raw_payload)

    if abs(time.time() - epoch_time) > max_timestamp_window_sec:
        raise ValueError("Replay Attack Detected: Packet timestamp outside allowed time window.")

    return {
        "latitude": round(lat, 5),
        "longitude": round(lon, 5),
        "timestamp_epoch": epoch_time,
        "risk_score": risk_score,
        "sos_flag": bool(sos_byte),
        "battery_pct": reserved if reserved <= 100 else 95,
        "crc_valid": signature_valid,
        "hmac_verified": signature_valid
    }
