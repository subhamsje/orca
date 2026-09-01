# ORCA: Marine EcOsystem Reasoning with Collaborative Agents
> **Problem Statement ID**: SIH26176 | **Sponsoring Agency**: Indian Space Research Organisation (ISRO)

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-1E5F7A?style=for-the-badge&logo=rocket)](https://sih.gov.in)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Offline First](https://img.shields.io/badge/PWA-Offline%20First-1D7A50?style=for-the-badge)](https://web.dev/pwa)

---

## 🌊 Overview

**ORCA (SIH26176)** is an offline-first, multilingual, vessel-aware Marine Operating System & Economic Decision Platform developed for traditional and commercial fishermen along India's 7,500+ km coastline.

By fusing **ISRO Oceansat-3/INSAT-3DR satellite bio-physics**, **operational ocean numerical models (WAVEWATCH III/ROMS)**, **live wholesale market pricing**, **vessel digital twin hydrodynamics**, and **deterministic safety circuit breakers**, ORCA delivers one clear, safe, and explainable decision in the fisherman's native dialect.

---

## 🔑 Core Capabilities

- **🤖 Honest Multi-Service Microservice Architecture**: Sub-100ms concurrent data pipeline using Python `asyncio.gather` with strict separation between deterministic safety code and conversational voice LLMs.
- **🛡️ Deterministic Safety Circuit Breaker**: Hard-coded safety override logic. Official IMD cyclone advisories or wave heights breaching capsizing limits ($H_s > 0.6 \times L_{\text{vessel}}$) unconditionally trigger an **EXTREME DANGER OVERRIDE**.
- **💰 Eco-Economic Trip Optimizer**: Calculates expected net return: $\text{Net Profit} = (\text{Catch Prob} \times \text{Weight} \times \text{Price}) - \text{Fuel Cost} - \text{Risk Penalty}$.
- **🗺️ Weather-Routing A* Navigator**: Cost-weighted pathfinding over a dynamic spatial ocean grid, calculating safe routes that detour around naval exercise zones and keep 5 km clear of the **International Maritime Boundary Line (IMBL)**.
- **🗣️ Multilingual Voice-First UI**: Voice input/output supporting **Marathi (Koli/Malvani), Hindi, Gujarati, Tamil, and English** with plain-language physical descriptions (*"Waves knee-high"*).
- **📡 Offline-First PWA Storage**: Pre-downloads a 72-hour sector forecast bundle (~500 KB) into IndexedDB, allowing complete off-grid navigation 40+ km offshore.
- **🛰️ 16-Byte Binary Packet Serialization**: Ultra-compact binary protocol for deep-sea transmission over ISRO Nabhmitra / GEMINI transceivers or 868 MHz LoRa fleet radio mesh.

---

## 🏗️ Architecture Blueprint

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              LAYER 1: USER INTERFACE & PWA                             │
│ • React 18 PWA Shell    • Native Voice Assistant (mr-IN/hi-IN/en) • Deck.gl Currents   │
│ • Service Worker Cache  • IndexedDB Forecast Store             • One-Tap Audio Cards   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                     LAYER 2: EDGE & HYBRID COMMUNICATION BRIDGE                        │
│ • WebBluetooth Adapter  • WebSerial Transceiver Bridge • 16-Byte Binary Packet Encoder│
│ • P2P LoRa Mesh Relay   • Cellular 4G/5G REST Client   • Off-Grid Hardware Interface  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                     LAYER 3: MULTI-SERVICE ORCHESTRATION ENGINE                        │
│ • Ocean Ingestion       • Weather & Wave Ingestion     • IMD Disaster Alerts Ingestion │
│ • Multi-Variate HSI     • GIS Geofence Inspector       • Deterministic Safety Evaluator│
│ • Weather A* Navigator  • Multilingual NLG Synthesizer • Asyncio Parallel Fan-Out      │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                    LAYER 4: DETERMINISTIC PHYSICS & GIS ENGINES                        │
│ • Uber H3 Spatial Index (Res 7 ~1.2km²)                • 2D Sobel Thermal Front Filter  │
│ • Deterministic Safety Circuit Breaker                 • Cost-Weighted A* Pathfinding   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 2. Run with One Command
```bash
chmod +x start-orca.sh
./start-orca.sh
```

Or start backend and frontend manually:

#### Backend:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```

App will open at: **`http://localhost:5173`** (Backend API at **`http://localhost:8000`**).

---

## 🧪 Interactive Stage Demo Deep Links

Test these pre-configured scenarios directly in your browser:

- **Safe Scenario (Goa)**: `http://localhost:5173/?demo=safe` (Calm seas, 10/100 risk score, clear departure verdict).
- **Hazard Scenario (Mumbai)**: `http://localhost:5173/?demo=danger` (High swell, 75/100 risk, Marathi audio warning).
- **Cyclone Circuit Breaker (Paradip)**: `http://localhost:5173/?demo=cyclone` (Simulated cyclone alert triggering **EXTREME DANGER OVERRIDE**).
- **IMBL Detour Routing**: `http://localhost:5173/?demo=route` (A* pathfinding detouring around restricted naval geofences).

---

## 📄 License & Attribution
Developed for the **Smart India Hackathon (SIH 2026)** under the sponsorship of **ISRO (Department of Space)** and data coordination with **INCOIS** and **IMD**.