# ORCA 4.0 — Backend Master Implementation Mandate

## Goal

Turn the existing ORCA backend into the production-grade decision-engine
foundation described by the architecture. Extend what's real, replace what
is fabricated, harden what is exposed.

## Audit Summary (already verified)

### Already implemented and real
- Typed Pydantic domain schemas (`ProvenanceMetadata`,
  `VesselDigitalTwinState`, `OceanState`, `RiskState`,
  `StructuredDecisionResult`).
- `MaritimeWorldModelService` — fuses vessel twin + ocean + risk + IMBL
  distance via haversine + H3 spatial index.
- `MultiObjectiveOptimizationEngine` — emits 3 Pareto routes (safest /
  lowest fuel / highest value) with explicit assumptions.
- `AgentEventBus` + `AgentMessage` — typed pub/sub with audit log.
- `SafetyAgent` — 4 deterministic rules (cyclone override, capsize,
  gale, weighted formula). Real physics: `H_crit = 0.22·L + 0.05·B`.
- `MultiAgentOrchestrator` — async DAG pipeline with NLG, audit log,
  inter-agent events.
- 26+ FastAPI endpoints.
- 44 PyTest cases passing.

### Gaps to address
- CORS wildcard `allow_origins=["*"]`.
- Missing / readiness split.
- No request correlation IDs / structured logging.
- No authentication on sensitive endpoints.
- Hardcoded fallback values in services (e.g.
  `weather_metrics.get("wind_speed_kmh", 16.5)`) — silently mask
  upstream failure.
- `model_governance_service`, `dark_fleet_service`, etc. not deeply
  audited.
- `load_test.py` may reference stale API surface.
- No environment-based config loading.

### Things not to touch (out of scope)
- The frontend (Phase 02 already shipped).
- The frontend's `livingChart` / map work.

## Implementation Order

Phase A — Provenance hardening + non-deceptive fallback contract.
Phase B — Configuration / env / secrets / CORS tightening.
Phase C — Observability: structured logging, request IDs, /health,
   /ready, /metrics.
Phase D — Authentication: scope-based deps for governance endpoints.
Phase E — World Model enhancements: explicit feed failures, degradation
   semantics, no silent fabrication.
Phase F — Routing engine: explicit algorithm profile; honest about
   current state (deterministic heuristic vs full A*).
Phase G — SAR + Economic + Anomaly: scope verification, no fabricated
   confidences.
Phase H — Hardening + cross-cutting integration tests.
Phase I — Final validation, docs.

## Validation

- pytest passes
- import-time check passes (no syntax errors)
- new tests pass
- no breaking changes to existing API contracts

## Done When

- Implementation matches the mandate section-by-section.
- All previously-passing tests still pass.
- New tests cover the hardened behaviour.
- Diff is clean of unrelated changes.