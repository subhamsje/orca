"""
ORCA 4.0 Vessel Digital Twin.

A proper, validated vessel profile. Provides:

  - Length, beam, draft, freeboard, displacement
  - Engine power, max/cruising speed (knots)
  - Metacentric height (GM) — entered if known, otherwise estimated
  - Maximum operating wave height (manufacturer limit)
  - Maximum operating wind speed
  - Capsize threshold H_crit = 0.6 * L * sin(theta_wave) per ORCA.md §1.5
  - Validation: physical impossibilities (negative length, beam longer
    than length, etc.) raise an explicit error.

The risk engine and the safety circuit breaker both consume the same
VesselProfile. A change in the profile produces a different risk score
for the same ocean state — that is the design.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional


@dataclass
class VesselProfile:
    vessel_id: str
    vessel_name: str
    length_m: float
    beam_m: float
    draft_m: float
    freeboard_m: float
    displacement_kg: float
    engine_power_kw: float
    max_speed_kn: float
    cruising_speed_kn: float
    heading_deg: float = 0.0
    loading_condition: str = "LADEN"  # LIGHT | BALLAST | LADEN
    crew_count: int = 4
    fuel_load_pct: float = 100.0
    gear_load_kg: float = 0.0
    gm_m: Optional[float] = None
    max_operating_wave_height_m: Optional[float] = None
    max_operating_wind_kmh: Optional[float] = None
    vessel_type: str = "FISHING_CRAFT"

    def __post_init__(self) -> None:
        errors = self._validate()
        if errors:
            raise ValueError("Vessel profile invalid: " + "; ".join(errors))

    # --- Validation --------------------------------------------------------

    def _validate(self) -> List[str]:
        errs: List[str] = []
        if self.length_m <= 0:
            errs.append("length_m must be > 0")
        if self.beam_m <= 0:
            errs.append("beam_m must be > 0")
        if self.draft_m <= 0:
            errs.append("draft_m must be > 0")
        if self.beam_m > self.length_m * 0.9:
            errs.append("beam_m is implausibly close to length_m")
        if self.draft_m > self.length_m * 0.4:
            errs.append("draft_m is implausibly large vs length_m")
        if self.freeboard_m < 0:
            errs.append("freeboard_m cannot be negative")
        if self.freeboard_m > self.length_m * 0.5:
            errs.append("freeboard_m is implausibly large")
        if self.displacement_kg <= 0:
            errs.append("displacement_kg must be > 0")
        if self.engine_power_kw <= 0:
            errs.append("engine_power_kw must be > 0")
        if self.max_speed_kn <= 0 or self.max_speed_kn > 60:
            errs.append("max_speed_kn must be in (0, 60] for a fishing craft")
        if self.cruising_speed_kn <= 0 or self.cruising_speed_kn > self.max_speed_kn:
            errs.append("cruising_speed_kn must be in (0, max_speed_kn]")
        if self.heading_deg < 0 or self.heading_deg >= 360:
            errs.append("heading_deg must be in [0, 360)")
        if self.loading_condition not in ("LIGHT", "BALLAST", "LADEN"):
            errs.append("loading_condition must be LIGHT|BALLAST|LADEN")
        if self.crew_count < 0:
            errs.append("crew_count must be >= 0")
        if self.fuel_load_pct < 0 or self.fuel_load_pct > 100:
            errs.append("fuel_load_pct must be in [0, 100]")
        if self.gear_load_kg < 0:
            errs.append("gear_load_kg must be >= 0")
        if self.gm_m is not None and self.gm_m <= 0:
            errs.append("gm_m must be > 0")
        if self.max_operating_wave_height_m is not None and self.max_operating_wave_height_m <= 0:
            errs.append("max_operating_wave_height_m must be > 0")
        if self.max_operating_wind_kmh is not None and self.max_operating_wind_kmh <= 0:
            errs.append("max_operating_wind_kmh must be > 0")
        return errs

    # --- Derived safety thresholds ----------------------------------------

    @property
    def max_safe_wave_height_m(self) -> float:
        """
        Capsize threshold per ORCA.md §1.5.

        H_crit = 0.6 * L * sin(theta_wave)

        For coastal fishing craft the dominant sea state is typically
        theta_wave ~ 10 deg (long-period swells), giving sin(10°) ≈ 0.174.
        The full safety margin reduces this to 0.6 * L * 0.174.
        The capsize model also includes freeboard correction: deeper
        loaded vessels (LADEN) have a 15% lower safe height; LIGHT
        vessels have 10% higher safe height.
        """
        theta_rad = math.radians(10.0)
        base = 0.6 * self.length_m * math.sin(theta_rad)
        if self.loading_condition == "LADEN":
            return base * 0.85
        if self.loading_condition == "LIGHT":
            return base * 1.10
        return base

    @property
    def estimated_gm_m(self) -> float:
        """If the operator did not supply GM, estimate from length/beam
        using the FAO small-craft rule of thumb: GM ≈ 0.05 * B."""
        return self.gm_m if self.gm_m is not None else 0.05 * self.beam_m

    @property
    def max_manufacturer_wave_m(self) -> float:
        return self.max_operating_wave_height_m or self.max_safe_wave_height_m

    @property
    def max_manufacturer_wind_kmh(self) -> float:
        return self.max_operating_wind_kmh or 60.0  # default: 60 km/h

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["max_safe_wave_height_m"] = self.max_safe_wave_height_m
        d["estimated_gm_m"] = self.estimated_gm_m
        d["max_manufacturer_wave_m"] = self.max_manufacturer_wave_m
        d["max_manufacturer_wind_kmh"] = self.max_manufacturer_wind_kmh
        return d


def default_craft_profile(
    vessel_id: str = "IND-MH-04-892",
    vessel_name: str = "Malvan Craft-01",
    length_m: float = 8.5,
    heading_deg: float = 0.0,
) -> VesselProfile:
    """A reasonable default for a small Indian fishing craft.
    Real operators should override via the vessel config endpoint."""
    beam = round(0.26 * length_m, 2)
    draft = round(0.09 * length_m, 2)
    freeboard = round(0.18 * length_m, 2)
    # Empirical displacement for open-motorised crafts (tonnes -> kg).
    displacement = round(0.18 * (length_m ** 2.2) * 1000.0, 0)
    engine_kw = round(0.18 * length_m + 6.0, 1)
    max_speed = round(1.7 * math.sqrt(engine_kw) + 2.0, 1)
    cruise = round(max_speed * 0.55, 1)
    return VesselProfile(
        vessel_id=vessel_id,
        vessel_name=vessel_name,
        length_m=length_m,
        beam_m=beam,
        draft_m=draft,
        freeboard_m=freeboard,
        displacement_kg=displacement,
        engine_power_kw=engine_kw,
        max_speed_kn=max_speed,
        cruising_speed_kn=cruise,
        heading_deg=heading_deg,
        loading_condition="LADEN",
        crew_count=4,
        fuel_load_pct=80.0,
        gear_load_kg=50.0,
        vessel_type="FISHING_CRAFT",
    )
