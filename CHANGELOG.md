# ORCA — Session Log & Engineering Decisions

This document records what was built, what was fixed, and the architectural
decisions taken in the most recent development session against the ORCA
frontend + backend at `/Users/subham/code/orca`.

It is intentionally honest about fabricated vs. real data, and about
things that are still incomplete.

---

## 1. UI / UX polish pass (early session)

### 1.1 What was added

- **Design tokens** in `tailwind.config.js` (`ocean.*`, `cyan.*`, `safety.*`,
  custom shadows, focus ring classes, `motion-safe:animate-pulse-soft`)
- **UI primitive library** under `frontend/src/ui/`:
 - `Card`, `CardHeader`, `Button`, `IconButton`, `StatusBadge`,
    `StatusIndicator`, `Spinner`, `Skeleton`, `EmptyState`, `AudioButton`,
    `Tooltip`, `Alert`, `AlertBanner`, `Modal`, `Drawer`, `Toast`,
    `ToastProvider`, `Tabs`, `Input`, `Select`, `Metric`, `DataRow`,
    `DataList`, `SectionHeader`, `PageHeader`, `ErrorState`, `LoadingState`
- **`useSpeech` hook** + `utils/speech.ts` (centralised Web Speech API +
  BCP-47 language lookup, `startVoiceRecognition()`)
- **`utils/orcaApi.ts`** — typed API client for backend services
- **Refactored views**: `Header.tsx`, `BottomNav.tsx`, `TodayView.tsx`,
  `LivingChart.tsx`, `AskOrcaView.tsx`, `AuthorityView.tsx`,
  `OsintView.tsx`, `SystemDiagnostics.tsx`, `VesselProfileModal.tsx`
- **Removed** obsolete `utils/voiceSpeech.ts`

### 1.2 Architectural notes

- `EmptyState` retained a legacy `action` slot (deprecated) for
  backward compat with views that pre-date the new primitive library
- Bundle size after this pass: 387 KB raw / 110 KB gzipped

### 1.3 Commits

- `feat(ui): establish ORCA design tokens and reusable component primitives`

---

## 2. Application shell + design system

### 2.1 What was added

- **`src/design/states.ts`** — typed `OperationalState` union:
  `NORMAL | INFO | CAUTION | WARNING | HIGH_RISK | CRITICAL | OFFLINE | STALE | UNKNOWN`
  with `OPERATIONAL_STATE_META`, `riskScoreToState()`,
  `freshnessToState()`, `connectivityToState()`. The rule: **every state
  carries a colour, an icon, a label, and an aria-description — never
  colour alone**.
- **`src/design/tokens.ts`** — motion, layout, focus, z-index tokens
- **`src/hooks/useReducedMotion.ts`** — media-query hook for motion
  accessibility
- **AppShell** under `src/components/shell/`:
  - `AppShell.tsx` — responsive layout (mobile / tablet / desktop),
    `paddingInline` tokens, `safe-area-inset-bottom`, skip-to-main link
  - `GlobalHeader.tsx` — sticky top, branding, operational context,
    connectivity indicator, notifications badge, session menu hook
  - `SystemStatusBar.tsx` — semantic state pills for connectivity,
    data freshness, operational state
- **Navigation** under `src/components/nav/`:
  - `navManifest.ts` — data-driven nav with `status: 'live' | 'planned'`
    so future ORCA modules are architecturally accommodated without
    being presented as implemented screens
  - `Sidebar.tsx` — desktop left rail, sectioned groups, Tooltip-wrapped
    items, planned modules visibly tagged "Soon"
  - `BottomNav.tsx` — mobile/tablet nav, manifest-driven, `aria-current`
- **Hardened primitive set** — see §1.1 list above

### 2.2 Architectural notes

- Domain logic is never embedded in UI components. Every component
  takes its state via props and renders accordingly. The `OperationalState`
  ↔ semantic tone mapping is the only domain-aware piece, and it lives
  in `design/states.ts` not in any view.
- Forward-compat: planned nav items (`Marine Map`, `SAR`, `Analytics`,
  `Vessels`, `Trips`, `Incidents`, `Infrastructure`, `Documentation`)
  are listed in `navManifest.ts` but render with the `disabled` attribute
  and a "Soon" badge so users cannot reach unimplemented screens.

### 2.3 Commits

