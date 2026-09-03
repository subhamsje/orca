"""
ORCA 4.0 Core Domain Schemas & Data Contracts
Establishes strongly typed Pydantic models for Provenance Metadata, Vessel Digital Twin,
Ocean State, Risk State, Structured Decisions, and Spatial Features.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import time

class ProvenanceMetadata(BaseModel):
    model_config = {"protected_namespaces": ()}
    id: str = Field(..., example="PROV-994821")
    timestamp: float = Field(default_factory=time.time)
    source: str = Field(..., example="INSAT-3DR / Open-Meteo / WaveWatch III")
    generated_at: str = Field(default_factory=lambda: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))
    valid_until: str = Field(default_factory=lambda: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() + 21600)))
    data_freshness: str = Field("LIVE", example="LIVE")
    model_version: str = Field("ORCA-v4.0.0-PhysicsKernel", example="ORCA-v4.0.0-PhysicsKernel")
    confidence: float = Field(0.95, ge=0.0, le=1.0)
    uncertainty: float = Field(0.05, ge=0.0, le=1.0)
    spatial_reference: str = Field("EPSG:4326 (WGS84) / Uber H3 Res 7", example="EPSG:4326")
    status: str = Field("VALID", example="VALID")
    is_simulated: bool = Field(False)

class VesselDigitalTwinState(BaseModel):
    model_config = {"protected_namespaces": ()}
    vessel_id: str = Field("IND-MH-04-892")
    vessel_name: str = Field("Malvan Craft-01")
    vessel_type: str = Field("FISHING_CRAFT")
    length_m: float = Field(8.5)
    beam_m: float = Field(2.2)
    draft_m: float = Field(0.8)
    engine_hp: float = Field(9.9)
    fuel_capacity_l: float = Field(60.0)
    fuel_current_l: float = Field(45.0)
    max_wave_height_m: float = Field(1.5)
    seaworthiness_score: float = Field(88.0)

class OceanState(BaseModel):
    # All values are Optional[float] — None means "DATA UNAVAILABLE".
    # No hardcoded fallbacks. The world model emits None for any parameter
    # whose CanonicalRecord is missing or UNAVAILABLE.
    sst_c: Optional[float] = Field(None)
    chlorophyll_mg_m3: Optional[float] = Field(None)
    current_speed_ms: Optional[float] = Field(None)
    current_dir_deg: Optional[float] = Field(None)
    wave_height_m: Optional[float] = Field(None)
    wave_period_s: Optional[float] = Field(None)
    salinity_psu: Optional[float] = Field(None)
    wind_speed_kmh: Optional[float] = Field(None)
    wind_gust_kmh: Optional[float] = Field(None)
    wind_direction_deg: Optional[float] = Field(None)
    wind_direction_cardinal: Optional[str] = Field(None)
    swell_wave_height_m: Optional[float] = Field(None)
    swell_wave_period_s: Optional[float] = Field(None)
    swell_wave_direction_deg: Optional[float] = Field(None)
    air_pressure_hpa: Optional[float] = Field(None)
    air_temperature_c: Optional[float] = Field(None)
    cloud_cover_pct: Optional[float] = Field(None)
    visibility_km: Optional[float] = Field(None)

class RiskState(BaseModel):
    weather_risk_score: float = Field(25.0)
    wave_steepness_ratio: float = Field(0.1375)
    capsizing_risk: bool = Field(False)
    collision_cpa_nm: float = Field(4.2)
    grounding_depth_m: float = Field(18.5)
    dist_to_imbl_km: float = Field(24.5)
    dist_to_naval_zone_km: float = Field(14.2)

class StructuredDecisionResult(BaseModel):
    verdict: str = Field("SAFE", example="SAFE") # SAFE | CONDITIONAL | HIGH_RISK | DO_NOT_DEPART | RETURN_TO_PORT | EMERGENCY
    risk_score: int = Field(25, ge=0, le=100)
    circuit_breaker_active: bool = Field(False)
    constraints_triggered: List[str] = Field(default_factory=list)
    validity_window_hours: int = Field(6)
    recommended_action: str = Field("Proceed with caution along A* weather pathfinder route.")
    provenance: ProvenanceMetadata
