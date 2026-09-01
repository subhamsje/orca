"""
ORCA 4.0 API Backend Entrypoint Server
FastAPI Async Server serving REST Endpoints & Health Status
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import time

from orchestrator import MultiAgentOrchestrator

app = FastAPI(
    title="ORCA 4.0 - ISRO Marine Intelligence API",
    description="Multi-Service Platform for Marine Ecosystems & Safety (SIH26176)",
    version="4.0.0"
)

# Enable CORS for Frontend PWA & localhost client
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
    query_text: Optional[str] = Field(None, example="उद्या सकाळी ६ वाजता मासेमारीसाठी जाणे सुरक्षित आहे का?")

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
    """
    Primary API Endpoint: Executes the sub-100ms multi-service pipeline
    """
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
            "services_triggered": ["ocean", "weather", "wave", "alerts", "pfz", "safety", "gis", "pathfinding", "nlg"]
        }
        return verdict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

---

Now let's create `backend/smoke_test.py` to run automated verification tests.

Let's write `backend/smoke_test.py`.