- `feat(design): introduce ORCA semantic operational states and motion tokens`
- `feat(ui): expand ORCA primitive library (Alert, Modal, Drawer, Tabs, Toast, Tooltip, etc.)`
- `feat(shell): add ORCA AppShell with Sidebar, BottomNav and SystemStatusBar`

---

## 3. Phase 02 — Marine Operations Map

### 3.1 Audit of the prior scaffold

Before refactoring, the map scaffold in `frontend/src/map/` was
reviewed for fabrication:

| Location | Problem |
|---|---|
| `adapters/featureAdapter.ts` | Hardcoded fake vessel IDs (`IND-MH-04-04-892`), fake IMBL polygon vertices, fake naval zone polygon |
| `adapters/h3Adapter.ts` | Drew arbitrary hexagons, **called them H3** without using the `h3-js` library |
| `types/layer.ts` (`DEFAULT_MAP_LAYERS`) | `freshnessStatus: 'LIVE'` with `lastUpdated: '10s ago'` — fabricated freshness stamps |
| `components/MapTopBar.tsx` | Hardcoded `freshness="LIVE"` text |
| `components/LeafletMapContainer.tsx` | `useEffect([center, zoom, map])` would cause `flyTo` to fire on every user-pan event, producing oscillation |
| `components/MarineMapWorkspace.tsx` | `userPanningRef` flag logic was incomplete; ref passed via unrelated `MapFocusRelayer` component |

### 3.2 What was replaced

| File | Status |
|---|---|
| `map/types/feature.ts` | Rewritten — discriminated union with strict `FreshnessState` contract. **Never emits fabricated "LIVE / 10s ago"**. |
| `map/types/layer.ts` | Default layers carry `freshnessStatus: 'UNKNOWN'` and `isAvailable: false` for unimplemented feeds. `DEFAULT_BASE_MAP` later changed to `osm_standard` for reliability. |
| `map/theme.ts` | **New file.** Single source of raw hex values Leaflet needs; no inline colours across renderers. |
| `map/adapters/featureAdapter.ts` | Rewritten — converts `TripAssessmentResponse` → `MapFeature[]`. **No fake IMBL polygon. No fake vessel IDs.** Emits IMBL only when `geofence_status.dist_to_imbl_km` is present, as a single-point probe with explanatory text in the detail panel. |
| `map/adapters/h3Adapter.ts` | Rewritten to use the **official `h3-js` library** (`cellToBoundary`, `latLngToCell`). The adapter accepts `{h3Index, value, ...}` records and renders real Uber-H3 polygons. No fake hexagons. |
| `map/fixtures/devFixtures.ts` | Opt-in only via `?demoFixtures=1` query string OR `import.meta.env.DEV`. Every fixture carries `isDemoData: true` and a `[DEMO / SIMULATION]` prefix in its name. The simulated algal-bloom zone uses a real h3-js cell index (computed, not invented). |
| `map/components/LeafletMapContainer.tsx` | **Programmatic vs user-pan separation.** `ViewportController` accepts a `flyToNonce` prop; `flyTo` runs only when the nonce increments. User `moveend` events update live center/zoom for the top bar but never trigger flyTo. Added `ResizeObserver` on container and a `tileerror` event listener that dispatches a custom event. |
| `map/components/MarineMapWorkspace.tsx` | Removed `userPanningRef`, removed dev-only network toggle button, **zoom buttons now track live viewport not the programmatic target**. |
| `map/components/MapTopBar.tsx` | Uses `StatusIndicator` (semantic state). No fabricated freshness. |
| `map/components/MapLayerControl.tsx` | Grouped switch UI by category (Operational / Marine / Boundaries / Routing / Analytics / Base Map). Unavailable layers are visibly disabled. Keyboard-accessible (role="switch", aria-checked). |
| `map/components/MapFloatingControls.tsx` | Uses `IconButton` + `Tooltip`. `aria-pressed` on the layer-control toggle. |
| `map/components/FeatureDetailDrawer.tsx` | Reusable detail for every feature type via switch on `feature.type`. Uses `StatusIndicator`, `Metric`, `DataRow`, `DataList`. **Escape closes the drawer.** Demo badge visible on simulated features. |
| `map/components/renderers/*.tsx` | All five renderers (`Vessel`, `VectorPolygon`, `H3Grid`, `Route`, `Incident`) use `theme.ts` for colour. Vector renderer treats single-point features (e.g. IMBL proximity probe) as marker + reference circle — never pretends to know a polygon it doesn't have. |
| `utils/harbors.ts` | Was `INDIAN_HARBORS`. Expanded to **global** — ~50 curated ports across Asia, Africa, Europe, North America, South America, Oceania. `INDIAN_HARBORS` retained as backward-compat alias. Added `findHarborsNear()` and `searchHarbors()`. |
| `components/LivingChart.tsx` | Now delegates to `MarineMapWorkspace`. |
| `components/App.tsx` | Passes `vesselProfile` to `LivingChart`. |
| `package.json` | Added **`h3-js@^4.5.0`** — the only new dependency in this phase. No new map library. |

