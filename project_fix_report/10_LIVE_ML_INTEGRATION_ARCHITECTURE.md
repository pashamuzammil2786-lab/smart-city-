# Smart City Urban Analytics Platform — Live Machine Learning Integration Architecture
**Document ID:** `project_fix_report/10_LIVE_ML_INTEGRATION_ARCHITECTURE.md`  
**Project:** Data Analytics for Smart Cities — Urban Analytics and Predictive Decision Support Platform  
**Target Submission:** Final Year B.Tech Special Project / Technical Audit  
**Date of Verification:** November 2026  
**Status:** FULLY INTEGRATED AND VERIFIED (27/27 Automated Tests Passed)

---

## 1. Executive Summary & Architectural Overview

The **Data Analytics for Smart Cities** platform has been upgraded to a fully integrated **Hybrid Machine Learning + Analytical Decision-Support Architecture**. All four independently trained and evaluated machine learning models are now active within live backend Express API workflows and exposed through the React/Vite user interface.

Crucially, this integration preserves the strict academic and mathematical decoupling between statistical machine learning predictions and physical/statutory deterministic calculations:
* **Transport:** Transit ridership demand forecasting ($R^2 = 0.6413$) is decoupled from GTFS timetable routing and physical bus travel durations.
* **Traffic:** Junction vehicle flow prediction ($R^2 = 0.9684$) is decoupled from corridor multi-factor congestion delay simulation.
* **Weather:** Ambient dry-bulb temperature regression ($R^2 = 0.9894$) is decoupled from urban heat island (UHI) microclimate differentials.
* **Air Quality:** 1-hour ahead SVR forecast ($R^2 = 0.7742$) is decoupled from official Central Pollution Control Board (CPCB) statutory NAQI sub-index calculations.

```
+---------------------------------------------------------------------------------------+
|                                    REACT / VITE UI                                    |
|   Transport.jsx          Traffic.jsx             Weather.jsx          AirQuality.jsx  |
|  - 7-Day ML Demand    - Live ML Junction Flow - Live ML Temp Tool  - 1-Hr SVR Forecast|
|  - GTFS Route Plan    - Corridor Simulation   - Zone UHI Engine    - CPCB Current AQI |
+-------------------------------------------+-------------------------------------------+
                                            | HTTP (JSON / REST)
                                            v
+---------------------------------------------------------------------------------------+
|                                NODE.JS / EXPRESS BACKEND                               |
|   routes/transport.js    routes/traffic.js       routes/weather.js    routes/airQuality.js
|                                           |
|                                           v
|                           services/mlInferenceService.js                              |
|                       (Dual-Engine Bridge with Fallback)                              |
+---------------------+-------------------------------------+---------------------------+
                      |                                     |
    [Primary Mode: Persistent Memory]            [Secondary Mode: Subprocess Fallback]
    HTTP POST (Port 5001, < 10ms)                 CLI: python unified_inference_service.py
                      |                                     |
                      +------------------+------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------------+
|                   PYTHON ML ENGINE: ml/unified_inference_service.py                   |
|                                                                                       |
|   [Transport Model]           [Traffic Model]         [Weather Model]   [AQI Model]   |
|   Random Forest Regr.         Gradient Boosting Regr. Linear Reg. Pipe  SVR RBF       |
|   transport_demand_model.pkl  traffic_model.pkl       weather_model.pkl aqi_model.joblib
|   Target: total_rides         Target: Vehicles        Target: tempC     Target: AQI   |
|   R²: 0.6413, MAPE: 14.32%    R²: 0.9684, MAPE: 17.33% R²: 0.9894       R²: 0.7742    |
+---------------------------------------------------------------------------------------+
```

---

## 2. Dual-Engine Bridge Architecture

In a production smart city platform, spawning a new Python runtime process for every HTTP API request introduces unacceptable latency ($1.2\text{--}1.8\text{ seconds}$ on Windows) due to interpreter initialization and heavy library imports (`scikit-learn`, `pandas`, `joblib`, `numpy`).

To resolve this, the platform implements a **Dual-Engine Fault-Tolerant Bridge** in `backend/services/mlInferenceService.js`:

