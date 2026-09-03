"""
ORCA 4.0 Risk Engine — automated test suite.

The tests are deterministic (no I/O). Every scenario constructs a fake
EnvironmentalState by hand so the test is reproducible offline. The
tests are designed to be the evidence behind every "production-grade"
claim in the user-facing UI.

Run: cd backend && pytest tests/test_risk_engine.py -v
"""

from __future__ import annotations

import math
import os
import sys
import time
import unittest

# Make the backend importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), os.pardir))

from risk_engine import (  # noqa: E402
    EnvironmentalState,
    EnvVar,
    VesselProfile,
    build_environmental_state,
    compute_risk,
    compute_route_risk,
    default_craft_profile,
    CURRENT,
    STALE,
    UNAVAILABLE,
    WEIGHTS,
)
from data_providers.canonical import CanonicalRecord, NEAR_REAL_TIME  # noqa: E402


# ---- Helpers ---------------------------------------------------------------- #


def _mk_var(parameter: str, value, unit: str = "m", freshness: str = CURRENT) -> EnvVar:
    now = time.time()
    return EnvVar(
        parameter=parameter,
        value=value,
        unit=unit,
        freshness=freshness,
        data_type="OBSERVATION" if freshness == CURRENT else "MODEL",
        state=NEAR_REAL_TIME,
        source="test",
        source_id="test:fixture",
        dataset="test",
        observed_at=now,
        valid_from=now,
        valid_until=now,
        retrieved_at=now,
        spatial_resolution="point",
        temporal_resolution="instant",
        distance_km=0.0,
        quality="GOOD",
        confidence=0.95,
    )


def _state(**values) -> EnvironmentalState:
    """Build an EnvironmentalState from keyword args of (parameter, value)."""
    now = time.time()
    vars_out = {
        k: (
            _mk_var(k, v)
            if not isinstance(v, EnvVar)
            else v
        )
        for k, v in values.items()
    }
    return EnvironmentalState(
        coordinate={"lat": 0.0, "lon": 0.0},
        timestamp_utc=now,
        requested_at=now,
        variables=vars_out,
    )


# ---- 1. Reproducibility ------------------------------------------------------ #


class TestReproducibility(unittest.TestCase):
    def test_same_inputs_same_score(self):
        vessel = default_craft_profile(length_m=8.5, heading_deg=270)
        s1 = _state(
            wave_height=1.0, wave_period=8.0, wave_direction=240,
            wind_speed=15.0, wind_gust=20.0, air_pressure=1012.0,
            visibility=10.0, current_speed=0.3, precipitation=0.0,
        )
        s2 = _state(
            wave_height=1.0, wave_period=8.0, wave_direction=240,
            wind_speed=15.0, wind_gust=20.0, air_pressure=1012.0,
            visibility=10.0, current_speed=0.3, precipitation=0.0,
        )
        r1 = compute_risk(s1, vessel)
        r2 = compute_risk(s2, vessel)
        self.assertEqual(r1.risk_score, r2.risk_score)
        self.assertEqual(r1.risk_label, r2.risk_label)


# ---- 2. Monotonicity ---------------------------------------------------------- #


