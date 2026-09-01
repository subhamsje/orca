"""
ORCA 4.0 Primary FastAPI Web Application Server
Exposes high-performance REST and WebSockets endpoints for marine intelligence,
NMEA hardware sensor ingestion, SAR Monte Carlo drift, CPA collision guard, and governance ledgers.
"""

import os
import base64
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List

from orchestrator import MultiAgentOrchestrator
from services.sar_drift_service import sar_drift_service
from services.closed_loop_service import closed_loop_service
from services.dark_fleet_service import dark_fleet_service
from services.environmental_service import environmental_service
from services.model_governance_service import model_governance_service
from services.collision_service import collision_service
from services.offline_sync_service import offline_sync_service
from services.insurance_service import insurance_service
from services.economic_service import economic_service
from utils.nmea_parser import parse_nmea_sentence
from utils.engine_twin import calculate_detailed_engine_metrics
from utils.packet_encoder import pack_telemetry, unpack_telemetry
from database.repository import db_repository

app = FastAPI(
    title="ORCA 4.0 Marine Intelligence Operating System",
    description="Sponsored by ISRO / SIH26176 / INCOIS / IMD",
    version="4.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = MultiAgentOrchestrator()

# Request Models
class TripAssessmentRequest(BaseModel):
    latitude: float = Field(..., example=16.0215)
    longitude: float = Field(..., example=73.4821)
    vessel_length_m: float = Field(8.5, example=8.5)
    language: str = Field("Marathi", example="Marathi")
    query_text: Optional[str] = Field(None, example="Is it safe to fish near Goa?")

class NmeaParseRequest(BaseModel):
    sentence: str = Field(..., example="$GPRMC,123519,A,1602.1500,N,07348.2100,E,08.2,240.0,010926,,,A*77")

class CollisionRequest(BaseModel):
    own_lat: float = Field(..., example=16.0215)
    own_lon: float = Field(..., example=73.4821)
    own_speed_knots: float = Field(8.0, example=8.0)
    own_cog_deg: float = Field(240.0, example=240.0)
    target_lat: float = Field(..., example=16.0365)
    target_lon: float = Field(..., example=73.4671)
    target_speed_knots: float = Field(12.0, example=12.0)
    target_cog_deg: float = Field(160.0, example=160.0)

class EngineMetricsRequest(BaseModel):
    distance_km: float = Field(..., example=30.0)
    vessel_speed_knots: float = Field(8.0, example=8.0)
    engine_hp: float = Field(9.9, example=9.9)
    headwind_kmh: float = Field(15.0, example=15.0)
    wave_height_m: float = Field(1.1, example=1.1)

class SARDriftRequest(BaseModel):
    last_known_lat: float = Field(..., example=16.0215)
    last_known_lon: float = Field(..., example=73.4821)
    drift_hours: float = Field(6.0, example=6.0)

class SightingUpdateRequest(BaseModel):
    sighting_lat: float = Field(..., example=16.0100)
    sighting_lon: float = Field(..., example=73.5000)
    confidence: float = Field(0.90, example=0.90)

class CatchReportRequest(BaseModel):
    latitude: float = Field(..., example=16.0215)
    longitude: float = Field(..., example=73.4821)
    species: str = Field(..., example="Bangda")
    weight_kg: float = Field(..., example=85.0)
    net_type: str = Field("Gillnet", example="Gillnet")
    device_id: Optional[str] = Field("DEV-01")

class GovernanceOverrideRequest(BaseModel):
    user_id: str = Field(..., example="CG-01")
    role: str = Field(..., example="Coast Guard Officer")
    reason: str = Field(..., example="High Swell Surge Warning")
    override_action: str = Field(..., example="HARBOR RECALL")

class OfflineBundleRequest(BaseModel):
    center_lat: float = Field(..., example=16.0215)
    center_lon: float = Field(..., example=73.4821)
    forecast_hours: int = Field(72, example=72)

class InsuranceClaimRequest(BaseModel):
    vessel_id: str = Field(..., example="IND-MH-07-FRP")
    policy_id: str = Field(..., example="POL-PRADHAN-MATSYA-884")
    fisher_name: str = Field(..., example="Subham Koli")
    latitude: float = Field(..., example=16.0215)
    longitude: float = Field(..., example=73.4821)

class DarkFleetScanRequest(BaseModel):
    center_lat: float = Field(..., example=16.0215)
    center_lon: float = Field(..., example=73.4821)
    radius_km: float = Field(30.0, example=30.0)

class BinaryPackRequest(BaseModel):
    latitude: float = Field(..., example=16.0215)
    longitude: float = Field(..., example=73.4821)
    risk_score: int = Field(..., example=25)
    sos_flag: bool = Field(False, example=False)
    battery_pct: int = Field(95, example=95)

class BinaryUnpackRequest(BaseModel):
    packet_base64: str = Field(..., example="")

@app.get("/")
async def root():
    return {
        "status": "online",
        "system": "ORCA 4.0 Universal Marine System",
        "organization": "ISRO / SIH26176",
        "demo_mode": True,
        "version": "4.0.0"
    }

@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "system": "ORCA 4.0 Universal Marine System"}

