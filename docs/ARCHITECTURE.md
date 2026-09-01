# ORCA 4.0 System Architecture & Microservice Execution Blueprint
> **Problem Statement ID**: SIH26176 | **Sponsoring Organization**: ISRO (Department of Space)

---

## 🏗️ Architectural Separation Directive: Deterministic vs ML vs LLM

To ensure absolute safety, auditability, and production reliability, ORCA 4.0 enforces strict boundaries:

1. **Deterministic Microservices (Pure Compiled Python, <10ms, No Models, No LLMs)**:
   - All safety-critical decisions, geofencing checks, vessel capsizing physics, and official alert overrides run as deterministic code.
   - *Why*: Artificial Intelligence models and LLMs are probabilistic and can hallucinate. A safety circuit breaker MUST be 100% auditable and non-bypassable.

2. **Machine Learning Inference Layer (XGBoost, Sobel 2D Filters, Monte Carlo)**:
   - Used exclusively for predictive optimization: Multi-Species Habitat Suitability Index ($HSI$), 1,000-Particle Search & Rescue Drift Simulator, Sobel Thermal Front extraction, and Dark-Fleet SAR Anomaly matching.
   - *Why*: Machine Learning excels at non-linear spatial pattern recognition. Its outputs are advisory.

3. **Constrained Conversational LLM / ASR Layer (Downstream Only)**:
   - Restricted strictly to: (1) Natural Language Intent Parsing (Voice/Text $\rightarrow$ JSON) and (2) Multilingual Plain-Language NLG Synthesis (Structured JSON $\rightarrow$ Native Audio).
   - *Why*: LLMs must sit *after* the safety decision has already been deterministically executed.

---

## 🔄 End-to-End Request Sequence Diagram (`/api/v1/assess-trip`)

```mermaid
sequenceDiagram
    autonumber
    actor Fisher as Fisherman (Voice/PWA)
    participant API as FastAPI Server (main.py)
    participant DAG as Multi-Agent Orchestrator
    participant Ocean as Ocean Service (Open-Meteo)
    participant Weather as Weather & Wave Services
    participant Alert as IMD Alerts Service
    participant Safety as Deterministic Safety Circuit Breaker
    participant HSI as Multi-Species HSI Matrix (ML)
    participant Path as A* Weather Pathfinder (Deterministic)
    participant Econ as Economic ROI Optimizer
    participant NLG as Multilingual NLG Synthesizer
    participant DB as SQLite DB Ledger

    Fisher->>API: POST /api/v1/assess-trip (lat, lon, vessel_length_m)
    API->>DAG: execute_pipeline()
    
    par Concurrent Ingestion Fan-Out
        DAG->>Ocean: fetch_ocean_metrics() [DETERMINISTIC/API]
        DAG->>Weather: fetch_weather_metrics() [DETERMINISTIC/API]
        DAG->>Alert: check_active_alerts() [DETERMINISTIC/API]
    end
    
    Ocean-->>DAG: SST, Chlorophyll, Thermal Gradients
    Weather-->>DAG: Wind speed, Gusts, Wave Height (Hs)
    Alert-->>DAG: Active Cyclone Alerts Status

    DAG->>Safety: evaluate_safety_and_circuit_breaker() [DETERMINISTIC]
    Note over Safety: Checks H_crit = 0.6 * L_vessel & Cyclone Alerts
    Safety-->>DAG: Verdict: SAFE TO VENTURE / EXTREME DANGER OVERRIDE

    DAG->>HSI: compute_habitat_suitability() [MACHINE LEARNING]
    HSI-->>DAG: Species HSI Matrix (Bangda, Surmai, Tarli, Poplet)

    DAG->>Path: compute_safest_route() [DETERMINISTIC A*]
    Path-->>DAG: 4-Point Waypoints & Fuel Est (Liters)

    DAG->>Econ: optimize_trip_economics() [DETERMINISTIC ROI]
    Econ-->>DAG: Recommended Dock & Max Expected Net Profit (INR)

    DAG->>NLG: synthesize_explanation() [CONSTRAINED NLG]
    NLG-->>DAG: Plain Language Text & Native Audio Transcript

    DAG->>DB: save_trip_log() [SQLITE PERSISTENCE]
    DAG-->>API: Structured JSON Payload + Provenance Metadata
    API-->>Fisher: Render Verdict Dial, Living Map & Audio Output
```
