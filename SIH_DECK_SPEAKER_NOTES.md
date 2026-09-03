# ORCA 4.0 — SIH 2026 Official Template Deck
## Speaker notes + content map

**File:** `/Users/subham/code/orca/ORCA_4.0_SIH_Deck.pptx`
**Template:** official SIH 2026 IDEA submission (preserved exactly: footer, blue bar, slide numbers, layouts)
**Slides:** 6 official content + 1 SIH-limit-instruction slide (kept as-is)
**Pitch target:** 5–8 minutes
**Ground rule:** every claim verified against the ORCA repository, audit logs, or labelled indicative.

---

## SLIDE 1 — TITLE PAGE
**Layout:** Title Slide (template)
**Placeholder:** CENTER_TITLE = `ORCA 4.0  ·  From Ocean Data to Safer Decisions.`
**Placeholder:** SUBTITLE = Maritime Decision Intelligence for Coastal India · SIH26176 · Theme · Category · Team ID · Team Name

**Speaker (15 s):**
"ORCA 4.0 — maritime decision intelligence for coastal India. Built for SIH problem statement 26176, sponsored by ISRO. Our tagline: from ocean data to safer decisions."

---

## SLIDE 2 — IDEA TITLE / PROPOSED SOLUTION
**Layout:** Title and Content
**Title placeholder:** `IDEA TITLE` + `Proposed Solution` sub-line

**Diagram (top):**
- 8 fragmented input nodes (WAVES · WIND · CURRENTS · WEATHER · CYCLONES · VESSEL · AIS · ROUTE) on the left
- convergence arrows into the central ORCA Intelligence Engine
- inside the engine: Environmental State → Vessel Digital Twin → Maritime Physics → Deterministic Circuit Breaker → ORCA MRSI (0–100)
- output cascade on the right: RISK → ROUTE-SPECIFIC RISK → ACTIONABLE DECISION

**Key statement (bottom):**
- "FORECAST ≠ OPERATIONAL RISK."
- "ORCA converts environmental conditions into a decision for the specific voyage."

**Speaker (45 s):**
"Existing products give you a forecast. None of them tell the fisherman what it means for his boat. ORCA takes eight fragmented inputs — waves, wind, currents, weather, advisories, the vessel, AIS, the route — and runs them through one deterministic engine. The engine produces a single Maritime Safety Risk Index from zero to one hundred, reproducible, traceable. The verdict is not 'the sea is rough' — the verdict is 'unsafe to proceed', or 'high risk in segment three, modify your route'."

**Detailed explanation pointer (template):**
The diagram itself *is* the detailed explanation — the jury reads the data flow and immediately sees the proposed solution's structure.

**How it addresses the problem:**
Forecast fragmentation is solved by the canonical layer (18 parameters, one schema, provenance per value). The "interpret the forecast yourself" problem is solved by the vessel-conditioned risk engine.

**Innovation / uniqueness:**
- vessel-aware thresholds (H_crit, GM) — no existing product combines these
- deterministic circuit breaker — ML cannot override safety
- per-segment route risk with worst-segment surfacing

---

## SLIDE 3 — TECHNICAL APPROACH
**Layout:** Title and Content
**Title placeholder:** `TECHNICAL APPROACH` + `Technologies · Methodology · Process · Prototype`

**Diagram:** 7-source column on the left → 8-stage pipeline on the right.
- Sources (real or roadmap): INCOIS · IMD · Copernicus · Open-Meteo Marine/ECMWF/Forecast · MET Norway · NOAA NDBC · AIS/telemetry
- Pipeline: Provider abstraction → Canonical normalization → Environmental state → Vessel twin → Maritime physics → Circuit breaker → ORCA MRSI → Route risk
- Tech strip: Frontend / Backend / Intelligence / Infra
- Live demo callout: `Kanyakumari → MRSI 75/100`

**Speaker (60 s):**
"Seven data sources. Five are live today with no credentials — Open-Meteo, MET Norway, NDBC buoys. Three need credentials and the slots exist: StormGlass, Copernicus, NASA Earthdata. Two are roadmaps — IMD CWD, INCOIS ERDDAP — the registry is wired, the parser is the next step. Everything flows through a provider abstraction with circuit breaking and rate limiting, then a canonical layer that normalises eighteen parameters with freshness and provenance. The risk engine consumes only the canonical layer — never raw provider JSON. The bottom strip shows the tech stack. The live demo callout is real: Kanyakumari assessment, MRSI 75 of 100."

---