class TestMonotonicity(unittest.TestCase):
    def test_higher_wave_higher_risk(self):
        v = default_craft_profile(length_m=8.5, heading_deg=270)
        scores = []
        for hs in (0.3, 0.6, 1.0, 1.5, 2.0, 2.5, 3.5):
            state = _state(
                wave_height=hs, wave_period=8.0, wave_direction=240,
                wind_speed=15.0, wind_gust=20.0, air_pressure=1012.0,
                visibility=10.0, current_speed=0.3,
            )
            scores.append(compute_risk(state, v).risk_score)
        for a, b in zip(scores, scores[1:]):
            self.assertGreaterEqual(
                b, a, f"risk decreased when wave height increased: {scores}"
            )

    def test_higher_wind_higher_risk(self):
        v = default_craft_profile(length_m=8.5)
        scores = []
        for w in (5, 15, 30, 50, 70, 90):
            state = _state(
                wave_height=0.5, wave_period=8.0, wind_speed=w,
                wind_gust=w * 1.3, air_pressure=1012.0, visibility=10.0,
            )
            scores.append(compute_risk(state, v).risk_score)
        for a, b in zip(scores, scores[1:]):
            self.assertGreaterEqual(b, a, f"wind non-monotonic: {scores}")

    def test_higher_gust_higher_risk(self):
        v = default_craft_profile(length_m=8.5)
        prev = -1
        for g in (0, 20, 40, 60, 80):
            state = _state(
                wave_height=0.5, wave_period=8.0, wind_speed=20.0,
                wind_gust=g, air_pressure=1012.0, visibility=10.0,
            )
            r = compute_risk(state, v).risk_score
            self.assertGreaterEqual(r, prev)
            prev = r

    def test_higher_current_higher_risk(self):
        v = default_craft_profile(length_m=8.5)
        prev = -1
        for c in (0.1, 0.3, 0.6, 1.0, 1.5, 2.0):
            state = _state(
                wave_height=0.5, wave_period=8.0, current_speed=c,
                wind_speed=10.0, wind_gust=15.0, air_pressure=1012.0, visibility=10.0,
            )
            r = compute_risk(state, v).risk_score
            self.assertGreaterEqual(r, prev)
            prev = r

    def test_lower_visibility_higher_risk(self):
        v = default_craft_profile(length_m=8.5)
        prev = -1
        for vis in (50, 10, 5, 2, 1, 0.5):
            state = _state(
                wave_height=0.5, wave_period=8.0, visibility=vis,
                wind_speed=10.0, wind_gust=15.0, air_pressure=1012.0,
            )
            r = compute_risk(state, v).risk_score
            self.assertGreaterEqual(r, prev)
            prev = r


# ---- 3. Vessel-specific risk ------------------------------------------------- #


class TestVesselSpecific(unittest.TestCase):
    def test_larger_vessel_lower_wave_risk(self):
        """Same 0.5m wave is more dangerous to a 6m canoe than a 25m
        trawler. We pick a wave that is BELOW the trawler's H_crit but
        ABOVE the canoe's H_crit so the relative hazard differs."""
        # H_crit(6m) ≈ 0.5 * sin(10) * 0.6 = 0.522; H_crit(25m) ≈ 2.18
        # We use 0.4m which is 76% of the canoe H_crit but only 18% of
        # the trawler's.
        state = _state(
            wave_height=0.4, wave_period=8.0, wind_speed=10.0,
            wind_gust=15.0, air_pressure=1012.0, visibility=10.0,
        )
        small = default_craft_profile(length_m=6.0)
        large = default_craft_profile(length_m=25.0)
        r_small = compute_risk(state, small)
        r_large = compute_risk(state, large)
        self.assertGreater(r_small.raw_score_before_cb, r_large.raw_score_before_cb)

    def test_wave_above_hcrit_triggers_breaker(self):
        vessel = default_craft_profile(length_m=6.0)
        # h_crit for 6m craft ≈ 0.5m
        state = _state(
            wave_height=2.0, wave_period=8.0, wind_speed=10.0,
            wind_gust=15.0, air_pressure=1012.0, visibility=10.0,
        )
        r = compute_risk(state, vessel)
        self.assertTrue(r.circuit_breaker.triggered)
        self.assertIn("WAV", str([h.rule_id for h in r.circuit_breaker.hits]))


# ---- 4. Circuit breaker rules ----------------------------------------------- #