@app.post("/api/v1/assess-trip")
async def assess_trip(req: TripAssessmentRequest):
    return await orchestrator.execute_pipeline(
        lat=req.latitude,
        lon=req.longitude,
        vessel_length_m=req.vessel_length_m,
        language=req.language,
        query_text=req.query_text
    )

@app.post("/api/v1/hardware/nmea")
async def parse_nmea(req: NmeaParseRequest):
    return parse_nmea_sentence(req.sentence)

@app.post("/api/v1/collision/cpa")
async def calculate_collision(req: CollisionRequest):
    return collision_service.calculate_cpa_tcpa(
        own_lat=req.own_lat, own_lon=req.own_lon, own_speed_knots=req.own_speed_knots, own_cog_deg=req.own_cog_deg,
        target_lat=req.target_lat, target_lon=req.target_lon, target_speed_knots=req.target_speed_knots, target_cog_deg=req.target_cog_deg
    )

@app.post("/api/v1/engine/metrics")
async def calculate_engine(req: EngineMetricsRequest):
    return calculate_detailed_engine_metrics(
        distance_km=req.distance_km, vessel_speed_knots=req.vessel_speed_knots, engine_hp=req.engine_hp,
        headwind_kmh=req.headwind_kmh, wave_height_m=req.wave_height_m
    )

@app.post("/api/v1/sar-drift")
async def simulate_sar(req: SARDriftRequest):
    return sar_drift_service.simulate_drift_trajectory(
        last_known_lat=req.last_known_lat,
        last_known_lon=req.last_known_lon,
        drift_hours=req.drift_hours
    )

@app.post("/api/v1/sar-sighting-update")
async def sighting_update(req: SightingUpdateRequest):
    initial = sar_drift_service.simulate_drift_trajectory(16.0215, 73.4821, drift_hours=6.0)
    return sar_drift_service.apply_bayesian_sighting_update(
        initial_simulation=initial,
        sighting_lat=req.sighting_lat,
        sighting_lon=req.sighting_lon,
        sighting_confidence=req.confidence
    )

@app.get("/api/v1/authority/anomalies")
async def get_dark_fleet_anomalies():
    return dark_fleet_service.scan_sector_anomalies(center_lat=16.0215, center_lon=73.4821)

@app.post("/api/v1/dark-fleet-scan")
async def scan_dark_fleet(req: DarkFleetScanRequest):
    return dark_fleet_service.scan_sector_anomalies(center_lat=req.center_lat, center_lon=req.center_lon, radius_km=req.radius_km)

@app.get("/api/v1/environmental/hazards")
async def get_environmental_hazards():
    return environmental_service.detect_algal_blooms_and_slicks(lat=16.0215, lon=73.4821)

@app.post("/api/v1/submit-catch-report")
async def submit_catch(req: CatchReportRequest):
    return closed_loop_service.ingest_catch_report(
        lat=req.latitude, lon=req.longitude, species=req.species,
        weight_kg=req.weight_kg, net_type=req.net_type, device_id=req.device_id or "DEV-01"
    )

@app.get("/api/v1/closed-loop/summary")
async def get_closed_loop_summary():
    return closed_loop_service.get_calibration_summary()

@app.post("/api/v1/offline-bundle")
async def build_offline_bundle(req: OfflineBundleRequest):
    return offline_sync_service.build_offline_bundle(center_lat=req.center_lat, center_lon=req.center_lon, forecast_hours=req.forecast_hours)

@app.post("/api/v1/insurance-claim")
async def verify_insurance(req: InsuranceClaimRequest):
    return insurance_service.verify_claim(vessel_id=req.vessel_id, policy_id=req.policy_id, fisher_name=req.fisher_name, lat=req.latitude, lon=req.longitude)

@app.post("/api/v1/binary-packet/pack")
async def pack_binary_packet(req: BinaryPackRequest):
    packed = pack_telemetry(lat=req.latitude, lon=req.longitude, risk_score=req.risk_score, sos_flag=req.sos_flag, battery_pct=req.battery_pct)
    b64_val = base64.b64encode(packed).decode("utf-8")
    return {"hex_packet": packed.hex(), "base64": b64_val, "byte_length": len(packed)}

@app.post("/api/v1/binary-packet/unpack")
async def unpack_binary_packet(req: BinaryUnpackRequest):
    raw_bytes = base64.b64decode(req.packet_base64)
    return unpack_telemetry(raw_bytes)

@app.get("/api/v1/harbor-prices")
async def get_harbor_prices():
    return economic_service.get_all_harbor_wholesale_prices()

@app.post("/api/v1/demo/scenario")
async def set_demo_scenario(payload: dict):
    scenario = payload.get("scenario_key", "safe")
    return {"status": "success", "active_scenario": scenario}

@app.post("/api/v1/governance/override")
async def log_governance_override(req: GovernanceOverrideRequest):
    return model_governance_service.log_human_override(
        user_id=req.user_id, role=req.role, reason=req.reason, override_action=req.override_action
    )

@app.get("/api/v1/history/trips")
async def get_trip_history():
    return db_repository.get_recent_trip_logs(limit=20)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
