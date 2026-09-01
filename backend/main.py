"""
ORCA 4.0 API Backend Entrypoint Server
FastAPI Async Server serving REST Endpoints, Economic ROI, SAR Drift & Catch Feedback
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import time

from orchestrator import MultiAgentOrchestrator
from services.economic_service import economic_service
from services.sar_drift_service import sar_drift_service
from services.closed_loop_service import closed_loop_service

app = FastAPI(
    title="ORCA 4.0 - ISRO Marine Intelligence API",
    description="Multi-Service Platform for Marine Ecosystems & Safety (SIH26176)",
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
    num_particles: Optional[int] = Field(1000, example=1000)

class CatchReportRequest(BaseModel):
    latitude: float = Field(..., example=16.0215)
    longitude: float = Field(..., example=73.4821)
    species: str = Field("Bangda", example="Bangda")
    weight_kg: float = Field(85.0, example=85.0)
    net_type: str = Field("Gillnet", example="Gillnet")

@app.get("/")
async def root():
    return {
        "status": "online",
        "system": "ORCA 4.0 Universal Marine System",
        "organization": "ISRO / SIH26176",
        "version": "4.0.0"
    }

@app.post("/api/v1/assess-trip")
async def assess_trip(request: TripQueryRequest):
    start_time = time.time()
    try:
        verdict = await orchestrator.execute_pipeline(
            lat=request.latitude,
            lon=request.longitude,
            vessel_length_m=request.vessel_length_m,
            language=request.language,
            raw_query=request.query_text
        )
        verdict["telemetry"] = {
            "execution_ms": round((time.time() - start_time) * 1000, 2),
            "services_triggered": ["ocean", "weather", "wave", "alerts", "pfz", "safety", "gis", "pathfinding", "economics", "nlg"]
        }
        return verdict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/sar-drift")
async def simulate_sar_drift(request: SARDriftRequest):
    """Executes 1,000-particle Monte Carlo Search & Rescue drift simulation."""
    try:
        drift_results = sar_drift_service.simulate_drift_trajectory(
            last_known_lat=request.last_known_lat,
            last_known_lon=request.last_known_lon,
            drift_hours=request.drift_hours,
            num_particles=request.num_particles or 1000
        )
        return drift_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/submit-catch-report")
async def submit_catch_report(request: CatchReportRequest):
    """Closed-loop learning ingestion endpoint."""
    try:
        res = closed_loop_service.ingest_catch_report(
            lat=request.latitude,
            lon=request.longitude,
            species=request.species,
            weight_kg=request.weight_kg,
            net_type=request.net_type
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

---

Now let's update `backend/smoke_test.py` to include tests for all 4 new power services.

Let's update `backend/smoke_test.py`.