class TestCircuitBreaker(unittest.TestCase):
    def test_cyclone_alert_forces_extreme_danger(self):
        v = default_craft_profile(length_m=8.5)
        s = _state(wave_height=0.3, wind_speed=5.0, wind_gust=10.0)
        r = compute_risk(
            s, v,
            alerts={"has_active_cyclone_alert": True, "cyclone_name": "TEST-CYC"},
        )
        self.assertEqual(r.risk_label, "EXTREME_DANGER_CYCLONE")
        self.assertEqual(r.risk_score, 100)

    def test_naval_zone_violation_forces_extreme(self):
        v = default_craft_profile(length_m=8.5)
        s = _state(wave_height=0.3, wind_speed=5.0, wind_gust=10.0)
        r = compute_risk(s, v, geofence={"inside_naval_zone_violation": True})
        self.assertEqual(r.risk_label, "EXTREME_DANGER")

    def test_imbl_buffer_forces_high_risk(self):
        v = default_craft_profile(length_m=8.5)
        # Use a very small gust so the gust rule doesn't fire first
        s = _state(wave_height=0.3, wind_speed=5.0, wind_gust=8.0)
        r = compute_risk(s, v, geofence={"inside_imbl_buffer_warning": True})
        self.assertEqual(r.risk_label, "HIGH_RISK_IMBL")

    def test_wind_gust_exceeds_manufacturer_max(self):
        # Regression: ensure the wind-gust rule fires when the
        # gust (in m/s) exceeds the vessel's manufacturer max (in km/h).
        # 25 m/s = 90 km/h, manufacturer default = 60 km/h.
        v = default_craft_profile(length_m=8.5)
        s = _state(
            wave_height=0.3, wind_speed=10.0, wind_gust=25.0, air_pressure=1012.0
        )
        r = compute_risk(s, v)
        self.assertTrue(r.circuit_breaker.triggered)
        rule_ids = [h.rule_id for h in r.circuit_breaker.hits]
        self.assertIn("CB-WND-001", rule_ids)

    def test_insufficient_data_quality_suppresses_verdict(self):
        v = default_craft_profile(length_m=8.5)
        # Build a state with no data
        s = EnvironmentalState(
            coordinate={"lat": 0, "lon": 0},
            timestamp_utc=time.time(),
            requested_at=time.time(),
            variables={},
        )
        r = compute_risk(s, v)
        self.assertTrue(r.circuit_breaker.data_quality_insufficient)
        self.assertEqual(r.risk_label, "INSUFFICIENT_CURRENT_DATA")


# ---- 5. Components reconcile to total ---------------------------------------- #


class TestReconciliation(unittest.TestCase):
    def test_components_sum_to_100pts(self):
        v = default_craft_profile(length_m=8.5)
        s = _state(
            wave_height=1.2, wave_period=8.0, wave_direction=240,
            wind_speed=25.0, wind_gust=45.0, air_pressure=1005.0,
            visibility=8.0, current_speed=0.4, precipitation=0.5,
        )
        r = compute_risk(s, v)
        # Sum of weighted contributions (out of 1.0) times 100 = raw score
        raw_sum = sum(c.weighted_contribution for c in r.components)
        raw_score = round(raw_sum * 100.0)
        # The final score is the raw score (possibly overridden by CB).
        # We assert reconciliation: contributions explain the raw
        # number; the override is the gap.
        self.assertGreaterEqual(r.risk_score, raw_score - 2)  # small float tolerance
        # Each component has a finite score in [0, 1]
        for c in r.components:
            self.assertGreaterEqual(c.score, 0.0)
            self.assertLessEqual(c.score, 1.0)


# ---- 6. Freshness ------------------------------------------------------------ #


class TestFreshness(unittest.TestCase):
    def test_unavailable_labelled_not_data(self):
        v = default_craft_profile(length_m=8.5)
        # No wave_height at all
        s = _state(wind_speed=10.0, wind_gust=15.0, air_pressure=1012.0, visibility=10.0)
        r = compute_risk(s, v)
        # No fabricated data — the wave component must be None
        wave_comp = next(c for c in r.components if c.name == "wave_height")
        self.assertIsNone(wave_comp.details.get("value"))

    def test_stale_data_marked(self):
        # Build a CanonicalRecord with a very old observation time
        old_time = time.time() - 30 * 3600  # 30 hours ago
        rec = CanonicalRecord(
            parameter="wave_height", value=2.0, unit="m",
            source="test", source_id="test", dataset="test",
            data_type="MODEL", state=NEAR_REAL_TIME,
            observation_time=old_time, valid_time=old_time,
            retrieved_at=old_time, spatial_resolution="",
            temporal_resolution="", distance_from_requested_km=0.0,
            quality="GOOD", confidence=0.9, notes="old",
        )
        state = build_environmental_state(0, 0, {"wave_height": rec})
        self.assertEqual(state.variables["wave_height"].freshness, STALE)


# ---- 7. Wave-vessel interaction --------------------------------------------- #