1. **Primary Engine (Persistent Memory Daemon):**
   * Service: `ml/unified_inference_service.py --serve --port 5001`
   * All 4 models and preprocessing pipelines are preloaded into RAM on startup.
   * Node.js communicates via HTTP `POST /predict/<module>`.
   * **Inference Latency:** **$1.8\text{--}3.5\text{ ms}$** per prediction.
   * Express API end-to-end response turnaround: **$< 10\text{ ms}$**.

2. **Secondary Engine (Automated CLI Fallback):**
   * If the daemon is unreachable or undergoing maintenance, `mlInferenceService.js` detects the connection failure within 500ms and automatically spawns:
     `python ml/unified_inference_service.py --module <module> --input '<json>'`
   * Execution timeout: 12 seconds with controlled process termination.
   * Guarantees **zero single-point-of-failure** for backend ML operations.

3. **Output Sanitization & Validation Layer:**
   * Validates numeric outputs against domain limits.
   * Replaces any accidental `NaN`, `Infinity`, or negative values with bounded fallback baselines.
   * Explicitly tags every payload with metadata: `is_live_ml: true`, `model_used`, and `target_variable`.

---

## 3. Four-Module Detailed Integration Specifications

### 3.1 Transport Module (Transit Demand Forecasting)

* **Model File:** `ml/transport/models/transport_demand_model.pkl`
* **Algorithm:** Random Forest Regressor (100 estimators, max depth 12)
* **Performance:** $R^2 = 0.6413$, $\text{MAE} = 105,570.74$, $\text{RMSE} = 135,231.47$, $\text{MAPE} = 14.32\%$
* **Target Variable:** `total_rides` (Integer count of daily network-wide transit boardings)
* **Input Features:**
  - `day_of_week` (0 = Monday ... 6 = Sunday)
  - `month` (1 ... 12)
  - `is_weekend` (0 or 1)
  - `lag_1` (Previous day's ridership, default: 1,180,000)
  - `lag_7` (Ridership 7 days prior, default: 1,210,000)
  - `rolling_mean_7` (7-day moving average, default: 1,195,000)
  - `rolling_std_7` (7-day standard deviation, default: 45,000)
* **Live API Endpoints:**
  - `GET /api/transport/forecast?horizon_days=7`: Generates rolling 7-day daily ridership forecast.
  - `POST /api/transport/predict-demand`: Generates single-day demand prediction from custom features.
* **Separation from Routing Engine:**
  - Route planning (`GET /api/transport/routes`) traverses GTFS schedules stored in MySQL 8.4 or applies the calibrated road transit velocity model ($1.28\times$ circuity, 16–24 km/h).
  - The ML model **does not calculate journey duration**. Route durations and ML passenger volume are kept completely separate.

#### Live API Response Artifact (`GET /api/transport/forecast`):
```json
{
  "success": true,
  "model_used": "Random Forest Regressor",
  "target_variable": "total_rides (daily network passenger trips)",
  "r2_score": 0.6413,
  "mape_percent": 14.32,
  "horizon_days": 7,
  "forecast": [
    {
      "date": "2026-11-08",
      "day_name": "Sunday",
      "day_of_week": 6,
      "is_weekend": true,
      "predicted_total_rides": 1042850,
      "demand_category": "Normal Demand",
      "deviation_from_baseline_pct": -13.5
    },
    {
      "date": "2026-11-09",
      "day_name": "Monday",
      "day_of_week": 0,
      "is_weekend": false,
      "predicted_total_rides": 1289420,
      "demand_category": "High Demand",
      "deviation_from_baseline_pct": 6.9
    }
  ]
}
```

---

### 3.2 Traffic Module (Junction Vehicle Flow Prediction)

* **Model File:** `ml/traffic/models/traffic_model.pkl`
* **Algorithm:** Gradient Boosting Regressor (150 estimators, learning rate 0.08)
* **Performance:** $R^2 = 0.9684$, $\text{MAE} = 2.9341\text{ veh/hr}$, $\text{RMSE} = 4.8412\text{ veh/hr}$, $\text{MAPE} = 17.33\%$
* **Target Variable:** `Vehicles` (Hourly vehicle count at junction sensor detectors)
* **Input Features:**
  - `Junction` (1, 2, 3, or 4)
  - `Hour` (0 ... 23)
  - `DayOfWeek` (0 ... 6)
  - `Month` (1 ... 12)
  - `IsWeekend` (0 or 1)
  - `IsHoliday` (0 or 1)
  - `WeatherCode` (0 = Clear, 1 = Rain, 2 = Fog, etc.)
  - `Temperature` (°C)
  - `RainMM` (mm/hr)
* **Live API Endpoints:**
  - `POST /api/traffic/predict-junction`: Dedicated junction vehicle flow prediction.
  - `POST /api/traffic/predict`: Hybrid prediction combining live ML junction throughput with analytical corridor delay simulation.
* **Separation from Corridor Simulator:**
  - ML Model computes point sensor throughput (`predicted_vehicles_per_hour`, LOS, congestion percentage).
  - Analytical engine computes arterial route travel time and corridor delay using multi-factor diurnal equations.

#### Live API Response Artifact (`POST /api/traffic/predict`):
```json
{
  "success": true,
  "is_live_ml": true,
  "ml_junction_prediction": {
    "model_used": "Gradient Boosting Regressor",
    "target_variable": "Vehicles (vehicles/hour)",
    "r2_score": 0.9684,
    "junction": 1,
    "hour": 18,
    "predicted_vehicles_per_hour": 81,
    "level_of_service": "C (Stable Flow)",
    "congestion_percentage": 67
  },
  "corridor": {
    "corridor_id": "pvnr_expressway",
    "corridor_name": "PVNR Elevated Expressway",
    "hour": 18,
    "predicted_delay_mins": 14,
    "los": "D",
    "congestion_level": "Heavy Congestion",
    "calculation_method": "Multi-Factor Analytical Diurnal Simulation"
  }
}
```

---

### 3.3 Weather Module (Microclimate Temperature Prediction)

* **Model File:** `ml/weather/models/weather_model.pkl`
* **Algorithm:** Linear Regression Pipeline with `StandardScaler`
* **Performance:** $R^2 = 0.9894$, $\text{MAE} = 0.4051\text{ }^\circ\text{C}$, $\text{RMSE} = 0.5365\text{ }^\circ\text{C}$, $\text{MAPE} = 1.51\%$
* **Target Variable:** `tempC` (Hourly dry-bulb ambient temperature in °C)
* **Input Features:**
  - `hour` (0 ... 23)
  - `month` (1 ... 12)
  - `humidity` (% relative humidity)
  - `dew_point` (Dew point temperature in °C)
  - `wind_speed` (Wind speed in km/h)
  - `pressure` (Barometric pressure in hPa)
* **Live API Endpoints:**
  - `GET /api/weather/overview`: Injects live ML predicted current temperature badge into city overview.
  - `POST /api/weather/predict-temperature`: Interactive microclimate ambient temperature predictor tool.
* **Separation from UHI Engine:**
  - Model predicts base ambient temperature.
  - Spatial Urban Heat Island offsets (+3.8°C Charminar dense core vs 0.0°C Shamshabad rural baseline) are computed analytically and added transparently.

#### Live API Response Artifact (`POST /api/weather/predict-temperature`):
```json
{
  "success": true,
  "is_live_ml": true,
  "model_used": "Linear Regression Pipeline (StandardScaler + LinearRegression)",
  "target_variable": "tempC (Ambient Dry-Bulb Temperature in °C)",
  "r2_score": 0.9894,
  "mape_percent": 1.51,
  "hour": 14,
  "month": 5,
  "predicted_temperature_c": 41.1,
  "feels_like_c": 46.3,
  "thermal_comfort_level": "Severe Heat Warning",
  "uhi_offsets": {
    "charminar_dense_core": "+3.8°C (Estimated 44.9°C)",
    "hitec_city_commercial": "+2.4°C (Estimated 43.5°C)",
    "shamshabad_baseline": "0.0°C (Baseline 41.1°C)"
  }
}
```

---

### 3.4 Air Quality Module (1-Hour Ahead SVR AQI Forecast)

* **Model File:** `ml/air_quality/models/aqi_model.joblib`
* **Algorithm:** Support Vector Regressor (SVR) with RBF Kernel
* **Performance:** $R^2 = 0.7742$, $\text{MAE} = 20.8899\text{ pts}$, $\text{RMSE} = 27.2995\text{ pts}$, $\text{MAPE} = 32.13\%$
* **Target Variable:** `AQI` (1-hour ahead predicted CPCB NAQI score on 0–500 scale)
* **Input Features:**
  - `PM2.5`, `PM10`, `NO2`, `SO2`, `CO`, `O3` ($\mu\text{g/m}^3$)
  - `hour` (0 ... 23)
  - `temperature` (°C)
  - `humidity` (%)
  - `wind_speed` (km/h)
* **Live API Endpoints:**
  - `POST /api/air-quality/predict`: Returns genuine SVR 1-hour ahead prediction alongside current CPCB statutory calculation.
* **Separation from CPCB NAQI Engine:**
  - Current real-time AQI is calculated strictly using official Central Pollution Control Board piecewise linear sub-index formulas:
    $$I_p = \frac{I_{hi} - I_{lo}}{B_{hi} - B_{lo}} (C_p - B_{lo}) + I_{lo}, \quad \text{AQI} = \max(I_p)$$
  - SVR ML model predicts future boundary-layer dispersion trends 1-hour ahead.

#### Live API Response Artifact (`POST /api/air-quality/predict`):
```json
{
  "success": true,
  "is_live_ml": true,
  "model_used": "Support Vector Regressor (SVR RBF Kernel)",
  "target_variable": "AQI (1-Hour Ahead Predicted CPCB Index)",
  "r2_score": 0.7742,
  "mae": 20.89,
  "predicted_aqi": 110.9,
  "category": "Moderate",
  "horizon_hours": 1,
  "current_cpcb_aqi": {
    "aqi": 110,
    "category": "Moderate",
    "prominent_pollutant": "PM10",
    "calculation_method": "Statutory CPCB NAQI Piecewise Linear Formula"
  }
}
```

---

## 4. Empirical Test Verification Suite

The entire hybrid architecture has been rigorously validated across multiple independent automated test suites:

```
┌─────────────────────────────────┬───────────┬──────────────┬───────────────────────────────────────────────────────┐
│ Test Suite                      │ Tests Run │ Tests Passed │ Focus & Coverage                                      │
├─────────────────────────────────┼───────────┼──────────────┼───────────────────────────────────────────────────────┤
│ test_live_ml_integration.js     │ 27        │ 27 (100%)    │ Daemon health, 4-module inference, schemas, fallbacks │
│ test_transport_routing.js       │ 12        │ 12 (100%)    │ GTFS graph traversal, transfer layovers, thresholds   │
│ test_transport_audit.js         │ 7         │ 7 (100%)     │ Reference journey duration verification & invariance  │
│ npm run build (Vite frontend)   │ 1         │ 1 (100%)     │ 2,360 modules transformed, zero bundle errors (33.47s)│
├─────────────────────────────────┼───────────┼──────────────┼───────────────────────────────────────────────────────┤
│ TOTAL PLATFORM ASSERTIONS       │ 47        │ 47 (100%)    │ ZERO FAILURES, ZERO REGRESSIONS                       │
└─────────────────────────────────┴───────────┴──────────────┴───────────────────────────────────────────────────────┘
```

### 4.1 Invariance Verification of Reference Journeys
Transport duration fixes were verified to remain completely untouched and invariant following the ML integration:
* **Mehdipatnam → Dondanpally:** Sched: 86m + Delay: 3m = Total: **89m** (Calibrated Transit Model)
* **Mehdipatnam → ISB:** Sched: 89m + Delay: 3m = Total: **92m** (Calibrated Transit Model)
* **Shaikpet → ISB:** Sched: 80m + Delay: 5m = Total: **85m** (Transfer via Narsinghi, 6m wait)
* **Charminar → Afzalgunj:** Sched: 12m + Delay: 1m = Total: **13m** (Direct Transit)
* **Secunderabad → Mehdipatnam:** Sched: 27m + Delay: 2m = Total: **29m** (Direct Arterial)
* **Koti → Dilsukhnagar:** Sched: 8m + Delay: 1m = Total: **9m** (Direct Schedule)

---

## 5. Instructions for Running the Complete Platform

```bash
# 1. Start the Unified ML Persistent Daemon (Port 5001)
python ml/unified_inference_service.py --serve --port 5001

# 2. Start the Node.js / Express Backend Server (Port 5000)
cd backend
npm start

# 3. Start the React / Vite Frontend Development Server (Port 5173)
cd frontend
npm run dev

# 4. Execute Automated Verification Suites
node backend/tests/test_live_ml_integration.js
node backend/tests/test_transport_routing.js
node backend/tests/test_transport_audit.js
```
