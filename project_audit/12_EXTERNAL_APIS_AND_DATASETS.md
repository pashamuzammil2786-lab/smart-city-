# External Data Sources, Datasets & API Integration Audit

**Project:** Smart City Urban Analytics Platform  
**Target City:** Greater Hyderabad, Telangana, India  
**Scope:** Dataset Lineage, Open Data Feeds, Third-Party APIs, and Network Resiliency  

---

## 1. Complete Dataset Inventory & Provenance

The platform incorporates **seven primary datasets** spanning public transit, vehicle traffic, urban meteorology, and environmental air quality:

| # | Dataset Name | Source / Provider | Geographic Scope | File Size | Record Count | Real vs. Synthetic | Utilization in Project |
| :-: | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **1** | **TGSRTC GTFS Schedule Feed** | Open Data Telangana / TGSRTC | Greater Hyderabad & State of Telangana | 10.5 MB (ZIP) | 1,132,807 stop-times<br>44,892 trips<br>1,031 routes | **Real Civic Data** | Ingested into MySQL (`transit_*` tables). Powers the entire transit journey planner. |
| **2** | **Hyderabad Bus Stops Registry** | OpenCity India | Greater Hyderabad | 461 KB | 5,028 stops | **Real Civic Data** | Ingested into `transit_stops`. Powers stop autocomplete, candidate clustering, and coordinates. |
| **3** | **Hyderabad MMTS Rail GTFS** | MobilityDatabase (`mdb-921`) | Hyderabad MMTS Rail Network | 20 KB (ZIP) | 2,354 stop-times<br>54 stations | **Real Civic Data** | Archived in `ml/transport/dataset/mobility_gtfs/`. Reference suburban rail network. |
| **4** | **Historical Transit Ridership** | Open Transit Portal / Kaggle Benchmark | Municipal Transit Network | 323 KB | 9,312 daily records | **Real Benchmark Data** | Used to train the Transport passenger demand forecasting model (`total_rides`). |
| **5** | **Junction Traffic Flow Telemetry** | Kaggle Traffic Prediction Benchmark | 4 Urban Road Junctions | 1.89 MB | 48,120 hourly records | **Real Benchmark Data** | Used to train the Traffic vehicle volume model (`Vehicles`). Mapped to Hyderabad corridors. |
| **6** | **Hyderabad Historical Weather** | Kaggle / WorldWeatherOnline | Hyderabad, India | 11.6 MB | 96,432 hourly records | **Real Civic Data** | 10 years of real hourly observations (2009–2019) used to train the Weather model (`tempC`). |
| **7** | **Hyderabad Urban Air Quality** | Generated via `generate_data.py` | Simulated Hyderabad Sensor Net | 2.04 MB | 26,255 hourly records | **Synthetic Simulation** | 3-year hourly dataset generated via physical models (Zheng et al., Kala et al.) to train SVR model. |

---

## 2. External Third-Party APIs: Reality vs. Simulation Audit

A common ambiguity in smart city academic projects is distinguishing between **live external cloud APIs** and **locally hosted/simulated endpoints**. This audit clarifies the operational reality of every referenced third-party service:

### A. OpenStreetMap Tile Servers (LIVE ACTIVE INTEGRATION)
- **Service:** OpenStreetMap Carto Style Map Tile CDN
- **Endpoint Pattern:** `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Component:** [`frontend/src/components/LeafletMap.jsx`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/frontend/src/components/LeafletMap.jsx)
- **Status:** **Active Live Integration**.
- **Auth & Cost:** Free, open-access, no API key required.
- **Network Dependency:** Requires active internet connection to download cartographic map tiles. If offline, the map renders blank grid tiles while bus stop markers and routes remain positioned by coordinates.
- **Rate Limits:** Subject to standard OpenStreetMap Tile Usage Policy (respectful HTTP User-Agent header).

---

### B. Open-Meteo Weather API (SIMULATED / NOT CALLED LIVE)
- **Status:** **Referenced in code comments, but not invoked at runtime.**
- **Finding:** Code comments in `airQuality.js` mention Open-Meteo as a data source for meteorological dispersion. However, no HTTP request is made to `api.open-meteo.com`.
- **Reality:** Weather telemetry is served from local in-memory profiles (`HYDERABAD_MICROCLIMATES`) and historical models trained on `hyderabad_weather.csv`.

---

### C. CPCB / TSPCB Real-Time Environmental Sensor API (SIMULATED / NOT CALLED LIVE)
- **Status:** **Referenced in code comments, but not invoked at runtime.**
- **Finding:** In `airQuality.js` line 155, the response attributes data to `"CPCB / TSPCB Hyderabad Environmental Sensor Network"`.
- **Reality:** The CPCB Continuous Ambient Air Quality Monitoring Stations (CAAQMS) portal does not offer a free public unauthenticated REST API. The platform implements the **exact official CPCB mathematical equations** in JavaScript using simulated station readings.

---

### D. Google Maps / Real-Time Traffic APIs (NOT USED)
- **Status:** **No proprietary Google Maps Platform or Mapbox APIs are used.**
- **Finding:** The platform uses 100% open-source Leaflet.js with OpenStreetMap. No paid developer accounts, billing credentials, or proprietary API keys are required.

---

## 3. Network Dependency & Offline Resiliency Matrix

| Component / Subsystem | Internet Required? | Local Fallback Behavior if Offline |
| :--- | :---: | :--- |
| **Public Transit Routing** | **NO** | 100% functional offline. All 1.13M GTFS stop-times and stops reside in local MySQL 8.4 database. |
| **Interactive Map Visuals** | **YES** | Map background tiles require internet. Stop pins, lines, and itineraries render regardless of connection. |
| **Authentication & Accounts** | **NO** | 100% functional offline. Uses local MySQL `users` table and local JWT signing. |
| **Traffic Module** | **NO** | 100% functional offline. Express computes corridor metrics and simulations in-memory. |
| **Weather Module** | **NO** | 100% functional offline. Uses local microclimate profiles and physics formulas. |
| **Air Quality Module** | **NO** | 100% functional offline. Implements CPCB sub-index piecewise formulas in-memory. |
| **Academic ML Audit Portal** | **NO** | 100% functional offline. Reads local `ml_performance_audit.json` generated by Python. |

**Summary:** The entire backend API, transit routing engine, simulation tier, and authentication subsystem run **completely offline on `localhost` without any cloud dependencies**. The only component requiring an internet connection is the visual map tile download from OpenStreetMap.
