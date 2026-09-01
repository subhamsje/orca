"""
ORCA 4.0 Microservices Package
"""

from services.ocean_service import ocean_service, OceanService
from services.weather_service import weather_service, WeatherService
from services.wave_service import wave_service, WaveService
from services.alerts_service import alerts_service, AlertsService
from services.pfz_service import pfz_service, PFZService
from services.safety_service import safety_service, SafetyService
from services.geofence_service import geofence_service, GeofenceService
from services.pathfinder_service import pathfinder_service, PathfinderService
from services.economic_service import economic_service, EconomicService
from services.sar_drift_service import sar_drift_service, SARDriftService
from services.closed_loop_service import closed_loop_service, ClosedLoopService
from services.nlg_service import nlg_service, NLGService
from services.offline_sync_service import offline_sync_service, OfflineSyncService
from services.insurance_service import insurance_service, ParametricInsuranceService
from services.dark_fleet_service import dark_fleet_service, DarkFleetService

__all__ = [
    "ocean_service",
    "OceanService",
    "weather_service",
    "WeatherService",
    "wave_service",
    "WaveService",
    "alerts_service",
    "AlertsService",
    "pfz_service",
    "PFZService",
    "safety_service",
    "SafetyService",
    "geofence_service",
    "GeofenceService",
    "pathfinder_service",
    "PathfinderService",
    "economic_service",
    "EconomicService",
    "sar_drift_service",
    "SARDriftService",
    "closed_loop_service",
    "ClosedLoopService",
    "nlg_service",
    "NLGService",
    "offline_sync_service",
    "OfflineSyncService",
    "insurance_service",
    "ParametricInsuranceService",
    "dark_fleet_service",
    "DarkFleetService"
]
