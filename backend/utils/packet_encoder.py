"""
16-Byte Binary Packet Serialization Protocol & NMEA 0183 GPS Bridge
Serializes deep-sea telemetry for LoRa mesh and ISRO Nabhmitra / GEMINI S-Band satellite transceivers,
and parses marine NMEA-0183 GPS receiver sentences.
"""

import struct
import time
import re
from typing import Dict, Any, Optional, Tuple

# Binary Spec:
# Latitude (float32, 4B), Longitude (float32, 4B), Epoch Timestamp (uint32, 4B),
# Risk Score (uint8, 1B), Status/SOS Flag (uint8, 1B), Battery/Signal (uint8, 1B), CRC-8 (uint8, 1B) = 16 Bytes exactly
PACKET_FORMAT = "!ffIBBBB"
PACKET_SIZE = struct.calcsize(PACKET_FORMAT)  # Exactly 16 bytes

def calculate_crc8(data: bytes) -> int:
    """Calculates 8-bit CRC checksum (Dallas/Maxim polynomial x^8 + x^5 + x^4 + 1)."""
    crc = 0x00
    for byte in data:
        crc ^= byte
        for _ in range(8):
            if crc & 0x80:
                crc = ((crc << 1) ^ 0x31) & 0xFF
            else:
                crc = (crc << 1) & 0xFF
    return crc

def pack_telemetry(
    lat: float,
    lon: float,
    risk_score: int,
    sos_flag: bool = False,
    battery_pct: int = 95,
    timestamp: Optional[int] = None
) -> bytes:
    """Encodes telemetry into an ultra-dense 16-byte binary payload with CRC-8 validation."""
    epoch_time = int(timestamp or time.time())
    sos_byte = 1 if sos_flag else 0
    risk_byte = min(255, max(0, int(risk_score)))
    batt_byte = min(100, max(0, int(battery_pct)))
    
    # Pack initial 15 bytes to compute CRC
    raw_payload = struct.pack("!ffIBBB", float(lat), float(lon), epoch_time, risk_byte, sos_byte, batt_byte)
    crc_val = calculate_crc8(raw_payload)
    
    return raw_payload + bytes([crc_val])

def unpack_telemetry(packet_bytes: bytes) -> Dict[str, Any]:
    """Decodes a 16-byte binary payload back into a structured dictionary and checks CRC integrity."""
    if len(packet_bytes) != PACKET_SIZE:
        raise ValueError(f"Invalid packet size: expected {PACKET_SIZE} bytes, got {len(packet_bytes)}.")
        
    raw_data, received_crc = packet_bytes[:15], packet_bytes[15]
    expected_crc = calculate_crc8(raw_data)
    crc_valid = (received_crc == expected_crc)
    
    lat, lon, epoch_time, risk_score, sos_byte, batt_byte, _ = struct.unpack(PACKET_FORMAT, packet_bytes)
    
    return {
        "latitude": round(lat, 5),
        "longitude": round(lon, 5),
        "timestamp_epoch": epoch_time,
        "risk_score": risk_score,
        "sos_flag": bool(sos_byte),
        "battery_pct": batt_byte,
        "crc_valid": crc_valid
    }

def parse_nmea_gprmc(nmea_sentence: str) -> Optional[Dict[str, Any]]:
    """
    Parses standard NMEA 0183 $GPRMC (Recommended Minimum Navigation Information) sentence:
    $GPRMC,123519,A,1602.1500,N,07348.2100,E,08.2,240.0,010926,,,A*77
    """
    nmea_sentence = nmea_sentence.strip()
    if not nmea_sentence.startswith("$GPRMC"):
        return None
        
    parts = nmea_sentence.split(",")
    if len(parts) < 10:
        return None
        
    status = parts[2]
    if status != "A":  # 'A' = Valid, 'V' = Warning/Invalid
        return {"status": "void", "valid": False}
        
    # Convert NMEA DDMM.MMMM to Decimal Degrees
    def _to_decimal(deg_min_str: str, hemisphere: str) -> float:
        if not deg_min_str:
            return 0.0
        # Find degrees (2 chars for Lat, 3 for Lon)
        split_idx = 2 if hemisphere in ['N', 'S'] else 3
        degrees = float(deg_min_str[:split_idx])
        minutes = float(deg_min_str[split_idx:])
        decimal = degrees + (minutes / 60.0)
        if hemisphere in ['S', 'W']:
            decimal = -decimal
        return round(decimal, 5)

    lat = _to_decimal(parts[3], parts[4])
    lon = _to_decimal(parts[5], parts[6])
    speed_knots = float(parts[7]) if parts[7] else 0.0
    course_deg = float(parts[8]) if parts[8] else 0.0

    return {
        "valid": True,
        "latitude": lat,
        "longitude": lon,
        "speed_knots": speed_knots,
        "course_over_ground_deg": course_deg
    }
