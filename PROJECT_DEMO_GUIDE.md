# Smart City Urban Analytics Platform — Live Project Demonstration Guide
**Document ID:** `final_submission/PROJECT_DEMO_GUIDE.md`  
**Project Title:** Data Analytics for Smart Cities — Urban Analytics and Predictive Decision Support Platform  
**Target:** Final-Year B.Tech Capstone Defense, University Project Competition, and Technical Review  
**Institution:** Faculty of Science & Technology, The ICFAI Foundation for Higher Education (IFHE), Hyderabad  
**Academic Year:** 2026  

---

## 1. Demonstration Overview & Objectives

This guide provides an end-to-end operational script for presenting the **Smart City Urban Analytics Platform** to academic examiners, evaluation committees, and technical juries. It details:
* The exact sequence of commands to boot the multi-tier platform.
* Dynamic account creation and login workflows.
* Step-by-step feature walkthroughs across all four civic domains.
* Concrete reference test inputs and expected output values.
* Live machine learning model inspection.
* Troubleshooting protocols and offline contingency measures.

---

## 2. System Startup Sequence (3 Terminals)

Ensure MySQL 8.4 service is running locally (`MySQL84` Windows Service on port 3306).

### Terminal 1: Launch Persistent Python ML Inference Daemon (Port 5001)
```powershell
cd C:\Users\dell\Desktop\smart-city-urban-analytics
python ml/unified_inference_service.py --serve --port 5001
```
* **Expected Output:**
  ```text
  Starting Smart City Unified ML Inference Daemon on http://127.0.0.1:5001...
  Loading models into persistent memory...
    - Transport demand model loaded (Random Forest Regressor)
    - Traffic model loaded (Gradient Boosting Regressor)
    - Weather model loaded (Linear Regression Pipeline)
    - Air Quality model loaded (SVR RBF Kernel)
  * Running on http://127.0.0.1:5001 (Press CTRL+C to quit)
  ```

### Terminal 2: Launch Node.js / Express Backend API (Port 5000)
```powershell
cd C:\Users\dell\Desktop\smart-city-urban-analytics\backend
npm start
```
* **Expected Output:**
  ```text
  ======================================================================
  🚀 Smart City Backend API listening on http://localhost:5000
  📡 Transport API: http://localhost:5000/api/transport
  📡 ML Engine:    http://localhost:5000/api/ml/health
  🔐 Auth API:      http://localhost:5000/api/auth
  ======================================================================
  [MySQL] Successfully connected to database: smart_city_db
  ✅ Python ML Inference Daemon ready (all 4 models loaded into memory)
  ```

### Terminal 3: Launch React / Vite Frontend Application (Port 5173)
```powershell
cd C:\Users\dell\Desktop\smart-city-urban-analytics\frontend
npm run dev
```
* **Expected Output:**
  ```text
    VITE v5.4.21  ready in 450 ms
    ➜  Local:   http://localhost:5173/
    ➜  Network: use --host to expose
  ```

---

## 3. Live Demonstration Workflow (Step-by-Step)

### Step 1: Open the Application & Create a Demo Account
1. Open your browser and navigate to `http://localhost:5173`.
2. Click **"Sign Up"** or **"Get Started"** on the landing page.
3. Enter dynamic credentials (e.g. `Evaluator`, `evaluator@icfai.ac.in`, `Pass1234!`).
4. Click **"Create Account"**. The application generates a secure bcrypt hash (10 salt rounds), issues an HS256 JWT session token, and navigates into the unified dashboard.
5. **Key Talking Point:** Show that authentication is backed by real MySQL storage in the `users` table, not hardcoded frontend state.

---

### Step 2: Unified Command Dashboard Overview
1. Point out the top status badge: `● 4 Live City Modules Active • Hybrid ML Connected`.
2. Walk through the 4 navigation cards:
   * **1. Public Transport:** GTFS Multi-Leg & 7-Day Demand ML (Random Forest).
   * **2. Weather & Climate:** Microclimate & Urban Heat Index (Linear Regression, 6 zones).
   * **3. Traffic Flow & Congestion:** Junction Vehicles & Arterial Delays (Gradient Boosting, 8 corridors).
   * **4. Air Quality (NAQI):** CPCB Statutory Index & 1-Hr Forecast (SVR RBF, 6 stations).

---

### Step 3: Module 1 — Public Transport Demonstration

