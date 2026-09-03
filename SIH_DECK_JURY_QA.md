# ORCA 4.0 — SIH Jury Q&A Attack Sheet

**File reference:** `/Users/subham/code/orca/ORCA_4.0_SIH_Deck.pptx`
**Template:** official SIH 2026 IDEA submission (preserved)
**Tone:** short · technical · defensible · non-hype

---

## 1. What exactly is innovative?

ORCA does not aggregate marine data — it produces a **vessel-conditioned, route-aware decision**.

Three things that existing products do not combine:

1. **Vessel-aware thresholds.** The capsize threshold (H_crit = 0.6·L·sin θ) and the manufacturer max-wave/wind limits live in the same validated 16-field profile as the operating state. The same wave height produces a different score for a 6 m canoe and a 25 m trawler.
2. **Deterministic safety circuit breaker.** Seven hard rules run *before* the continuous risk engine. A cyclone alert, an IMBL violation, a wave above H_crit — any of these force a verdict. ML cannot override the breaker.
3. **Per-segment route risk.** The route engine samples the canonical environmental state at every waypoint, computes the per-segment ORCA MRSI, surfaces the worst segment, and exposes the hazardous distance (sum of segments with MRSI ≥ 70).

---

## 2. Why can't an existing weather app do this?

A weather app returns a forecast. The operator still has to:

- know the vessel's H_crit (most fishermen don't)
- know the wave–vessel encounter period (no app computes it)
- check the IMBL buffer themselves (no app integrates the polygon)
- decide whether gust or wave is the binding constraint (no app computes per-hazard breakdown)

ORCA does all four, with provenance per value and a reproducibility guarantee (SHA-256 of input snapshot = assessment_id).

---

## 3. Why do you need ML?

For the *current* version of ORCA, ML is on the roadmap, not the critical path. The shipping version uses:

- deterministic threshold tables (`risk_engine/hazards.py`)
- deterministic circuit breaker (`risk_engine/circuit_breaker.py`)
- canonical data fusion (rule-based selection)
- Haversine + Kijima 1990 encounter period (closed-form physics)

ML becomes useful in three places, all roadmap:

- anomaly detection on route history
- forecast correction (bias correction of NWP)
- explainability rephrasing (LLM, gated to never change the score)

**Where ML is NOT used:** safety-critical decisions, hard limits, anything that has to be auditable.

---

## 4. Where does your training data come from?

ORCA does not require a custom training dataset today. The risk engine is rule + physics based. All 18 input parameters come from public NWP and buoy feeds.

For the roadmap ML components, we will use:

- 6-hourly NWP reanalysis grids (ERA5, ECMWF IFS) — public
- AIS tracks (open AIS aggregators) — public
- NDBC buoy observations — public

We will not train on private data without explicit consent.

---

## 5. How accurate is the model?

ORCA does not claim a probabilistic accuracy for safety because the score is **not a probability of accident**. It is a Maritime Safety Risk Index on [0, 100], computed from a weighted additive formula with monotonicity guarantees.

What we have validated:

- **24/24 risk-engine unit tests pass** (monotonicity, reproducibility, vessel-specificity, circuit breakers, freshness, wave-vessel interaction)
- **62/68 backend tests pass** (the 6 failing tests are legacy `test_backend.py` cases that still reference the old hardcoded service layer — see `PHASE1_AUDIT.md`)
- **Live Kanyakumari validation:** MRSI = 75/100, HIGH_RISK_IMBL, reproducible, matches the canonical state from a direct Open-Meteo query

What we have **not** validated: accuracy against a labelled incident dataset. That is a pilot-phase KPI.

---

## 6. How do you validate it?

Four layers:

1. **Unit tests** — 24 risk-engine tests cover reproducibility, monotonicity, vessel-specificity, every circuit-breaker rule, freshness, and wave-vessel interaction.
2. **Live API validation** — Kanyakumari run matches a direct Open-Meteo query within rounding tolerance.
3. **Scenario smoke tests** — 4 scenarios (calm sea, moderate sea, swell, vessel above H_crit) verify verdict transitions.
4. **Pilot validation** — to be done with a coastal partner.

---

## 7. What happens when APIs fail?

The provider abstraction (`providers/base.py`) implements circuit breaking and rate limiting per provider. When a provider fails:

- the canonical record for that parameter is flagged `UNAVAILABLE`
- the risk engine continues with the remaining parameters
- if data quality drops below 0.5 OR more than 4 parameters are unavailable, the engine returns **`INSUFFICIENT_CURRENT_DATA`** verdict
- the UI explicitly says "DATA UNAVAILABLE — do not venture"

