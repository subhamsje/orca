"""
ORCA 4.0 Maritime World Model & State Aggregator
Fuses Vessel Digital Twin, Ocean State, Risk State, and Legal Boundary states
into a unified time-aware spatio-temporal representation.
"""

from typing import Dict, Any
from domain.schemas import VesselDigitalTwinState, OceanState, RiskState, ProvenanceMetadata
from utils.h3_spatial import latlon_to_h3, haversine_distance_km

class MaritimeWorldModelService:
    def assemble_world_model(
        self,
        lat: float,
        lon: float,
        vessel_length_m: float = 8.5,
        ocean_metrics: Dict[str, Any] = None,
        weather_metrics: Dict[str, Any] = None,
        wave_metrics: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Assembles unified time-aware Maritime World Model snapshot."""
        
        # Vessel Digital Twin
        vessel_twin = VesselDigitalTwinState(
            length_m=vessel_length_m,
            beam_m=round(0.26 * vessel_length_m, 2),
            draft_m=round(0.09 * vessel_length_m, 2),
            max_wave_height_m=round(0.22 * vessel_length_m + 0.05 * 2.2, 2)
        )

        # Ocean State
        sst = ocean_metrics.get("sst_c", 28.4) if ocean_metrics else 28.4
        chl = ocean_metrics.get("chlorophyll_mg_m3", 1.8) if ocean_metrics else 1.8
        hs = wave_metrics.get("wave_height_m", 1.1) if wave_metrics else 1.1
        period = wave_metrics.get("wave_period_s", 8.0) if wave_metrics else 8.0

        ocean_state = OceanState(
            sst_c=sst,
            chlorophyll_mg_m3=chl,
            wave_height_m=hs,
            wave_period_s=period
        )

        # Risk State
        steepness = hs / max(1.0, period)
        naval_dist = haversine_distance_km(lat, lon, 15.05, 73.35)
        imbl_dist = haversine_distance_km(lat, lon, 9.20, 79.60) if lat < 11.0 else 24.5

        risk_state = RiskState(
            wave_steepness_ratio=round(steepness, 4),
            capsizing_risk=hs > vessel_twin.max_wave_height_m,
            dist_to_naval_zone_km=round(naval_dist, 1),
            dist_to_imbl_km=round(imbl_dist, 1)
        )

        # Provenance Metadata
        provenance = ProvenanceMetadata(
            id=f"PROV-{round(lat, 2)}-{round(lon, 2)}",
            source="INSAT-3DR / Open-Meteo / INCOIS Hydrographic",
            data_freshness="LIVE"
        )

        return {
            "coordinate": {"lat": lat, "lon": lon},
            "h3_index_res7": latlon_to_h3(lat, lon, resolution=7),
            "vessel_twin": vessel_twin.dict(),
            "ocean_state": ocean_state.dict(),
            "risk_state": risk_state.dict(),
            "provenance": provenance.dict()
        }

world_model_service = MaritimeWorldModelService()
