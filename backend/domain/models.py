"""
ORCA 4.0 Domain Data Models
Pydantic V2 models for coordinates, vessel digital twins, oceanography, safety, pathfinding, and economics.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Tuple
from domain.enums import LanguageCode, SeaState, AlertLevel, PortDangerSignal, SpeciesType, NavigationHazardType

class GeoCoordinate(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    lon: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")

class VesselProfile(BaseModel):
    vessel_id: str = Field("IND-ARTISANAL-01", description="Unique registration identifier")
    vessel_name: str = Field("Matsya Jyoti", description="Vessel display name")
    vessel_type: str = Field("Motorized FRP / Dugout Canoe", description="Hull classification")
    length_m: float = Field(8.5, gt=2.0, le=50.0, description="Overall length in meters")
    beam_m: Optional[float] = Field(2.2, description="Maximum vessel width/beam in meters")
    draft_m: Optional[float] = Field(0.8, description="Submerged depth in meters")
    freeboard_m: Optional[float] = Field(0.7, description="Distance from waterline to upper deck in meters")
    engine_hp: Optional[float] = Field(9.9, description="Outboard / inboard motor horsepower")
    fuel_capacity_l: Optional[float] = Field(60.0, description="Usable fuel tank capacity in liters")
    fuel_burn_rate_l_hr: Optional[float] = Field(4.5, description="Average fuel consumption in L/hr at cruise")
    cruise_speed_knots: Optional[float] = Field(8.0, description="Standard cruising speed in knots")

class OceanMetrics(BaseModel):
    sea_surface_temp_c: float
    thermal_gradient_c_km: float
    chlorophyll_mg_m3: float
    salinity_psu: float = 35.2
    bathymetry_depth_m: float = 42.0
    ssha_meters: float = 0.04
    upwelling_active: bool = True
    solunar_moon_phase_pct: float = 78.0
    source_satellites: List[str] = ["INSAT-3DR Imager", "Oceansat-3 OCM-3", "AMSR2 Microwave"]
    data_freshness_mins: int = 25
    cloud_cover_pct: float = 12.0
    dineof_interpolated: bool = False

class WeatherMetrics(BaseModel):
    wind_speed_kmh: float
    wind_direction: str = "SW"
    wind_gust_kmh: float
    air_temp_c: float = 29.5
    barometric_pressure_hpa: float = 1008.2
    rain_prob_pct: int = 15
    visibility_km: float = 10.0
    squall_risk: bool = False
    source_model: str = "IMD-WRF / GFS High-Resolution"
    data_freshness_mins: int = 15

class WaveMetrics(BaseModel):
    significant_wave_height_m: float
    swell_period_sec: float
    swell_direction: str = "SSW"
    wave_steepness: float = 0.035
    sea_state: SeaState = SeaState.SLIGHT
    source_model: str = "INCOIS WAVEWATCH III / OSF National Buoy Network"
    data_freshness_mins: int = 30

class DisasterAlert(BaseModel):
    has_active_cyclone_alert: bool = False
    cyclone_intensity: Optional[str] = None
    has_squall_warning: bool = False
    has_high_wave_alert: bool = False
    has_tsunami_alert: bool = False
    port_danger_signal: Optional[int] = None
    alert_bulletin_id: Optional[str] = None
    issuing_agency: str = "IMD Cyclone Warning Division & INCOIS"
    bulletin_timestamp: str = "2026-09-01T18:00:00Z"

class PFZGround(BaseModel):
    rank: int
    name: string_name: str = Field(alias="name")
    distance_km: float
    bearing_deg: float
    hsi: int
    likely_species: List[str]
    target_depth_m: Optional[float] = 35.0
    coordinates: List[float]

class SafetyEvaluation(BaseModel):
    risk_score: int = Field(..., ge=0, le=100)
    verdict_label: str
    override_active: bool
    override_reason: Optional[str] = None
    max_safe_wave_m: float
    current_wave_m: float
    safety_ratio: float
    audit_trail: Dict[str, Any]

class WaypointDetour(BaseModel):
    path_type: str
    total_distance_km: float
    estimated_travel_mins: int
    waypoints: List[List[float]]
    avoided_hazards: List[str]
    fuel_consumption_est_liters: float

class HarborComparison(BaseModel):
    harbor_name: str
    latitude: float
    longitude: float
    gross_revenue_inr: float
    total_fuel_cost_inr: float
    net_profit_inr: float
    unit_price_per_kg: float
    extra_distance_km: float
    recommended: bool = False

class EconomicOptimization(BaseModel):
    best_docking_harbor: str
    max_expected_profit_inr: float
    estimated_catch_kg: float
    target_species: str
    fuel_cost_total_inr: float
    harbor_comparisons: List[HarborComparison]

class ProvenanceSummary(BaseModel):
    satellites: List[str]
    ocean_models: List[str]
    data_freshness: str
    confidence_score: float
    audit_hash: str

class ExplanationPayload(BaseModel):
    plain_language_text: str
    wave_description: str
    provenance_summary: ProvenanceSummary

class SARSearchEllipse(BaseModel):
    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float
    major_axis_km: float
    minor_axis_km: float
    orientation_deg: float

class SARSimulationResult(BaseModel):
    last_known_coordinate: List[float]
    drift_duration_hours: float
    simulated_particles: int
    drift_centroid: List[float]
    hourly_drift_path: List[List[float]]
    search_bounding_box: Dict[str, float]
    search_ellipse: SARSearchEllipse
    prioritized_search_radius_km: float
    search_pattern_waypoints: List[List[float]]
    search_pattern_type: str
    sar_helipad_dispatch_recommendation: str