### 3.3 Real geographic data verification (3+ globally-distinct coordinates)

Before claiming the map works globally, the backend was curled from
3 coordinates and the SST values were confirmed to differ:

| Coordinate | SST | Wave | Verdict |
|---|---|---|---|
| Mumbai (18.92, 72.83) | 29.2 °C | 1.46 m | Moderate caution |
| Tokyo (35.68, 139.65) | 27.7 °C | 1.10 m | Safe to venture |
| Reykjavik (64.15, -21.94) | 11.4 °C | 0.12 m | Safe to venture (cold-water conditions) |

### 3.4 Bundle impact

- Pre-Phase-02: 387 KB raw / 110 KB gz
- Post-Phase-02: 637 KB raw / 190 KB gz
- Delta is Leaflet + react-leaflet + h3-js. The h3-js binding is required
  for the brief's mandate that "the rendering layer should remain
  independent from how the H3 data was generated".

### 3.5 Commits

- `feat(map): establish feature & layer domain models with honest freshness defaults`
- `feat(map): wire real Uber-H3 via h3-js and strip fabricated adapter data`
- `feat(map): rebuild Marine Operations workspace with nonce-driven viewport, theme tokens, and accessible detail panel`
- `feat(map): route LivingChart tab to ORCA Marine Operations workspace`
- `fix(map): zoom buttons track live viewport, escape closes detail panel, drop dev toggle`
- `fix(map): observe container resize and surface tile errors so the canvas cannot silently render blank`

---

## 4. Backend hardening primitives

### 4.1 What was added

- **`backend/utils/config.py`** — env-driven `Settings` dataclass.
  - `CORS_ALLOW_ORIGINS` parsed from env; **wildcard forbidden in production**.
  - `ORCA_AUTHORITY_TOKENS` parsed for institutional auth.
  - `RATE_LIMIT_PER_MINUTE`, `ENABLE_EXTERNAL_FEEDS`, etc.
- **`backend/utils/logging.py`** — structured JSON logging
  - Per-record `service`, `version`, `host`, `request_id`
  - `ContextVar`-based correlation ID propagation
  - Idempotent root-logger configuration; tames uvicorn defaults
- **`backend/utils/errors.py`** — typed exception hierarchy
  - `OrcaError` base; `FeedUnavailable`, `StaleData`,
    `InvalidObservation`, `SafetyRefused`, `Unauthorized`, `Forbidden`,
    `RateLimited`
  - Each carries `http_status`, `code`, `details`, and `to_dict()` for
    structured responses
- **`backend/utils/auth.py`** — FastAPI dependencies
  - `require_authority` validates bearer tokens against
    `SETTINGS.authority_tokens`
  - `require_scope(*scopes)` validates against `X-ORCA-Scopes` header
  - Tokens are never logged or echoed

### 4.2 Status

- All four modules **import cleanly** (`from utils.config import SETTINGS; ...`).
- All **44 PyTest cases pass**.
- **NOT YET WIRED** into `main.py` or any route handler. That is the
  next planned phase. Status: utils ready, integration pending.

---

## 5. Bug fixes triggered by user feedback

After the Phase-02 map shipped, the user reported: "map canvas is blank",
"voice doesn't work", "chat doesn't work", "no animations", "no working
demo". The investigation revealed several fabrication issues that had to
be fixed before the user could see honest, working behaviour.

### 5.1 Fake IMD cyclone trigger

**Bug:** `backend/services/alerts_service.py` was hardcoded with
`if lat > 20.0 and lon > 86.0` — any coordinate north-east of Bengal
returned an active cyclone advisory. Tokyo (35.68, 139.65) was being
flagged as "Very Severe Cyclonic Storm 'SAGAR'". The verdict on the UI
was therefore always `EXTREME DANGER` for the entire North Pacific.