#### 3.1 Resolving the Former 1,000+ Minute Bug (Mehdipatnam → Dondanpally)
1. In the **Origin** field, type `Mehdipatnam`. Point out the auto-complete search.
2. In the **Destination** field, type `Dondanpally`.
3. Click **"Find Transit Routes"**.
4. **Demonstrate Verified Realistic Output:**
   * **Scheduled In-Vehicle Duration:** **86 mins** (Route 505, 21 stops, 28.7 km).
   * **Expected Traffic Delay:** **+3 mins**.
   * **Total Estimated Journey Time:** **89 mins**.
   * **Calculation Source:** `Estimated Route Duration (Calibrated Transit Model)`.
   * **Key Talking Point:** Explain how the 1,000+ minute bug was caused by naive modulo math on GTFS service times extending past 24:00:00 and uncurated driver shift blocks. Our engine detects these blocks and applies calibrated urban physics ($1.28\times$ circuity, 16–24 km/h).

#### 3.2 Demonstrating Multi-Leg Transfer Route Discovery (Shaikpet → ISB)
1. Enter Origin: `Shaikpet`, Destination: `ISB`.
2. Click **"Find Transit Routes"**.
3. **Demonstrate Transfer Itinerary:**
   * **Leg 1:** Route 65M/123 to Mehdipatnam interchange.
   * **Interchange:** Mehdipatnam Bus Station (Transfer buffer: **6 mins**).
   * **Leg 2:** Route 505 from Mehdipatnam to ISB.
   * **Total Journey Duration:** **85 mins** (Scheduled: 80m + Delay: 5m = 85m).
   * **Interactive Map:** Click on the route to display intermediate stops and polyline on the Leaflet map.

#### 3.3 Demonstrating 7-Day Live ML Passenger Demand Forecast
1. Scroll down to the **"Live ML Passenger Demand Forecast (7-Day Network Model)"** grid.
2. Explain the Random Forest model ($R^2 = 0.6413, \text{MAPE} = 14.32\%$).
3. Highlight how the model projects ~1.04M boardings on Sunday (weekend dip of -13.5%) and spikes to ~1.28M boardings on Monday rush hour (+6.9%).
4. **Key Talking Point:** Emphasize the architectural separation: macro demand forecasting is completely decoupled from individual bus route durations.

---

### Step 4: Module 2 — Weather Intelligence & Urban Heat Island (UHI)

1. Click on the **"Weather & Climate"** tab.
2. Point out the top overview badge: `Live ML Predicted Temp: 41.1°C • Linear Regression Pipeline (R² = 0.9894)`.
3. Scroll to the **"Live ML Microclimate Temperature Predictor"** interactive tool.
4. Set inputs:
   * **Hour of Day:** `14` (2:00 PM peak diurnal solar heating).
   * **Month:** `5` (May summer peak).
   * **Relative Humidity:** `45%`.
   * **Dew Point:** `18°C`.
5. Click **"Run Live ML Temperature Inference"**.
6. **Expected Output:**
   * **Predicted Dry-Bulb Temperature:** **41.1°C**.
   * **Apparent Feels-Like Temperature:** **46.3°C** (Severe Heat Warning).
   * **Zone UHI Differentials:** Charminar (+3.8°C $\to$ 44.9°C), HITEC City (+2.4°C $\to$ 43.5°C), Shamshabad (0.0°C baseline $\to$ 41.1°C).
7. **Key Talking Point:** The ML model predicts base thermodynamic temperature from atmospheric sensors; urban spatial heat island offsets are computed analytically.

---

### Step 5: Module 3 — Traffic Flow & Arterial Congestion

1. Click on the **"Traffic Flow"** tab.
2. Review the top KPI cards: City Congestion Index, Average Arterial Speed, Active Bottlenecks.
3. Scroll to the **"What-If Scenario Congestion Simulator"** form.
4. Set parameters:
   * **Corridor:** `PVNR Elevated Expressway`.
   * **Hour:** `18` (6:00 PM evening peak).
   * **Weather Condition:** `Light Rain / Waterlogging` (+25% delay penalty).
   * **Incident Severity:** `Minor Roadside Stall` (+20% delay penalty).
5. Click **"Predict Scenario Traffic"**.
6. **Expected Output:**
   * **Live ML Model Prediction (Gradient Boosting — traffic_model.pkl):**
     - Target: `Vehicles` = **81 vehicles/hour** at junction sensor.
     - Level of Service: **LOS C (Stable Flow)**.
     - Congestion Percentage: **67%**.
   * **Analytical Corridor Travel Time:**
     - Corridor Delay: **14 mins**.
     - Travel Time: **27.1 mins**.
     - LOS: **D (Heavy Congestion)**.
7. **Key Talking Point:** Demonstrates the hybrid architecture: junction point sensors are predicted by ML, while arterial corridor delays are simulated via multi-factor physics.

---

### Step 6: Module 4 — Air Quality (NAQI) & SVR Prediction