ORCA never falls back to a fabricated value. The Phase 1 audit explicitly removed every hardcoded fallback.

---

## 8. What happens when data sources disagree?

Three layers:

1. **Provenance per value** — every record carries `source`, `dataset`, `observation_time`, `distance_km`.
2. **Source priority** — `SOURCE_PRIORITY` in `data_providers/orchestrator.py` orders providers per parameter.
3. **Confidence score** — per-variable confidence is propagated; the overall `risk_uncertainty` is surfaced in the UI.

Disagreement increases uncertainty; it does not automatically trigger a CB override.

---

## 9. What happens when internet connectivity fails?

Today: the UI detects `!navigator.onLine` and shows an offline indicator. The last assessment remains visible.

Roadmap: edge device caches the last canonical state + 72-hour forecast bundle + local safety rules; risk verdict computed locally with reduced confidence; degraded but **explicit** mode.

We do not claim full offline capability today — that is in the deployment-economics roadmap slide.

---

## 10. How much does deployment cost?

**Prototype** — free-tier cloud (Vercel/Render + Open-Meteo free). Indicative.

**Pilot** — commodity VPS + free-tier APIs. ~₹4 000 / month for 10⁵ assessments (indicative — vendor-dependent).

**Production** — adds StormGlass / Copernicus / NASA Earthdata keys for higher-fidelity data. Pricing depends on selected vendor.

**Edge device** — ESP32 + GPS + LoRa, indicative BOM totalling ~₹3 200 (vendor-dependent).

**We do not extrapolate to "nationwide savings" without pilot data.** That would be invented.

---

## 11. Why will fishermen adopt it?

Honest answer: we don't know yet. Adoption is a pilot KPI.

What we are building toward:

- one-verdict output (no dashboard to interpret)
- voice interface in local dialect (Marathi / Hindi / Gujarati / Tamil — see `nlg_service.py`)
- offline-capable (so it works 40+ km offshore where cellular drops)
- vessel-specific (so it is trusted for *this* boat, not a generic forecast)

If the verdict matches the operator's gut feel for *known* conditions, they will trust it for the unknown ones. That is the adoption hypothesis.

---

## 12. How does it scale?

The architecture is stateless — every assessment is a fresh request to the canonical layer, the risk engine, and the route engine. Scaling is horizontal on the backend (FastAPI + asyncio). The provider abstraction fans out in parallel. The bottleneck is the slowest provider, not the engine.

**Phased roadmap:** Prototype (now) → One-coastal-state pilot → Multi-vessel fleet → Multi-state coastal → National maritime intelligence layer.

---

## 13. What is the biggest technical risk?

**Provider reliability.** ORCA depends on five third-party providers today. If Open-Meteo's free tier changes terms, or MET Norway rate-limits us, the canonical layer degrades.

Mitigation: provider abstraction + circuit breaker + rate limiting, plus three credential-gated providers ready to activate.

Secondary risk: **IMD cyclone feed is not yet integrated.** The deterministic breaker is wired but the input is scaffolded. Until the IMD CWD parser lands, a real cyclone will not auto-trigger — only a human-supplied advisory via `alerts={"has_active_cyclone_alert": True}` will.

---

## 14. What is your fallback?

For data: provider circuit breaker + canonical UNKNOWN → INSUFFICIENT_DATA verdict (refuse to answer rather than fake SAFE).

For ML components: deterministic tables + closed-form physics cover every safety-critical path.

For deployment: free-tier cloud runs the full pipeline today; no critical dependency on paid APIs.

---

## 15. How is risk calculated?

```
ORCA_MRSI = clamp_0_100( 100 * Σ(weight_i × hazard_i) )

weights = {
  wave_height: 0.18, wave_vessel_interaction: 0.18, wind: 0.12,
  gust: 0.10, current: 0.08, visibility: 0.08, pressure: 0.10,
  precipitation: 0.06, official_warning: 0.10
}

Σ(weights) = 1.0  (asserted in engine.py)
```

Each `hazard_i` is in [0, 1] and is monotonic in the dangerous direction. The total is clamped to [0, 100]. The deterministic circuit breaker can force the verdict to EXTREME / HIGH_RISK / INSUFFICIENT_DATA.

The full equation is returned in `risk.risk_equation` in every assessment response.

---

## 16. Is the risk score scientifically validated?

The formula is grounded in:

- **Kijima et al. 1990** — encounter-period formula (used in `wave_vessel_interaction_hazard`)
- **ORCA spec §1.5** — capsize threshold H_crit = 0.6·L·sin(θ) (used in `circuit_breaker.py`)
- **FAO small-craft rule** — GM ≈ 0.05 × beam (used as default in `vessel.py`)
- **WMO / ECMWF NWP** — atmospheric and wave reanalysis (provider layer)
- **NOAA NDBC** — in-situ buoy validation