**Fix:** Rewrote the service so cyclone alerts require explicit
`set_demo_override(cyclone=True)` AND an explicit region (`paradip`
only). Without that override the service returns an honest
"no active alerts reported" state with `data_provenance.is_simulated: true`.

### 5.2 World-model key mismatch (silent fallback)

**Bug:** `backend/services/world_model_service.py` was reading
`ocean_metrics["sst_c"]` and `wave_metrics["wave_height_m"]` — keys
that the upstream services do **not** produce. `ocean_service.py` returns
`sea_surface_temp_c` and `chlorophyll_mg_m3`. `wave_service.py` returns
`significant_wave_height_m` and `swell_period_sec`. The dict.get() with
a fallback constant silently masked the upstream mismatch. Every
coordinate returned the hardcoded fallback SST of 28.4 °C.

**Fix:** Updated `world_model_service` to read **both** the canonical
Open-Meteo key and the legacy key, using whichever is present. Real
values now flow through.

**Verification (see §3.3 table):** Mumbai 29.2 °C, Tokyo 27.7 °C,
Reykjavik 11.4 °C — all distinct.

### 5.3 Map canvas blank

**Suspected causes** (none confirmed by the user as fixed; user did
not hard-reload):
- Carto CDN (default base map) blocked or slow in some networks
- MapContainer initialised at 0×0 before parent layout settled

**Fixes shipped:**
- `ResizeObserver` on the map container with `invalidateSize()` on every
  resize, plus a `requestAnimationFrame` retry on mount
- `tileerror` event listener that dispatches a custom event so future
  work can surface tile failures visibly
- `DEFAULT_BASE_MAP` switched from `nautical_dark` (Carto) to
  `osm_standard` (OpenStreetMap) — more reliable CDN

### 5.4 Global quick-jump on map

The user explicitly wanted worldwide coverage, not a Malvan-only demo.
Added a **"Jump to" chip row** under the map top bar with seven
representative cities: Tokyo Bay, Sydney, Reykjavík, Cape Town, New York,
Rio Grande, Mumbai. Clicking any chip flies the map to that coordinate
and runs a fresh assessment against the live backend.

### 5.5 Commits

- `8694290` Backend: stop fake IMD cyclone + propagate real Open-Meteo ocean values
- `a550019` Map: global sample chip row
- `1fc25a0` Map: default base map OSM

---

## 6. Known incomplete work

Honest status of what is **not yet done**:

1. **Backend utils not wired into `main.py`.** `config.py`, `logging.py`,
   `errors.py`, `auth.py` exist and import cleanly, but middleware,
   exception handlers, scope-based deps on governance endpoints,
   structured logging propagation, and `/health` → `/health`+`/ready` split
   are all pending.
2. **Voice / chat does not yet use a real LLM.** `useSpeech` correctly
   wraps the browser's `SpeechRecognition`. The chat field calls the
   backend `/assess-trip` and shows the explanation it gets back. There
   is no LLM providing conversational answers — the response is whatever
   the deterministic orchestrator produces. Adding an LLM is a Phase-04
   conversation-handler task that depends on LLM boundary work (see
   the architectural mandate §20).
3. **`Today's Trip` view does not yet surface `world_model.ocean_state`
   in the UI.** The backend returns SST, wave, current etc.; the view
   shows only verdict, HSI species matrix, ROI table, route + fuel twin.
   Surfacing the new real ocean-state card is pending.
4. **Code splitting.** The 637 KB bundle exceeds Vite's default warning
   threshold. Splitting the map module behind a dynamic `import()` is
   recommended for Phase-03 but not critical.
5. **Authority / governance endpoints** still have no authentication.
   The `require_authority` dependency exists in `utils/auth.py` but is
   not yet attached to `/api/v1/governance/override`,
   `/api/v1/authority/anomalies`, etc.

---

## 7. Hard-reload reminder

After any frontend fix that touches layout, Leaflet, or canvas sizing,
the user must **hard-reload `http://localhost:5173`**
(Cmd+Shift+R on macOS / Ctrl+F5 on Linux/Windows). Vite HMR does
not always push a full module re-evaluation for the map component,
and the user does not reload on their own.