## SLIDE 4 — FEASIBILITY AND VIABILITY
**Layout:** Title and Content
**Title placeholder:** `FEASIBILITY AND VIABILITY` + `Implementation status · Challenges & mitigation · Deployment · Cost`

**Three columns:**
- **A. IMPLEMENTATION ROADMAP** — 6 items with ✓ / ◐ / ◌ status markers (only built items marked ✓)
- **B. CHALLENGES → MITIGATION** — 6 paired challenge/mitigation rows
- **C. DEPLOYMENT ECONOMICS** — Hardware + communication + compute + maintenance stack; PROTOTYPE → PILOT → SCALE; 1 vessel → fleet → region → coastline ribbon

**Speaker (60 s):**
"Left column: implementation status. Anything marked checkmark is in the repo today. Prototype, live data, risk engine, route engine are all built and tested. Kanyakumari pilot is in progress. Deployment is the roadmap. Middle column: every challenge ORCA faces, paired with the mitigation. Data stale → freshness policy. API failure → provider circuit breaker. No connectivity → edge cache + degraded mode. Right column: deployment economics. Indicative numbers only — production vendor not selected. Scale ribbon shows the path from one vessel to coastline-wide coverage."

---

## SLIDE 5 — IMPACT AND BENEFITS
**Layout:** Title and Content
**Title placeholder:** `IMPACT AND BENEFITS` + `Target audience · Social / Economic / Environmental / Strategic`

**Diagram:** ORCA 4.0 at centre; 6 nodes around it on a ring (Fishers, Fleets, Coastal Authorities, Ports, Disaster Response, Ocean Research) connected by spokes. Bottom causal flow strip.

**Causal flow:** LIVE CONDITIONS → VESSEL-SPECIFIC RISK → EARLIER AWARENESS → BETTER DEPARTURE DECISION → REDUCED EXPOSURE TO HAZARD

**Speaker (45 s):**
"ORCA in the centre. Six user groups around it — fishers, fleet operators, coastal authorities, ports, disaster response, ocean research. Each spoke is a real use case in the codebase. The bottom causal flow is the impact model, not a benefit list. We don't claim percentages because we don't have validated numbers — pilots will produce them. What we claim is the causal chain: better awareness produces better decisions, which reduces hazard exposure."

---

## SLIDE 6 — RESEARCH AND REFERENCES
**Layout:** Title and Content
**Title placeholder:** `RESEARCH  AND REFERENCES` + `Every formula ORCA uses has a real, citable source.`

**Layout:**
- 4 large research cards on the left: Kijima 1990 · FAO GM rule · ORCA capsize spec · Open-Meteo/NDBC
- 11 numbered references on the right (real, not fabricated)

**Speaker (45 s):**
"Four research cards on the left, eleven references on the right. Every formula in the engine has a real source. Kijima 1990 for encounter period — used in `wave_vessel_interaction_hazard`. FAO rule of thumb for GM — default in `vessel.py`. The capsize threshold is from the ORCA spec, used in `circuit_breaker.py`. The data sources are public NWP and buoy networks — Open-Meteo, MET Norway, NOAA NDBC. The references list is real and verifiable."

---

## SLIDE 7 — SIH'S OWN 6-SLIDE-LIMIT INSTRUCTION
**Layout:** Title and Content
**Content:** the official SIH message "Kindly keep the maximum slides limit up to six (6). (Including the title slide)"

**No speaker action.** This is the SIH template's own reminder — left untouched.

---

# Ground-truth numbers you can use on stage

| Claim | Source |
|---|---|
| 5 live providers, no credentials | `backend/providers/registry.py` |
| 3 provider slots wired, gated on env vars | same |
| 18 canonical parameters | `backend/data_providers/canonical.py` |
| 9 weighted hazards | `backend/risk_engine/hazards.py` |
| 7 deterministic circuit-breaker rules | `backend/risk_engine/circuit_breaker.py` |
| 24/24 risk-engine unit tests pass | `backend/tests/test_risk_engine.py` |
| 34 FastAPI endpoints | `backend/main.py` |
| Kanyakumari live: MRSI = 75/100 | `PHASE16_KANYAKUMARI_AUDIT.md` |
| Multi-objective Pareto solver is v0 placeholder | `backend/services/optimization_engine_service.py` |
| IMD/INCOIS feeds: roadmap | `PHASE17_FINAL_REPORT.md` §19 |

Everything else (cost numbers, BOM, deployment economics) is **labelled indicative** in the deck.
