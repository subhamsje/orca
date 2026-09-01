"""
16-Byte Binary Packet Serialization Protocol
Serializes/deserializes deep-sea telemetry for satellite transceivers and LoRa fleet mesh.
"""

import struct
import time
from typing import Dict, Any

# Packet Spec: Lat (float32), Lon (float32), Timestamp (uint32), Risk Score (uint8), SOS Flag (uint8), Reserved (uint16)
PACKET_FORMAT = "!ffIBBH"
PACKET_SIZE = struct.calcsize(PACKET_FORMAT)  # Exactly 16 bytes

def pack_telemetry(lat: float, lon: float, risk_score: int, sos_flag: bool = False) -> bytes:
    """Encodes telemetry into a 16-byte binary payload."""
    epoch_time = int(time.time())
    sos_byte = 1 if sos_flag else 0
    risk_byte = min(255, max(0, risk_score))
    reserved = 0
    
    return struct.pack(PACKET_FORMAT, lat, lon, epoch_time, risk_byte, sos_byte, reserved)

def unpack_telemetry(packet_bytes: bytes) -> Dict[str, Any]:
    """Decodes a 16-byte binary payload back into a telemetry dictionary."""
    if len(packet_bytes) != PACKET_SIZE:
        raise ValueError(f"Invalid packet size: expected {PACKET_SIZE} bytes, got {len(packet_bytes)}.")
        
    lat, lon, epoch_time, risk_score, sos_byte, reserved = struct.unpack(PACKET_FORMAT, packet_bytes)
    
    return {
        "latitude": round(lat, 5),
        "longitude": round(lon, 5),
        "timestamp_epoch": epoch_time,
        "risk_score": risk_score,
        "sos_flag": bool(sos_byte),
        "reserved": reserved
    }
