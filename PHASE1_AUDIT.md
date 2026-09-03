# ORCA 4.0 — Phase 1: Full Repository Audit Report

**Audit date:** 2026-09-03
**Scope:** entire `backend/` (Python) and `frontend/` (TypeScript)
**Mandate source:** user message with 43-section production rebuild directive

---

## Executive summary

The repository is a partial prototype. The data acquisition layer (added in
the prior session) is real, but the rest of the stack contains hardcoded
production-path values, a fake-cyclone demo override, a fake offline bundle
generator, fake random IMBL polygon, hardcoded safety-risk fallbacks, and
no production-grade continuous risk engine. The risk score returned to the
user is **not** computed from real inputs in many failure paths.

**Severity tally**

- 6 critical
- 5 high
- 4 medium

---

## Critical findings

### C-1 — Fake cyclone override in `services/alerts_service.py`
- **File / function:** `services/alerts_service.py :: AlertsService.check_active_alerts`
- **Behaviour:** if `set_demo_override(cyclone=True)` has been called, the
  service synthesises a `VSCS SAGAR (DEMO)` alert for any coordinate inside
  the Paradip bounding box (lat 19.5-21.0, lon 85.5-87.5).
- **Problem:** this is a fabricated cyclone that can be returned as a
  real alert to any production request inside that region. The default
  state also returns `is_simulated=True` but is still serialised to the
  user.
- **Severity:** critical.
- **Recommended fix:** remove `set_demo_override` and the demo region
  entirely. Replace the empty `_query_authoritative_alerts` with a real
  IMD CWD / INCOIS EWC integration. While unintegrated, return an
  `UNAVAILABLE` state with `is_simulated=True` clearly visible.

### C-2 — Hardcoded SST / wave / wind fallbacks in `services/ocean_service.py`
- **File / function:** `services/ocean_service.py :: fetch_ocean_metrics`
- **Behaviour:** when Open-Meteo returns no SST, the service returns
  `sst = 28.4`; when no current, `current_speed = 0.45`; when no chloro, `1.65`.
- **Severity:** critical.
- **Recommended fix:** route through the new canonical data layer that
  emits `DATA_UNAVAILABLE` instead of any numeric fallback.

### C-3 — Hardcoded fallbacks in `services/wave_service.py`
- **File / function:** `services/wave_service.py :: fetch_wave_metrics`
- **Behaviour:** returns `swh=1.1`, `period=10.5`, `swell_h=0.7*hs` when
  the live API fails.
- **Severity:** critical.
- **Recommended fix:** same as C-2.

### C-4 — Hardcoded fallbacks in `services/weather_service.py`
- **File / function:** `services/weather_service.py :: fetch_weather_metrics`
- **Behaviour:** returns `wind_speed=16.5`, `gust=22.0`, `pressure=1012`,
  `air_temp=28.0`, `cloud=45`, `vis=10` on any failure.
- **Severity:** critical.
- **Recommended fix:** the canonical data layer is already the source of
  truth for this; remove the legacy service from the production path.

### C-5 — Fake offline-bundle timeline in `services/offline_sync_service.py`
- **File / function:** `services/offline_sync_service.py ::
  generate_offline_bundle`
- **Behaviour:** returns `timeline = [{"hour": h, "sst": 28.4, "wave_height": 1.1}
  for h in range(12)]` regardless of coordinate.
- **Severity:** critical.
- **Recommended fix:** remove the mock or rename clearly to a placeholder
  the frontend must never use in production.

### C-6 — Hardcoded radar IMBL polygon in `services/dark_fleet_service.py`
- **File / function:** `services/dark_fleet_service.py :: radar_track_query`
- **Behaviour:** uses a hand-coded list of MMSI entries and a static
  bounding box.
- **Severity:** critical.
- **Recommended fix:** real SAR satellite feed is out of scope for the
  present rebuild; mark this as `unavailable` and skip the endpoint.

---

## High-severity findings

### H-1 — Hardcoded `risk_score` fallbacks in `services/safety_service.py`
- **File / function:** `services/safety_service.py :: evaluate_safety_and_circuit_breaker`
- **Behaviour:** if `wave_metrics` is empty the function used to return
  `risk=60, verdict=DATA_UNAVAILABLE`. Already partially fixed in the
  prior session, but the legacy defaults `swh=1.1`, `wind=16.5` remain as
  call-site fallbacks.
- **Severity:** high.

### H-2 — NLG service hardcoded fallbacks
- **File / function:** `services/nlg_service.py :: synthesize_explanation`
- **Behaviour:** reads `wave_metrics.get("significant_wave_height_m", 1.1)`
  and friends.
- **Severity:** high.

### H-3 — `incois_erddap_service` returns a `FALLBACK_CACHE` with
hardcoded `chlorophyll_a=1.78, sst=28.5`
- **File / function:** `services/incois_erddap_service.py ::
  fetch_incois_ocean_data`
- **Behaviour:** on any HTTP error, the service fabricates a climatology
  cache value.
- **Severity:** high.

### H-4 — `pfz_service` defaults to PFZ weights `0.35, 0.35, 0.30`
- **File / function:** `services/pfz_service.py :: compute_habitat_suitability`
- **Severity:** high (PFZ is the fishing suitability subsystem, not
  maritime safety; it must not contaminate the safety risk).

### H-5 — Frontend has hardcoded harbor coordinates
- **File / function:** `frontend/src/utils/harbors.ts`
- **Severity:** high (these are intentionally hard-coded for the demo
  picker; OK if marked so).

---

## Medium findings

- M-1 — `alerts_service.asyncio.sleep(0.005)` and `pfz_service.asyncio.sleep(0.01)`
  are no-op latency simulations; remove.
- M-2 — `cors allow_origins=["*"]` in `main.py` (security).
- M-3 — No real IMD / INCOIS / NASA Earthdata / Copernicus provider
  integration.
- M-4 — No provider health / circuit breaker / rate limit.

---

## Already-fixed items (from prior session)

- Wave / SST / wind / pressure / visibility / cloud cover are now flowing
  through a real `data_providers/` layer (MET Norway, Open-Meteo Marine,
  Open-Meteo ECMWF, NOAA NDBC buoys, StormGlass). These now return
  `DATA_UNAVAILABLE` instead of guessing.
- `world_model_service.assemble_world_model` consumes the canonical
  records; `OceanState` fields are now `Optional[float]`.
- `safety_service` returns `DATA_UNAVAILABLE` verdict when essentials are
  missing.
- Frontend `ProvenanceBadge` + `ProvenanceSourcePanel` already display
  per-value provenance and "DATA UNAVAILABLE" for nulls.

---

## What changes in Phase 2-17

The remaining sections of this audit directly feed the implementation
order in the user's directive: remove hardcoded production values,
build the proper provider abstraction, write the maritime-physics hazard
models, the deterministic safety circuit breaker, the continuous risk
engine, the route risk, the vessel digital twin, the explainability
layer, and the test suite. Each phase ends with a commit + push to
`origin main`.
