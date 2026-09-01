# ORCA 4.0 REST & WebSocket API Specification

---

## 📡 REST Endpoints

### 1. Primary Trip Assessment
- **Endpoint**: `POST /api/v1/assess-trip`
- **Description**: Executes the sub-100ms multi-service pipeline for a given coordinate and vessel profile.
- **Request Body**:
```json
{
  "latitude": 16.0215,
  "longitude": 73.4821,
  "vessel_length_m": 8.5,
  "language": "Marathi",
  "query_text": "उद्या सकाळी ६ वाजता मासेमारीसाठी जाणे सुरक्षित आहे का?"
}
```
- **Response**:
```json
{
  "verdict": "SAFE TO VENTURE",
  "risk_score": 28,
  "circuit_breaker_triggered": false,
  "pfz_grounds": [...],
  "species_matrix": {
    "Bangda (Indian Mackerel)": 78,
    "Surmai (Kingfish / Seer Fish)": 71
  },
  "route": {
    "path_type": "Safest Path (A* Geofence & Hazard Detour)",
    "waypoints": [[16.0215, 73.4821], [16.1015, 73.3621]],
    "fuel_consumption_est_liters": 6.4
  },
  "economics": {
    "best_docking_harbor": "Ratnagiri Harbor",
    "max_expected_profit_inr": 16776.35
  },
  "provenance": {
    "satellites": ["INSAT-3DR (SST)", "Oceansat-3 (OCM)", "SCATSAT-1"],
    "ocean_models": ["INCOIS WAVEWATCH III", "ROMS Surface Currents"],
    "data_freshness": "30 minutes ago",
    "confidence_score": 0.94
  }
}
```

---

### 2. Stage Demo Scenario Preset (Dev-Only)
- **Endpoint**: `POST /api/v1/demo/scenario`
- **Description**: Triggers pre-configured stage demo scenarios (`safe`, `danger`, `cyclone`). Requires `ORCA_DEMO_MODE=true`.

---

### 3. Search & Rescue (SAR) Drift Simulator
- **Endpoint**: `POST /api/v1/sar-drift`
- **Description**: Executes 1,000-particle Monte Carlo Search & Rescue particle drift simulation.

---

### 4. Bayesian SAR Mid-Search Sighting Update
- **Endpoint**: `POST /api/v1/sar-sighting-update`
- **Description**: Resamples particle cloud probability toward confirmed mid-search sighting coordinates.

---

### 5. Dark-Fleet SAR vs. AIS Anomaly Radar
- **Endpoint**: `GET /api/v1/authority/anomalies?lat=16.0215&lon=73.4821`
- **Description**: Returns unmatched SAR vessel radar cross-section anomalies. Auth-gated for coastal authority role.

---

## 🔌 WebSocket Communication Channels

### Channel: `/ws/telemetry`
- **Description**: Real-time bidirectional WebSocket channel streaming vessel 16-byte binary telemetry and broadcasting Coast Guard emergency distress alerts.
- **Message Types**:
  - `TRIP_ASSESSMENT`
  - `SAR_DISTRESS_ALERT`
  - `HMAC_TELEMETRY_PACKET`
