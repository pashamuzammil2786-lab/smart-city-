# Data Analytics for Smart Cities — Urban Analytics Platform
### *Multi-Domain Predictive Decision Support System for Sustainable Municipal Management*

[![Project Status](https://img.shields.io/badge/Project%20Status-Complete%20%26%20Verified-brightgreen.svg)](#project-status)
[![Degree](https://img.shields.io/badge/Degree-B.Tech%20CSE%202026-blue.svg)](#academic-credits)
[![Institution](https://img.shields.io/badge/Institution-IFHE%20Hyderabad-orange.svg)](#academic-credits)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green.svg)](https://nodejs.org/)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-blue.svg)](https://vitejs.dev/)
[![ML Framework](https://img.shields.io/badge/ML-Python%20%7C%20scikit--learn-yellow.svg)](https://scikit-learn.org/)
[![Database](https://img.shields.io/badge/Database-MySQL%208.4%20LTS-blue.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)](LICENSE)

---

## 📌 Executive Overview

**Data Analytics for Smart Cities** is a full-stack, machine learning-driven urban decision support platform engineered for municipal transit planners, traffic managers, environmental analysts, and city administrators.

While traditional urban dashboards are purely descriptive (displaying historical tables or static sensor readings), this platform introduces a **Hybrid Machine Learning + Analytical Decision Support Architecture** across four vital civic domains:
1. **Public Transportation**: GTFS-based multi-leg transit journey discovery coupled with Random Forest ridership demand forecasting.
2. **Traffic Flow & Congestion**: Gradient Boosting junction vehicle volume forecasting paired with arterial travel time simulation.
3. **Urban Microclimate & Weather**: Diurnal ambient temperature prediction using Linear Regression alongside spatial Urban Heat Island (UHI) mapping.
4. **Air Quality (NAQI)**: Piecewise-linear CPCB statutory index calculation combined with 1-hour ahead Support Vector Regressor (SVR) forecasts.

All features are grounded in open municipal datasets with a geographic focus on **Hyderabad, Telangana, India**.

---

## 🏛 Academic Credits

* **Institution**: Faculty of Science & Technology, The ICFAI Foundation for Higher Education (IFHE), Hyderabad
* **Degree**: Bachelor of Technology in Computer Science & Engineering
* **Academic Year**: 2026
* **Project Supervisor**: Prof. Surya Samantha
* **Student Development Team**:
  * **Mohammed Muzammil Pasha** (Roll No: `24STUCHH010218`)
  * **Laskar Varshini Reddy** (Roll No: `24STUCHH010879`)
  * **Navkar Gelda Jain** (Roll No: `24STUCHH010202`)
  * **Mohith Madarapu** (Roll No: `24STUCHH010916`)

---

## 🏗 System Architecture

The platform uses a three-tier, decoupled microservice architecture ensuring sub-50ms analytical response times and fault-tolerant inference:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   CLIENT APPLICATION LAYER (PORT 5173)                 │
│         React 18 + Vite SPA • Leaflet GIS • Recharts Analytics         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST / JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   BACKEND API GATEWAY (PORT 5000)                      │
│        Node.js + Express • JWT Auth (bcrypt) • MySQL Connection Pool   │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │                               │
        SQL Queries │ (Port 3306)      HTTP Bridge  │ (Port 5001)
                    ▼                               ▼
┌───────────────────────────────┐   ┌────────────────────────────────────┐
│      DATABASE TIER            │   │      PERSISTENT ML DAEMON          │
│   MySQL 8.4 LTS               │   │   Python / Flask In-Memory Cache   │
│   - Users & Sessions          │   │   - Transport: Random Forest       │
│   - Transit Routes & Trips    │   │   - Traffic: Gradient Boosting     │
│   - Stops & Stop Times        │   │   - Weather: Linear Regression     │
│   - Composite B-Tree Indexes  │   │   - Air Quality: SVR (RBF Kernel)  │
└───────────────────────────────┘   └─────────────────┬──────────────────┘
                                                      │ (Automatic Fallback
                                                      │  if daemon offline)
                                                      ▼
                                    ┌────────────────────────────────────┐
                                    │     SUBPROCESS CLI FALLBACK        │
                                    │  python unified_inference_service  │
                                    └────────────────────────────────────┘
```

---

## 📊 Reconciled Machine Learning Evaluation Metrics

All models were evaluated using **strict chronological 80/20 train/test splitting** on unseen held-out test data (without random shuffling to completely prevent temporal data leakage):

| Module | Algorithm | Prediction Target | Test Samples | $R^2$ Score | MAE | RMSE | MAPE | Baseline Comparison |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Transport** | Random Forest Regressor (100 Trees) | Daily Transit Demand (`total_rides`) | 1,857 days | **0.6413** | 105,570.74 | 135,231.47 | 14.32% | Beats Mean Baseline ($R^2 = -5.26$) |
| **Traffic** | Gradient Boosting Regressor | Hourly Junction Flow (`Vehicles`) | 9,624 hours | **0.9684** | 2.93 veh/hr | 4.84 veh/hr | 17.33% | Beats Junction Mean ($R^2 = -1.21$) |
| **Weather** | Linear Regression Pipeline | Ambient Temp (`tempC`) | 19,287 hours | **0.9894** | 0.41 °C | 0.53 °C | 1.51% | Beats 1-Hr Persistence (RMSE $0.87^\circ\text{C}$) |
| **Air Quality** | Support Vector Regressor (SVR RBF) | 1-Hr Ahead Index (`AQI`) | 5,251 hours | **0.7742** | 20.89 pts | 27.30 pts | 32.13% | Beats 1-Hr Persistence ($R^2 = 0.5208$) |

> **Methodological Note on MAPE**: In Air Quality evaluation, MAPE is sensitive to near-zero background pollutant values. RMSE and MAE remain the primary CPCB-approved metrics.

---

## ⚡ Rigorous Latency Benchmarks (100 Iterations)

Measured across strictly defined physical execution boundaries on local host:

| Module | Model Architecture | Python Model Predict | Full Python Function | Daemon HTTP Turnaround | Express Complete API | Express Overhead |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Traffic** | Gradient Boosting Regressor | 3.44 ms | 6.42 ms | 12.68 ms | **14.85 ms** | 2.17 ms |
| **Weather** | Linear Regression Pipeline | 0.31 ms | 5.92 ms | 12.35 ms | **14.02 ms** | 1.66 ms |
| **Air Quality** | Support Vector Regressor (SVR) | 9.51 ms | 11.92 ms | 20.70 ms | **22.00 ms** | 1.30 ms |
| **Transport** | Random Forest (7-Day Forecast) | 77.47 ms / step | 666.32 ms | 794.23 ms | **917.63 ms** | 123.40 ms |

---

## 🚍 Public Transport GTFS Routing Validation

The GTFS routing engine evaluates physical route topologies and eliminates artifacts from uncurated multi-shift bus duty rotations (e.g. earlier 1,000+ minute errors):

| Origin | Destination | Scheduled Time | Predicted Delay | Total Journey Time | Type | Stops | Route / Bus No. |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Mehdipatnam** | **Dondanpally** | 86 min | +3 min | **89 min** | Direct | 21 | Route 505 |
| **Mehdipatnam** | **ISB (Gachibowli)** | 89 min | +3 min | **92 min** | Direct | 22 | Route 505 |
| **Shaikpet** | **ISB (Gachibowli)** | 80 min | +5 min | **85 min** | Transfer (1) | 16 | 65M/123 ➔ 505 (Wait: 6m) |
| **Charminar** | **Afzalgunj** | 12 min | +1 min | **13 min** | Direct | 6 | Route 9Y/F |
| **Secunderabad** | **Mehdipatnam** | 27 min | +2 min | **29 min** | Direct | 7 | Route AC |
| **Koti** | **Dilsukhnagar** | 8 min | +1 min | **9 min** | Direct | 3 | Route 443 |

---

## 📁 Repository Organization

```text
smart-city-urban-analytics/
├── backend/
│   ├── routes/              # Express API route controllers (transport, traffic, weather, airQuality, auth)
│   ├── services/            # routingService.js (GTFS) & mlInferenceService.js (Daemon + CLI Fallback)
│   ├── tests/               # Automated test suites (routing, audit, live ML integration, key journeys)
│   ├── data/                # Audited performance matrices and residual distributions
│   ├── db.js                # MySQL2 connection pool configuration
│   ├── server.js            # Express application entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI widgets (Navbar, LeafletMap, ErrorBoundary)
│   │   ├── pages/           # Dashboard, Transport, Traffic, Weather, AirQuality, Auth, Performance
│   │   ├── services/        # Centralized Axios API client
│   │   ├── App.jsx          # Route configuration and authentication guard
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── ml/
│   ├── transport/           # Random Forest demand model, dataset, and training scripts
│   ├── traffic/             # Gradient Boosting junction flow model and training scripts
│   ├── weather/             # Linear Regression microclimate pipeline and dataset
│   ├── air_quality/         # SVR CPCB NAQI forecasting pipeline and dataset
│   ├── unified_inference_service.py # Persistent HTTP inference daemon + CLI fallback
│   └── audit_all_models.py  # Standalone 4-module evaluation and metrics generator
│
├── database/
│   ├── schema.sql           # MySQL tables (users, transit_stops, routes, trips, stop_times)
│   └── migrations/          # Composite performance index migrations
│
├── final_submission/
│   ├── Smart_City_Urban_Analytics_Final_Report.docx  # Full 7-chapter B.Tech Major Project Report
│   ├── Smart_City_Urban_Analytics_Final_Report.pdf   # 55-Page submission-ready PDF
│   ├── Smart_City_Urban_Analytics_Presentation.pptx # Exact 20-slide committee defense presentation
│   └── PROJECT_DEMO_GUIDE.md                        # Step-by-step oral demonstration guide
│
├── scripts/                 # Automation and document generation scripts
│   ├── generate_presentation.py
│   ├── update_report_docx.py
│   └── archive/             # Earlier generation artifacts
│
├── project_fix_report/      # Engineering audit reports (01 to 15)
├── PROJECT_DEMO_GUIDE.md    # Quick-access demonstration manual
├── .env.example             # Safe environment variable template
├── .gitignore
├── LICENSE                  # MIT License
└── README.md
```

---

## 🚀 Quickstart & Demonstration Guide

### Prerequisites
* **Node.js**: v18+ or v20+ LTS
* **Python**: v3.10, v3.11, or v3.12 (with `scikit-learn`, `pandas`, `numpy`, `joblib`, `flask`)
* **MySQL**: 8.4 LTS on local port 3306

---

### Step 1: Database Setup
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS smart_city_db;"
mysql -u root -p smart_city_db < database/schema.sql
mysql -u root -p smart_city_db < database/migrations/add_composite_index.sql
```

Create a `.env` file in the root directory (based on `.env.example`):
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smart_city_db
PORT=5000
NODE_ENV=development
JWT_SECRET=sc_urban_analytics_sec_2026_jwt_token_auth_9f8e7d6c5b4a3a2b1c0d
```

---

### Step 2: Launch the 3 System Terminals

#### Terminal 1: Python Persistent ML Inference Daemon
```powershell
cd smart-city-urban-analytics
python ml/unified_inference_service.py --serve --port 5001
```
*Port:* `http://127.0.0.1:5001` (Pre-loads all 4 models into memory)

#### Terminal 2: Node.js / Express Backend API
```powershell
cd smart-city-urban-analytics/backend
npm install
npm start
```
*Port:* `http://localhost:5000`

#### Terminal 3: React / Vite Frontend Application
```powershell
cd smart-city-urban-analytics/frontend
npm install
npm run dev
```
*Port:* `http://localhost:5173`

---

## 🧪 Automated Testing & Verification

Run the test suites to independently verify all system components:

```powershell
# 1. Transport GTFS Routing Engine (12 Scenarios)
node backend/tests/test_transport_routing.js

# 2. Transport Reference Journeys Audit (7 Cases)
node backend/tests/test_transport_audit.js

# 3. Live 4-Module ML Integration (27 Assertions)
node backend/tests/test_live_ml_integration.js

# 4. Quick Reference Journeys Verification (6 Benchmark Pairs)
node backend/tests/test_key_journeys.js

# 5. Frontend Production Build Verification
cd frontend && npm run build
```

---

## 📜 Academic Deliverables

All final submission artifacts are located in [`final_submission/`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/final_submission/):
1. **B.Tech Special Project Final Report (Word)**: [`Smart_City_Urban_Analytics_Final_Report.docx`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/final_submission/Smart_City_Urban_Analytics_Final_Report.docx) (409 paragraphs, 20 tables)
2. **B.Tech Special Project Final Report (PDF)**: [`Smart_City_Urban_Analytics_Final_Report.pdf`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/final_submission/Smart_City_Urban_Analytics_Final_Report.pdf) (55 pages)
3. **Capstone Committee Presentation**: [`Smart_City_Urban_Analytics_Presentation.pptx`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/final_submission/Smart_City_Urban_Analytics_Presentation.pptx) (Exactly 20 slides)
4. **Live Project Demo Guide**: [`PROJECT_DEMO_GUIDE.md`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/PROJECT_DEMO_GUIDE.md)
