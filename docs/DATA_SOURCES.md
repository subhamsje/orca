# ORCA 4.0 Data Sources, Spatial/Temporal Resolutions & Hardware RF Specifications

---

## 📡 External Data Source Taxonomy

| Data Source / Provider | Parameters Provided | Spatial / Temporal Resolution | Access Method | Production Status |
| :--- | :--- | :--- | :--- | :--- |
| **Open-Meteo Marine API** | Significant Wave Height ($H_s$), Swell Period, Ocean Currents | $0.083^\circ$ (~9 km) / Hourly steps | REST JSON API | **LIVE PRODUCTION** |
| **Open-Meteo Forecast API** | Surface Winds (10m), Gust Velocities, Precipitation | $0.1^\circ$ (~11 km) / Hourly steps | REST JSON API | **LIVE PRODUCTION** |
| **INSAT-3DR / 3DS Imager** | Sea Surface Temperature (SST) | $4\text{ km} \times 4\text{ km}$ at nadir / 1–3 hour composite | MOSDAC Data Ingestion | **LIVE MODEL COMPOSITE** |
| **Oceansat-3 OCM-3** | Ocean Color & Chlorophyll-a | $360\text{m}$ spatial / 2-day repeat pass | MOSDAC Data Ingestion | **CLOUD-FREE COMPOSITE** |
| **INCOIS WAVEWATCH III** | Wave Spectrum & Sea State | $0.125^\circ$ (~14 km) / 3-hour steps | Operational Model Assimilation | **LIVE MODEL ASSIMILATION** |
| **Sentinel-1 C-Band SAR** | Vessel Radar Cross-Section Detections | $20\text{m}$ spatial / 6–12 day revisit cycle | Mock Interface (`dark_fleet_service`) | **DOCUMENTED MOCK INTERFACE** |
| **AIS Base Station Feed** | Vessel Transponder MMSI & Coordinates | Real-time broadcast / Point stations | Mock Interface (`dark_fleet_service`) | **DOCUMENTED MOCK INTERFACE** |

---

## 📻 LoRa Radio Horizon Engineering Math

### Single-Hop Line-of-Sight Equation:
$$d_{\text{horizon}} \approx 3.57 (\sqrt{h_1} + \sqrt{h_2}) \text{ km}$$

### Physical Range Evaluation:
- For two small artisanal fishing boats ($h_1 = 3\text{m}, h_2 = 3\text{m}$):
  $$d_{\text{horizon}} = 3.57 (\sqrt{3} + \sqrt{3}) \approx 12.37\text{ km}$$

- For a small boat ($h_2 = 3\text{m}$) communicating with a coastal lighthouse mast tower ($h_1 = 60\text{m}$):
  $$d_{\text{horizon}} = 3.57 (\sqrt{60} + \sqrt{3}) \approx 33.8\text{ km}$$

### How 30–50 km Offshore Reach is Achieved:
Claiming single-hop 30–50 km boat-to-boat LoRa range violates optical radio horizon physics. In ORCA 4.0, **30–50 km coverage is achieved as an emergent property of a Multi-Hop Ad-Hoc LoRa Fleet Mesh (OLSR/BATMAN protocol)**, where fishing craft spaced 3–8 km apart relay 16-byte binary packets across the fleet to coastal lighthouse towers.