class TestWaveVesselInteraction(unittest.TestCase):
    def test_head_sea_worse_than_following(self):
        v = default_craft_profile(8.5, heading_deg=0)
        s_head = _state(
            wave_height=1.5, wave_period=8.0, wave_direction=0,  # head sea
            wind_speed=15.0, wind_gust=20.0, air_pressure=1012.0, visibility=10.0,
        )
        s_follow = _state(
            wave_height=1.5, wave_period=8.0, wave_direction=180,  # following
            wind_speed=15.0, wind_gust=20.0, air_pressure=1012.0, visibility=10.0,
        )
        r_head = compute_risk(s_head, v)
        r_follow = compute_risk(s_follow, v)
        # Head-sea score must be >= following sea score
        comp_h = next(c for c in r_head.components if c.name == "wave_vessel_interaction")
        comp_f = next(c for c in r_follow.components if c.name == "wave_vessel_interaction")
        self.assertGreaterEqual(comp_h.score, comp_f.score)


# ---- 8. Vessel validation ---------------------------------------------------- #


class TestVesselValidation(unittest.TestCase):
    def test_negative_length_rejected(self):
        with self.assertRaises(ValueError):
            VesselProfile(
                vessel_id="X", vessel_name="X", length_m=-1, beam_m=2.0,
                draft_m=0.5, freeboard_m=0.5, displacement_kg=1000.0,
                engine_power_kw=10.0, max_speed_kn=10.0, cruising_speed_kn=5.0,
            )

    def test_beam_greater_than_length_rejected(self):
        with self.assertRaises(ValueError):
            VesselProfile(
                vessel_id="X", vessel_name="X", length_m=4.0, beam_m=10.0,
                draft_m=0.5, freeboard_m=0.5, displacement_kg=1000.0,
                engine_power_kw=10.0, max_speed_kn=10.0, cruising_speed_kn=5.0,
            )

    def test_cruise_faster_than_max_rejected(self):
        with self.assertRaises(ValueError):
            VesselProfile(
                vessel_id="X", vessel_name="X", length_m=8.0, beam_m=2.0,
                draft_m=0.5, freeboard_m=0.5, displacement_kg=1000.0,
                engine_power_kw=10.0, max_speed_kn=10.0, cruising_speed_kn=12.0,
            )


# ---- 9. Scenario-based smoke tests (no real I/O) ----------------------------- #


class TestScenarios(unittest.TestCase):
    def _v(self):
        return default_craft_profile(length_m=8.5, heading_deg=270)

    def test_calm_sea(self):
        s = _state(
            wave_height=0.2, wave_period=6.0, wave_direction=270,
            wind_speed=5.0, wind_gust=8.0, air_pressure=1015.0,
            visibility=20.0, current_speed=0.1, precipitation=0.0,
        )
        r = compute_risk(s, self._v())
        self.assertLessEqual(r.risk_score, 30)

    def test_moderate_sea(self):
        # For a larger vessel (12m) the capsize threshold is well
        # above 1m, so moderate sea produces a moderate score without
        # triggering the circuit breaker.
        v = default_craft_profile(12.0)
        s = _state(
            wave_height=1.0, wave_period=8.0, wave_direction=270,
            wind_speed=20.0, wind_gust=30.0, air_pressure=1010.0,
            visibility=10.0, current_speed=0.4, precipitation=0.0,
        )
        r = compute_risk(s, v)
        self.assertGreaterEqual(r.risk_score, 25)
        self.assertLessEqual(r.risk_score, 80)

    def test_heavy_sea_triggers_breaker(self):
        s = _state(
            wave_height=2.5, wave_period=10.0, wave_direction=270,
            wind_speed=50.0, wind_gust=80.0, air_pressure=995.0,
            visibility=5.0, current_speed=1.5, precipitation=10.0,
        )
        r = compute_risk(s, self._v())
        self.assertGreaterEqual(r.risk_score, 70)
        self.assertTrue(r.circuit_breaker.triggered)

    def test_extreme_cyclone_with_no_data(self):
        # Data unavailable; risk should be INSUFFICIENT_CURRENT_DATA,
        # never faked.
        v = self._v()
        s = _state()  # no data
        r = compute_risk(s, v)
        self.assertEqual(r.risk_label, "INSUFFICIENT_CURRENT_DATA")


if __name__ == "__main__":
    unittest.main(verbosity=2)
