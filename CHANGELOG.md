# ORCA — Session Log & Engineering Decisions

This document records what was built, what was fixed, and the architectural decisions taken in the development sessions against the ORCA frontend + backend at `/Users/subham/code/orca`.

---

## 1. Interactive Voice Assistant & Web Speech API Upgrade

### 1.1 What was added

- **Native Web Speech Synthesis (`useSpeech.ts`)**: Wired native browser `window.speechSynthesis` supporting regional BCP-47 speech engines for Marathi (`mr-IN`), Hindi (`hi-IN`), Gujarati (`gu-IN`), Tamil (`ta-IN`), and English (`en-IN`).
- **Live Microphone Voice Input (`AskOrcaView.tsx`)**: Rebuilt the Ask ORCA view into a fully interactive voice and chat application with live microphone speech recognition (`webkitSpeechRecognition` / `SpeechRecognition`) and an animated audio frequency wave visualizer during recording.
- **Equalizer Frequency Wave Bars (`AudioButton.tsx`)**: Upgraded the voice playback button with glowing glassmorphic backdrop tokens (`bg-cyan-950/90 shadow-[0_0_15px_rgba(6,182,212,0.2)]`) and animated equalizer wave bars during audio playback.
- **Interactive Quick Chips & Message Thread**: Added quick prompt chips ("How's weather near Malvan?", "Check IMBL risk for Ratnagiri", "Estimate fuel for 30 km trip") that dispatch queries directly to the backend multi-agent decision engine.

---

## 2. Global Ocean & Harbor Coverage (~50 Ports)

### 2.1 What was added

- **Expanded Global Harbors Catalog (`utils/harbors.ts`)**: Curated ~50 major fishing harbors and deep-sea terminals across Asia, Middle East, Europe, Africa, North America, South America, and Oceania.
- **Global Jump Chip Row (`MarineMapWorkspace.tsx`)**: Tap-to-jump global hotspot bar under the map top bar for instant navigation:
  - 🗾 **Tokyo Bay** (`35.64, 139.78`)
  - 🦘 **Sydney** (`-33.86, 151.20`)
  - 🧊 **Reykjavík** (`64.14, -21.94`)
  - 🇿🇦 **Cape Town** (`-33.92, 18.42`)
  - 🗽 **New York** (`40.68, -74.04`)
  - 🇧🇷 **Rio Grande** (`-32.03, -52.09`)
  - 🇮🇳 **Mumbai** (`18.92, 72.83`)
  - 📍 **Malvan / Goa** (`16.05, 73.46`)
- **Global Coordinates Selector (`Header.tsx`)**: Glassmorphism top bar with global harbor selection dropdown displaying exact Lat/Lon coordinates and regional descriptions.

---

## 3. Interactive Ocean & Hardware Visual Modules

### 3.1 What was added

- **Seabed Bathymetry Sounder (`OceanBathymetryChart.tsx`)**: 2D/3D seabed depth profile ($0 - 200\text{m}$) showing underwater contours, keel clearance calculation (`Depth - Draft`), and real-time grounding warning status.
- **Hydrodynamic Vessel Stability Twin (`VesselStabilityGauge.tsx`)**: Live capsizing roll angle simulator ($\theta_{\text{roll}}$ in degrees), metacentric height ($GZ$) indicator, and seaworthiness threshold gauge ($H_{\text{crit}} = 0.22 \cdot L + 0.05 \cdot B$).
- **ISRO / Copernicus Satellite Overpass Radar (`SatellitePassRadar.tsx`)**: Real-time orbital countdown radar for **INSAT-3DR** (SST Thermal), **Oceansat-3** (Chlorophyll-a OCM-3), and **Sentinel-1** (SAR C-Band Radar).
- **LoRa Telemetry Visualizer (`LoRaPacketVisualizer.tsx`)**: 16-byte bit-packed satellite telemetry payload inspector with bit-field breakdown grid and HMAC-SHA256 cryptographic signature verifier.
- **Integrated into `TodayView.tsx`**: Combined verdict cards, stability gauge, bathymetry chart, satellite radar, LoRa inspector, HSI multi-species matrix, and eco-economic harbor profit optimization into a unified workspace layout.

---

## 4. Phase 02 Marine Operations Map Foundation

### 4.1 Map Reliability & Base Map Enhancements

- **Default Base Map (`LeafletMapContainer.tsx`)**: Switched default base tile map to **OSM Standard** (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`) with robust fallbacks (`Carto Dark`, `Esri Satellite`).
- **ResizeObserver Lifecycle Hook**: Attached a `ResizeObserver` to the Leaflet map container element so layout shifts or tab toggles automatically trigger `map.invalidateSize()` and prevent blank tile rendering.
- **`tileerror` Event Listener**: Implemented custom tile error event listeners to handle network drops gracefully without freezing the map canvas.
- **Real Uber-H3 Grid Renderer (`h3Adapter.ts`)**: Integrated official `h3-js@^4.5.0` for spatial cell indexing, polygon boundary resolution, and ocean risk heatmaps.

---

## 5. Backend Hardening & Multi-Agent Architecture

### 5.1 What was verified & fixed

- **Geographic Alert Scoping (`alerts_service.py`)**: Restricted IMD cyclone stage overrides strictly to the Indian EEZ / Paradip region ($19.5^\circ - 21.0^\circ\text{N}, 85.5^\circ - 87.5^\circ\text{E}$), preventing false cyclone warnings for non-Indian coordinates (Tokyo, Reykjavík, New York, Sydney).
- **Real Open-Meteo Telemetry (`world_model_service.py`)**: Wired ocean SST and wave height data mapping across global coordinates.
- **Inter-Agent Event Bus (`event_bus.py`)**: Asynchronous, typed event pipeline emitting inter-agent messages with confidence ratings and timestamps.
- **Multi-Objective Optimization (`optimization_engine_service.py`)**: Computes 3 Pareto-optimal routes (`SAFEST_DETOUR`, `LOWEST_FUEL`, `HIGHEST_NET_VALUE`).
- **PyTest Suite**: 44/44 backend unit and integration test cases passing (100%).
- **Smoke Tests**: 4/4 power module smoke tests passing (100%).

---

## 6. Verification Summary

| Component | Status | Details |
|---|---|---|
| **Vite Frontend Build** | **PASSED (0 Errors)** | `npm run build` compiled 1,572 modules cleanly into `dist/` |
| **PyTest Suite** | **PASSED (44/44)** | All backend unit, integration, and safety tests passed |
| **Smoke Tests** | **PASSED (4/4)** | Multi-service decision, SAR drift, HSI weights, outlier filter |
| **Frontend Server** | **LIVE (200 OK)** | Running on `http://localhost:5173` |
| **Backend Server** | **LIVE (200 OK)** | Running on `http://localhost:8000` |
| **Git Push** | **UP TO DATE** | Remote `main` updated at `https://github.com/subhamsje/orca.git` |