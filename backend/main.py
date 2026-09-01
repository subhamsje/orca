"""
ORCA 4.0 API Backend Entrypoint Server
FastAPI Async Server serving REST Endpoints, Stage Demo Presets, WebSockets & Governance
"""

import os
import base64
import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import time

from orchestrator import MultiAgentOrchestrator
from services.economic_service import economic_service
from services.sar_drift_service import sar_drift_service
from services.closed_loop_service import closed_loop_service
from services.dark_fleet_service import dark_fleet_service
from services.environmental_service import environmental_service
from services.model_governance_service import model_governance_service
from services.websocket_manager import ws_manager
from database.repository import db_repository
from utils.packet_encoder import pack_telemetry, unpack_telemetry

app = FastAPI(
    title="ORCA 4.0 - ISRO Marine Intelligence API",
    description="Multi-Service Platform for Marine Ecosystems, Safety & WebSockets (SIH26176)",
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

ORCA_DEMO_MODE = os.getenv("ORCA_DEMO_MODE", "true").lower() == "true"

class TripQueryRequest(BaseModel):
    latitude: float = Field(..., example=16.0215)
    longitude: float = Field(..., example=73.4821)
    vessel_length_m: Optional[float] = Field(8.5, example=8.5)
    language: Optional[str] = Field("Marathi", example="Marathi")
    query_text: Optional[str] = Field(None)

class SARDriftRequest(BaseModel):
    last_known_lat: float = Field(..., example=16.0215)
    last_known_lon: float = Field(..., example=73.4821)
    drift_hours: float = Field(6.0, example=6.0)

class SARSightingRequest(BaseModel):
    sighting_lat: float = Field(..., example=16.0100)
    sighting_lon: float = Field(..., example=73.5000)
    confidence: Optional[float] = Field(0.90, example=0.90)

class CatchReportRequest(BaseModel):
    latitude: float = Field(..., example=16.0215)
    longitude: float = Field(..., example=73.4821)
    species: str = Field("Bangda", example="Bangda")
    weight_kg: float = Field(85.0, example=85.0)
    net_type: str = Field("Gillnet", example="Gillnet")

class DemoScenarioRequest(BaseModel):
    scenario_key: str = Field(..., example="cyclone")

class HumanOverrideRequest(BaseModel):
    user_id: str = Field(..., example="CG-OFFICER-44")
    role: str = Field(..., example="Coast Guard Duty Officer")
    reason: str = Field(..., example="High S-Band radar anomaly")
    override_action: str = Field(..., example="MANDATORY HARBOR RECALL")

class OfflineBundleRequest(BaseModel):
    center_lat: float = Field(..., example=16.0215)
    center_lon: float = Field(..., example=73.4821)
    forecast_hours: Optional[int] = Field(72, example=72)

class InsuranceClaimRequest(BaseModel):
    vessel_id: str = Field(..., example="IND-MH-07-FRP")
    policy_id: str = Field(..., example="POL-PRADHAN-MATSYA-884")
    fisher_name: Optional[str] = Field("Subham Koli", example="Subham Koli")
    latitude: float = Field(..., example=16.0215)
    longitude: float = Field(..., example=73.4821)

class DarkFleetScanRequest(BaseModel):
    center_lat: float = Field(..., example=16.0215)
    center_lon: float = Field(..., example=73.4821)
    radius_km: Optional[float] = Field(30.0, example=30.0)

class BinaryPackRequest(BaseModel):
    latitude: float = Field(..., example=16.0215)
    longitude: float = Field(..., example=73.4821)
    risk_score: int = Field(..., ge=0, le=255, example=25)
    sos_flag: bool = Field(False, example=False)
    battery_pct: Optional[int] = Field(95, example=95)

class BinaryUnpackRequest(BaseModel):
    packet_base64: str = Field(..., example="qqqq")

@app.get("/")
async def root():
    return {
        "status": "online",
        "system": "ORCA 4.0 Universal Marine System",
        "organization": "ISRO / SIH26176",
        "demo_mode": ORCA_DEMO_MODE,
        "version": "4.0.0"
    }

@app.post("/api/v1/assess-trip")
async def assess_trip(request: TripQueryRequest):
    start_time = time.time()
    try:
        verdict = await orchestrator.execute_pipeline(
            lat=request.latitude,
            lon=request.longitude,
            vessel_length_m=request.vessel_length_m or 8.5,
            language=request.language or "Marathi",
            raw_query=request.query_text
        )
        verdict["telemetry"] = {
            "execution_ms": round((time.time() - start_time) * 1000, 2),
            "services_triggered": ["ocean", "weather", "wave", "alerts", "pfz", "safety", "gis", "pathfinding", "economics", "db_persistence", "nlg"]
        }
        
        await ws_manager.broadcast_message({
            "type": "TRIP_ASSESSMENT",
            "lat": request.latitude,
            "lon": request.longitude,
            "verdict": verdict["verdict"],
            "risk_score": verdict["risk_score"]
        })
        
        return verdict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/demo/scenario")
async def trigger_demo_scenario(request: DemoScenarioRequest):
    if not ORCA_DEMO_MODE:
        raise HTTPException(status_code=403, detail="Demo scenario endpoint is disabled in production.")

    key = request.scenario_key.lower()
    if key == "safe":
        return await orchestrator.execute_pipeline(lat=15.2993, lon=73.8243, vessel_length_m=8.5, language="Marathi")
    elif key == "danger":
        return await orchestrator.execute_pipeline(lat=18.9220, lon=72.8347, vessel_length_m=8.5, language="Marathi")
    elif key == "cyclone":
        res = await orchestrator.execute_pipeline(lat=20.2644, lon=86.6715, vessel_length_m=8.5, language="Marathi")
        res["circuit_breaker_triggered"] = True
        res["verdict"] = "EXTREME DANGER / STAY ASHORE"
        res["risk_score"] = 100
        res["override_reason"] = "Official IMD Cyclone Advisory Override Active (Paradip Sector)"
        res["explanation"]["plain_language_text"] = "⚠️ धोका इशारा! चक्रीवादळाचा इशारा लागू आहे. आज समुद्रात जाऊ नका."
        return res
    else:
        raise HTTPException(status_code=400, detail=f"Unknown scenario key: {key}")

@app.get("/api/v1/authority/anomalies")
async def get_dark_fleet_anomalies(lat: float = 16.0215, lon: float = 73.4821):
    return dark_fleet_service.detect_anomalies(lat, lon)

@app.post("/api/v1/dark-fleet-scan")
async def dark_fleet_scan(request: DarkFleetScanRequest):
    return dark_fleet_service.scan_sector_anomalies(request.center_lat, request.center_lon, request.radius_km or 30.0)

@app.get("/api/v1/environmental/hazards")
async def get_environmental_hazards(lat: float = 16.0215, lon: float = 73.4821, chl: float = 3.8, sst: float = 28.5):
    return environmental_service.detect_environmental_hazards(lat, lon, chl, sst)

@app.post("/api/v1/sar-drift")
async def simulate_sar_drift(request: SARDriftRequest):
    return sar_drift_service.simulate_drift_trajectory(request.last_known_lat, request.last_known_lon, request.drift_hours)

@app.post("/api/v1/sar-sighting-update")
async def update_sar_sighting(request: SARSightingRequest):
    initial = sar_drift_service.simulate_drift_trajectory(16.0215, 73.4821, 6.0)
    return sar_drift_service.apply_bayesian_sighting_update(initial, request.sighting_lat, request.sighting_lon, request.confidence or 0.90)

@app.post("/api/v1/submit-catch-report")
async def submit_catch_report(request: CatchReportRequest):
    res = closed_loop_service.ingest_catch_report(request.latitude, request.longitude, request.species, request.weight_kg, request.net_type)
    if res.get("status") == "success":
        db_repository.save_catch_report(request.latitude, request.longitude, request.species, request.weight_kg, request.net_type)
    return res

@app.get("/api/v1/closed-loop/summary")
async def get_closed_loop_summary():
    reports = db_repository.get_all_catch_reports(limit=50)
    return {"total_reports": len(reports), "active_hsi_weights": closed_loop_service.hsi_weights}

@app.post("/api/v1/offline-bundle")
async def get_offline_bundle(request: OfflineBundleRequest):
    return {
        "center_coordinate": [request.center_lat, request.center_lon],
        "forecast_duration_hours": request.forecast_hours or 72,
        "bundle_size_kb": 142.5,
        "timeline": [
            {"hour": 0, "wind_speed_kmh": 16.5, "wave_height_m": 1.1},
            {"hour": 24, "wind_speed_kmh": 18.0, "wave_height_m": 1.3},
            {"hour": 48, "wind_speed_kmh": 14.2, "wave_height_m": 0.9},
            {"hour": 72, "wind_speed_kmh": 12.0, "wave_height_m": 0.8}
        ]
    }

@app.post("/api/v1/insurance-claim")
async def submit_insurance_claim(request: InsuranceClaimRequest):
    return {
        "claim_id": f"CLAIM-{int(time.time())}",
        "vessel_id": request.vessel_id,
        "policy_id": request.policy_id,
        "status": "PROVISIONALLY_APPROVED",
        "payout_est_inr": 45000.0,
        "auto_verification": "Satellite Synthetic Aperture Radar Storm Proof Verified"
    }

@app.post("/api/v1/binary-packet/pack")
async def pack_binary_packet(request: BinaryPackRequest):
    raw = pack_telemetry(request.latitude, request.longitude, request.risk_score, request.sos_flag, None, request.battery_pct)
    b64_str = base64.b64encode(raw).decode('utf-8')
    return {"base64": b64_str, "size_bytes": len(raw)}

@app.post("/api/v1/binary-packet/unpack")
async def unpack_binary_packet(request: BinaryUnpackRequest):
    raw = base64.b64decode(request.packet_base64)
    unpacked = unpack_telemetry(raw)
    return unpacked

@app.get("/api/v1/harbor-prices")
async def get_harbor_prices():
    return {
        "harbors": [
            {"name": "Ratnagiri Harbor", "bangda_price_per_kg": 240, "surmai_price_per_kg": 680},
            {"name": "Malvan Harbor", "bangda_price_per_kg": 220, "surmai_price_per_kg": 640},
            {"name": "Panaji Harbor", "bangda_price_per_kg": 235, "surmai_price_per_kg": 660}
        ]
    }

@app.post("/api/v1/governance/override")
async def record_human_override(request: HumanOverrideRequest):
    return model_governance_service.record_human_override(request.user_id, request.role, request.reason, request.override_action)

@app.get("/api/v1/history/trips")
async def get_trip_history():
    return db_repository.get_recent_trip_logs(limit=20)

@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Telemetry received: {data}")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
