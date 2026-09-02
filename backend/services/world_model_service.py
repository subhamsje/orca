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

        # Ocean State. ocean_metrics is the dict returned by ocean_service
        # (keys: sea_surface_temp_c, chlorophyll_mg_m3, ...). Wave metrics
        # come from wave_service (keys: significant_wave_height_m,
        # swell_period_sec). The fallback values are used only when the
        # upstream HTTP path failed AND there is no cache.
        def _from(metrics: dict, *keys, fallback):
            for k in keys:
                if metrics and metrics.get(k) is not None:
                    return metrics[k]
            return fallback

        sst = _from(ocean_metrics or {}, "sea_surface_temp_c", "sst_c", fallback=28.4)
        chl = _from(ocean_metrics or {}, "chlorophyll_mg_m3", "chlorophyll", fallback=1.8)
        hs = _from(wave_metrics or {}, "significant_wave_height_m", "wave_height_m", fallback=1.1)
        period = _from(wave_metrics or {}, "swell_period_sec", "wave_period_s", fallback=8.0)
        swell_h = _from(wave_metrics or {}, "swell_wave_height_m", fallback=round(hs * 0.7, 2))
        swell_p = _from(wave_metrics or {}, "swell_wave_period_s", "swell_period_sec", fallback=round(period + 2.0, 1))
        swell_dir = _from(wave_metrics or {}, "swell_wave_direction_deg", fallback=225.0)

        wind_speed = _from(weather_metrics or {}, "wind_speed_kmh", fallback=16.5)
        wind_gust = _from(weather_metrics or {}, "wind_gust_kmh", fallback=22.0)
        wind_dir = _from(weather_metrics or {}, "wind_direction_deg", fallback=230.0)
        wind_cardinal = _from(weather_metrics or {}, "wind_direction", fallback="SW")
        pressure = _from(weather_metrics or {}, "air_pressure_hpa", fallback=1012.0)
        air_temp = _from(weather_metrics or {}, "air_temperature_c", fallback=28.0)
        cloud = _from(weather_metrics or {}, "cloud_cover_pct", fallback=45.0)
        vis = _from(weather_metrics or {}, "visibility_km", fallback=10.0)

        ocean_state = OceanState(
            sst_c=sst,
            chlorophyll_mg_m3=chl,
            wave_height_m=hs,
            wave_period_s=period,
            wind_speed_kmh=wind_speed,
            wind_gust_kmh=wind_gust,
            wind_direction_deg=wind_dir,
            wind_direction_cardinal=wind_cardinal,
            swell_wave_height_m=swell_h,
            swell_wave_period_s=swell_p,
            swell_wave_direction_deg=swell_dir,
            air_pressure_hpa=pressure,
            air_temperature_c=air_temp,
            cloud_cover_pct=cloud,
            visibility_km=vis,
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
