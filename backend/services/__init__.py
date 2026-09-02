"""
ORCA 4.0 Microservice & Specialist Agent Registry Package
"""

from services.ocean_service import ocean_service, OceanService
from services.weather_service import weather_service, WeatherService
from services.wave_service import wave_service, WaveService
from services.alerts_service import alerts_service, AlertsService
from services.pfz_service import pfz_service, PFZAgent, PFZAgent as PFZService
from services.safety_service import safety_service, SafetyAgent, SafetyAgent as SafetyService
from services.geofence_service import geofence_service, GeofenceService
from services.pathfinder_service import pathfinder_service, PathfinderService
from services.nlg_service import nlg_service, NLGService
from services.economic_service import economic_service, EconomicService
from services.sar_drift_service import sar_drift_service, SARAgent, SARAgent as SARDriftService
from services.closed_loop_service import closed_loop_service, ClosedLoopService
from services.dark_fleet_service import dark_fleet_service, DarkFleetAgent, DarkFleetAgent as DarkFleetService
from services.environmental_service import environmental_service, EnvironmentalService
from services.model_governance_service import model_governance_service, ModelGovernanceService
from services.osint_service import osint_service, OSINTAgent
from services.satellite_pass_service import satellite_pass_service, SatellitePassAgent
from services.event_bus import agent_event_bus, AgentEventBus, AgentMessage
from services.world_model_service import world_model_service, MaritimeWorldModelService
from services.optimization_engine_service import optimization_engine, MultiObjectiveOptimizationEngine
from services.incois_erddap_service import incois_erddap_service, IncoisErddapService
