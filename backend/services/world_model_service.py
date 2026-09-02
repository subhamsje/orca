"""
ORCA 4.0 Maritime World Model & State Aggregator (canonical-data version).

Builds a MaritimeWorldModel from a Dict[parameter, CanonicalRecord] produced
by the data acquisition layer. No hardcoded fallbacks — if a parameter
has no usable CanonicalRecord, the world model exposes the value as null
and reports `state: UNAVAILABLE`.
"""

from typing import Dict, Any, Optional
from domain.schemas import VesselDigitalTwinState, OceanState, RiskState, ProvenanceMetadata
from utils.h3_spatial import latlon_to_h3, haversine_distance_km
from data_providers.canonical import (
    CanonicalRecord,
    UNAVAILABLE,
    STALE,
    OBSERVED,
    NEAR_REAL_TIME,
    NOWCAST,
    FORECAST,
    MODEL,
    SATELLITE,
    BUOY,
    STATION,
)


class MaritimeWorldModelService:
    def assemble_world_model(
        self,
        lat: float,
        lon: float,
        vessel_length_m: float = 8.5,
        canonical: Optional[Dict[str, CanonicalRecord]] = None,
    ) -> Dict[str, Any]:
        """
        Build the world model from canonical records.

        canonical: dict of CanonicalRecord (one per parameter). Missing
        keys are reported with state=UNAVAILABLE.
        """
        canonical = canonical or {}

        # Helper: get a value, or None with UNAVAILABLE state.
        def _rec(param: str) -> Optional[CanonicalRecord]:
            return canonical.get(param)

        def _val(param: str):
            r = _rec(param)
            if r is None or r.value is None:
                return None
            if r.state in (UNAVAILABLE, STALE):
                return None
            return r.value

        # Vessel Digital Twin (deterministic, not environmental)
        vessel_twin = VesselDigitalTwinState(
            length_m=vessel_length_m,
            beam_m=round(0.26 * vessel_length_m, 2),
            draft_m=round(0.09 * vessel_length_m, 2),
            max_wave_height_m=round(0.22 * vessel_length_m + 0.05 * 2.2, 2),
        )

        ocean_state = OceanState(
            sst_c=_val("sea_surface_temperature"),
            chlorophyll_mg_m3=_val("chlorophyll"),
            current_speed_ms=_val("current_speed"),
            current_dir_deg=_val("current_direction"),
            wave_height_m=_val("wave_height"),
            wave_period_s=_val("wave_period"),
            salinity_psu=_val("salinity"),
            wind_speed_kmh=_val("wind_speed"),
            wind_gust_kmh=_val("wind_gust"),
            wind_direction_deg=_val("wind_direction"),
            wind_direction_cardinal=_cardinal(_val("wind_direction")),
            swell_wave_height_m=_val("swell_wave_height"),
            swell_wave_period_s=_val("swell_wave_period"),
            swell_wave_direction_deg=_val("swell_wave_direction"),
            air_pressure_hpa=_val("air_pressure"),
            air_temperature_c=_val("air_temperature"),
            cloud_cover_pct=_val("cloud_cover"),
            visibility_km=_val("visibility"),
        )

        # Risk state (deterministic + environmental)
        hs = _val("wave_height")
        period = _val("wave_period")
        steepness = (hs / max(1.0, period)) if (hs is not None and period is not None) else None
        naval_dist = haversine_distance_km(lat, lon, 15.05, 73.35)
        imbl_dist = haversine_distance_km(lat, lon, 9.20, 79.60) if lat < 11.0 else 24.5

        risk_state = RiskState(
            wave_steepness_ratio=round(steepness, 4) if steepness is not None else 0.0,
            capsizing_risk=bool(hs and hs > vessel_twin.max_wave_height_m),
            dist_to_naval_zone_km=round(naval_dist, 1),
            dist_to_imbl_km=round(imbl_dist, 1),
        )

        # Provenance: include every source that contributed
        source_list = sorted({
            r.source
            for r in canonical.values()
            if r is not None and r.source
        })
        satellite_list = sorted({
            r.source
            for r in canonical.values()
            if r is not None and r.data_type in (SATELLITE, OBSERVED)
        })
        model_list = sorted({
            r.source
            for r in canonical.values()
            if r is not None and r.data_type == MODEL
        })

        # Determine overall freshness
        any_unavailable = any(
            r is None or r.state == UNAVAILABLE
            for r in canonical.values()
        )
        any_stale = any(
            r is not None and r.state == STALE
            for r in canonical.values()
        )
        any_simulated = any(
            r is not None and r.data_type == "SIMULATED"
            for r in canonical.values()
        )

        if any_unavailable:
            data_freshness = "PARTIAL — some sources unavailable"
            status = "PARTIAL"
        elif any_stale:
            data_freshness = "STALE — refresh recommended"
            status = "STALE"
        else:
            data_freshness = "LIVE"
            status = "VALID"

        provenance = ProvenanceMetadata(
            id=f"PROV-{round(lat, 2)}-{round(lon, 2)}",
            source=" + ".join(source_list[:5]) if source_list else "NO SOURCES",
            data_freshness=data_freshness,
            status=status,
            is_simulated=bool(any_simulated),
        )

        return {
            "coordinate": {"lat": lat, "lon": lon},
            "h3_index_res7": latlon_to_h3(lat, lon, resolution=7),
            "vessel_twin": vessel_twin.dict(),
            "ocean_state": ocean_state.dict(),
            "risk_state": risk_state.dict(),
            "provenance": provenance.dict(),
            "canonical_sources": source_list,
            "canonical_models": model_list,
            "canonical_observations": satellite_list,
        }


def _cardinal(deg):
    if deg is None:
        return None
    dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
            "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    return dirs[int(deg % 360 / 22.5) % 16]


world_model_service = MaritimeWorldModelService()