1. Click on the **"Air Quality (AQI)"** tab.
2. Show the city monitoring stations (Sanathnagar, Punjagutta, Charminar, etc.).
3. Point out the statutory CPCB NAQI calculation badge: `Statutory CPCB NAQI Piecewise Linear Formula`.
4. Scroll to the **"Live Interactive Scenario Simulator"**.
5. Set parameters:
   * **PM2.5:** `55` $\mu\text{g/m}^3$.
   * **PM10:** `110` $\mu\text{g/m}^3$.
   * **Hour:** `18`.
   * **Temperature:** `28°C`.
6. Click **"Predict Scenario Air Quality"**.
7. **Expected Output:**
   * **Current CPCB NAQI:** **110 (Moderate)**, Prominent pollutant: PM10.
   * **1-Hour Ahead SVR ML Forecast:** **115.7 (Moderate)**.
   * **Model Attribution:** `Support Vector Regressor (SVR RBF Kernel, R² = 0.7742)`.
   * **Actionable Health Advisory:** Masks recommended for sensitive individuals; outdoor exertion restricted.
8. **Key Talking Point:** Clarify that real-time AQI uses official Indian statutory CPCB breakpoints, while the 1-hour ahead predictive horizon is generated by the SVR machine learning model.

---

### Step 7: Research & Model Audit Portal

1. Navigate to `http://localhost:5173/model-performance`.
2. Show the audited 4-module performance benchmark table comparing $R^2$, MAE, RMSE, and MAPE across all algorithms.
3. Show the live ML engine status verification (`/api/ml/health`).

---

## 4. Key Reference Test Cases Summary Table

```
┌────┬─────────────────────────────┬─────────────────────────────────────────────────┬───────────────────────────────┐
│ ID │ Test Case / Feature         │ Input Parameters                                │ Expected Verified Output      │
├────┼─────────────────────────────┼─────────────────────────────────────────────────┼───────────────────────────────┤
│ 1  │ Former 1,000+ min Bug Fix   │ Origin: Mehdipatnam, Dest: Dondanpally          │ Sched: 86m + Delay: 3m = 89m  │
│ 2  │ Outer Corridor Transit      │ Origin: Mehdipatnam, Dest: ISB                  │ Sched: 89m + Delay: 3m = 92m  │
│ 3  │ 1-Transfer Multi-Leg Route  │ Origin: Shaikpet, Dest: ISB                     │ Sched: 80m + Delay: 5m = 85m  │
│ 4  │ Short Inner-City Transit    │ Origin: Charminar, Dest: Afzalgunj              │ Sched: 12m + Delay: 1m = 13m  │
│ 5  │ Cross-City Arterial Route   │ Origin: Secunderabad, Dest: Mehdipatnam         │ Sched: 27m + Delay: 2m = 29m  │
│ 6  │ Direct TGSRTC Timetable     │ Origin: Koti, Dest: Dilsukhnagar                │ Sched: 8m + Delay: 1m = 9m    │
│ 7  │ Transport ML Ridership      │ GET /api/transport/forecast?horizon_days=7      │ 7-day projection; RF R²=0.64  │
│ 8  │ Traffic Junction ML         │ POST /api/traffic/predict (PVNR Exp, 18:00)     │ 81 veh/hr, LOS C; GB R²=0.97  │
│ 9  │ Weather Temp Predictor      │ POST /api/weather/predict-temperature (14:00)   │ 41.1°C, feels 46.3°C; R²=0.99 │
│ 10 │ Air Quality SVR Horizon     │ POST /api/air-quality/predict (PM2.5=55)        │ SVR AQI: 115.7; R²=0.77       │
└────┴─────────────────────────────┴─────────────────────────────────────────────────┴───────────────────────────────┘
```

---

## 5. Offline Demonstration & Contingency Protocol

If live internet connectivity is lost during the demonstration:
1. **Fully Self-Contained:** The entire platform runs locally on `localhost`. All GTFS timetables (1.13M records), weather datasets (96k rows), air quality logs (26k rows), and traffic detectors (48k rows) reside within the local MySQL 8.4 database and local model `.pkl`/`.joblib` files.
2. **Persistent Daemon Reliability:** The ML daemon runs on `127.0.0.1:5001`. If it is ever terminated accidentally, `services/mlInferenceService.js` automatically catches the connection failure and spawns the CLI subprocess seamlessly.
3. **Map Tiles Fallback:** The Leaflet map component contains built-in vector fallback renderers if OpenStreetMap tile fetching times out.
4. **Pre-Rendered Verification Screenshots:** All verified screenshots and JSON dumps are stored in `project_fix_report/06_TEST_RESULTS.md` and `project_fix_report/10_LIVE_ML_INTEGRATION_ARCHITECTURE.md`.