What we have **not** done: a published statistical validation against a labelled incident dataset. That is a pilot-phase deliverable.

---

## 17. How does vessel size affect risk?

Three places:

1. **H_crit** — H_crit = 0.6 · L · sin(10°). A 6 m canoe has H_crit ≈ 0.63 m. A 25 m trawler has H_crit ≈ 2.6 m.
2. **GM default** — GM ≈ 0.05 × beam (FAO rule of thumb).
3. **Hazard scaling** — the wave hazard score uses `Hs / H_crit` (vessel-relative), so the same 1.66 m wave produces hazard = 0.93 for a 6 m canoe and hazard ≈ 0.5 for a 25 m trawler.

This is tested in `TestVesselSpecific::test_larger_vessel_lower_wave_risk`.

---

## 18. How do waves interact with vessel heading?

The encounter period depends on relative wave angle:

```
T_e = T / |1 − (V · cos(relative_wave_angle)) / (g · T)|
```

Head seas produce the largest relative wave angle penalty (worst case). Beam seas are intermediate. Following seas are least dangerous.

The risk engine uses this in `wave_vessel_interaction_hazard` with a band table indexed by relative angle.

---

## 19. How is route risk different from point risk?

Point risk: one coordinate, one EnvironmentalState, one MRSI.

Route risk: up to 6 sampled waypoints, per-segment MRSI, aggregation:

- `max_risk` — worst segment
- `mean_risk` — average across segments
- `hazardous_distance_km` — sum of segments with MRSI ≥ 70
- `departure_risk` — risk at origin
- `arrival_risk` — risk at destination
- `worst_segment_index` — which segment is the problem

The route engine is in `risk_engine/route_risk.py`. Kanyakumari was tested point-only; multi-waypoint routes are exercised by the unit tests.

---

## 20. What prevents false safety recommendations?

Three guards:

1. **Deterministic circuit breaker runs first.** No false SAFE can clear a cyclone alert, an IMBL violation, or a wave above H_crit.
2. **Data quality gate.** If < 50% of parameters are available, the verdict is `INSUFFICIENT_CURRENT_DATA` — the UI explicitly says "do not venture".
3. **Reproducibility check.** Same inputs → same SHA-256 assessment_id. A score that changes without input change is a bug.

---

## 21. Why should the government use this?

Three honest reasons:

1. **It integrates the data sources they already publish.** INCOIS, IMD, ISRO satellite products — the canonical layer is provider-agnostic, so an official feed slots in without code change.
2. **It produces auditable verdicts.** Every score is traceable to per-value provenance and a deterministic formula. Suitable for regulatory audit.
3. **It scales without proprietary hardware.** Free-tier cloud + commodity edge devices — no vendor lock-in.

---

## 22. How is this different from INCOIS/IMD?

- INCOIS / IMD publish **forecasts and advisories**. ORCA consumes those (when integrated) and produces a **vessel-conditioned decision**.
- INCOIS / IMD do not compute H_crit, encounter period, or route-segment risk.
- INCAOS / IMD do not run a deterministic circuit breaker.

ORCA does **not** replace INCOIS / IMD. It sits on top of them and translates their output into an operator decision.

---

## 23. What happens if your model is wrong?

Because the breaker is deterministic, a "wrong" ML model cannot override a cyclone alert, an IMBL violation, or a wave above H_crit. The breaker wins.

For the continuous score: monotonicity + per-hazard breakdown means a wrong component is visible to the operator in the UI (`RiskBreakdownPanel.tsx`). The operator can drill into which hazard drove the score.

---

## 24. What happens when data is stale?

Per-parameter freshness windows in `data_providers/canonical.py`:

- wave_height / wave_period / SST: 6h
- wind / gust / pressure / temperature / visibility: 3h
- current: 6h
- chlorophyll: 24h
- tide_height: 5 min

When an observation is older than its window, the record is flagged `STALE`. STALE values are still used but with reduced weight in the data-quality score. `risk_uncertainty` rises. The UI shows the freshness badge per value.

---

## 25. What is your commercialization / deployment model?

Honest answer: this is an SIH project, not a company. The realistic deployment paths are:

1. **Open-source release** for state fisheries departments, with documentation.
2. **Pilot partnership** with one coastal state (Maharashtra, Goa, Kerala, Tamil Nadu — to be chosen based on access).
3. **Integration-ready** — the canonical layer is provider-agnostic; an official ISRO/INCOIS feed can be slotted in.

We do not have revenue projections because we have no paying customer and no validated adoption curve. Pilot data will produce them.
