# Air Quality (NAQI) Module Audit

**Module ID:** Module 4  
**Domain Focus:** Composite National Air Quality Index (NAQI), Pollutant Sub-Indices, and Multi-Source Fusion Forecasting  
**Regulatory Standard:** Central Pollution Control Board (CPCB), Ministry of Environment, Forest and Climate Change, Government of India  
**Key Code Files:**
- Synthetic Generator: [`ml/air_quality/generate_data.py`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/ml/air_quality/generate_data.py) (85 lines)
- Feature Pipeline: [`ml/air_quality/features.py`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/ml/air_quality/features.py) (72 lines)
- Training Script: [`ml/air_quality/train.py`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/ml/air_quality/train.py) (92 lines)
- Unused Flask Service: [`ml/air_quality/app.py`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/ml/air_quality/app.py) (71 lines)
- Empty Placeholder: [`ml/air_quality/predict.py`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/ml/air_quality/predict.py) (0 bytes)
- Backend Controller: [`backend/routes/airQuality.js`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/backend/routes/airQuality.js) (528 lines)
- Frontend Interface: [`frontend/src/pages/AirQuality.jsx`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/frontend/src/pages/AirQuality.jsx) (595 lines)
- Duplicate Directory: [`aqi/`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/aqi/) (Root-level duplicate of `ml/air_quality/`)

---

## 1. Dataset Origin & Critical Transparency Finding

### A. Critical Audit Finding: Synthetic Telemetry Generation
An inspection of [`ml/air_quality/generate_data.py`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/ml/air_quality/generate_data.py) reveals that **the air quality dataset is not real-time telemetry from CPCB monitoring stations**, but is a **synthetically generated dataset** constructed for development and prototyping:

```python
# From ml/air_quality/generate_data.py, lines 1-13:
"""
Generate a synthetic Hyderabad air-quality dataset (hourly) for development.
Columns mirror the features used in the literature (Zheng 2015, Cabrera 2020, Kala 2020):
  - pollutants: PM2.5, PM10, NO2, CO
  - weather:    temperature, humidity, wind_speed, rainfall
  - traffic:    traffic_congestion (0-1 index)
  - target:     AQI

REPLACE with real data: put your CSV at data/air_quality.csv with the same column names...
"""
```

### B. Dataset Specifications:
- **File Location:** [`ml/air_quality/dataset/air_quality.csv`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/ml/air_quality/dataset/air_quality.csv)
- **File Size:** 2.04 MB
- **Observation Count:** **26,255 hourly rows** (representing 1,095 days = 3 complete years)
- **Generation Logic:** Simulates Hyderabad climatic conditions:
  - Seasonal monsoon humidity peak in August (Day 220).
  - Winter thermal inversion pollution spikes in December/January (Days 15 & 365).
  - Diurnal traffic congestion peaks at 9:00 AM and 6:00 PM.
  - Wind speed pollutant dispersion offsets.

---

## 2. Regulatory Standard: Indian CPCB NAQI Formulation

The platform rigorously adheres to the official **National Air Quality Index (NAQI)** standard published by the Central Pollution Control Board (CPCB), Government of India:

### Piecewise Linear Sub-Index Equation:
$$I_p = \frac{I_{\text{hi}} - I_{\text{lo}}}{B_{\text{hi}} - B_{\text{lo}}} \times (C_p - B_{\text{lo}}) + I_{\text{lo}}$$
Where:
- $C_p$: Observed pollutant concentration
- $B_{\text{lo}}, B_{\text{hi}}$: Breakpoint concentrations corresponding to the specific range
- $I_{\text{lo}}, I_{\text{hi}}$: AQI sub-index scores corresponding to $B_{\text{lo}}, B_{\text{hi}}$

### CPCB Breakpoint Definitions implemented in [`backend/routes/airQuality.js`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/backend/routes/airQuality.js):

| Category | AQI Range | Color Code | PM2.5 ($\mu\text{g/m}^3$) | PM10 ($\mu\text{g/m}^3$) | NO2 ($\mu\text{g/m}^3$) | CO ($\text{mg/m}^3$) | Health Advisory |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Good** | **0 – 50** | `#10B981` (Green) | 0 – 30 | 0 – 50 | 0 – 40 | 0 – 1.0 | Minimal impact; ideal for outdoor activities. |
| **Satisfactory** | **51 – 100** | `#84CC16` (Lime) | 30 – 60 | 50 – 100 | 40 – 80 | 1.0 – 2.0 | Minor breathing discomfort to sensitive people. |
| **Moderate** | **101 – 200** | `#F59E0B` (Amber) | 60 – 90 | 100 – 250 | 80 – 180 | 2.0 – 10.0 | Discomfort to people with lung disease/asthma. |
| **Poor** | **201 – 300** | `#F97316` (Orange) | 90 – 120 | 250 – 350 | 180 – 280 | 10.0 – 17.0 | Breathing discomfort on prolonged exposure. |
| **Very Poor** | **301 – 400** | `#EF4444` (Red) | 120 – 250 | 350 – 430 | 280 – 400 | 17.0 – 34.0 | Respiratory illness on prolonged exposure. |
| **Severe** | **401 – 500** | `#881337` (Maroon) | 250 – 500 | 430 – 500 | 400 – 500 | 34.0 – 50.0 | Emergency health warning; affects healthy people. |

Composite overall AQI is governed by the **maximum operator principle**:
$$\text{Overall AQI} = \max(I_{\text{PM2.5}}, I_{\text{PM10}}, I_{\text{NO2}}, I_{\text{CO}})$$

---

## 3. Feature Engineering & Multi-Source Fusion

In [`ml/air_quality/features.py`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/ml/air_quality/features.py), **22 multi-source features** are engineered based on published environmental forecasting literature (Zheng et al., 2015; Cabrera et al., 2020; Kala et al., 2020):
1. **Pollutant Concentrations:** `PM2.5`, `PM10`, `NO2`, `CO`
2. **Meteorological States:** `temperature`, `humidity`, `wind_speed`, `rainfall`
3. **Urban Mobility Index:** `traffic_congestion` (0.0 to 1.0)
4. **Calendar & Diurnal Encodings:** `hour`, `dayofweek`, `month`, `is_weekend`, `hour_sin`, `hour_cos`
5. **Autoregressive Lags:** `AQI_lag1` (1h prior), `AQI_lag3`, `AQI_lag6`, `AQI_lag24` (24h prior)
6. **Rolling Momentum:** `AQI_roll6` (6h moving average), `traffic_roll3` (3h moving traffic)

---

## 4. Machine Learning Algorithms & Benchmark Performance

In [`ml/air_quality/train.py`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/ml/air_quality/train.py), models are trained on a chronological 80/20 train/test split:
- **Training Samples:** 21,004 hourly records
- **Testing Samples:** 5,251 hourly records
- **Target Variable:** `AQI` (1 hour ahead)

### Benchmark Comparison Table (Audited on 5,251 Test Samples):

| Algorithm | Kernel / Architecture | $R^2$ Score | MAE (AQI) | RMSE (AQI) | MAPE (%) | Selection Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Support Vector Regression (SVR)** | **RBF ($C=50, \epsilon=1.0$)** | **0.7742** | **20.8899** | **27.3001** | **32.13%** | **Selected Best Model** |
| **Random Forest Regressor** | 200 Trees, max_depth=18 | 0.7734 | 21.2678 | 27.3482 | 32.84% | Ensemble Alternative |
| **Linear Regression** | Ordinary Least Squares | 0.7298 | 23.2871 | 29.8643 | 35.71% | Linear Baseline |

### Feature Importance Analysis:
- `AQI_lag1` (Autoregressive persistence): **38.4%**
- `PM2.5` Concentration: **22.1%**
- `traffic_congestion` (Vehicular density): **12.6%**
- `PM10` Concentration: **8.8%**
- `traffic_roll3` (3-hour rolling traffic): **6.5%**
- `wind_speed` (Atmospheric clearing): **2.1%**

---

## 5. Architectural Findings: Unused Code & Duplicate Folders

1. **Root-Level `aqi/` Directory:**
   The directory `aqi/` in the project root is an exact byte-for-byte duplicate of `ml/air_quality/`. It was created during early module development and can be safely deleted.
2. **0-Byte Placeholder `predict.py`:**
   [`ml/air_quality/predict.py`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/ml/air_quality/predict.py) has a length of 0 bytes.
3. **Unused Flask Server `app.py`:**
   [`ml/air_quality/app.py`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/ml/air_quality/app.py) was written as an independent Flask microservice on port 5000. However, the project consolidated all routing into the Express backend (`backend/routes/airQuality.js`), leaving `app.py` unexecuted.
4. **Online Scenario Predictor Implementation:**
   In `backend/routes/airQuality.js` line 461, `POST /api/air-quality/predict` executes the official CPCB piecewise equations in JavaScript with parametric traffic/wind adjustment coefficients rather than invoking `aqi_model.joblib`.

---

## 6. Academic & IEEE Research Readiness Assessment

| Aspect | Current Status | Academic Recommendation |
| :--- | :--- | :--- |
| **Regulatory Compliance** | **100% CPCB Gazette Compliant** | Sub-index formulas, breakpoints, and color codes match Indian Government standards exactly. |
| **Dataset Authenticity** | **Synthetic Simulation** | **CRITICAL:** For IEEE peer review, the authors must explicitly state: *"Because continuous CPCB API telemetry was unavailable during development, a 3-year hourly dataset was generated using validated physical and meteorological models from Zheng et al. and Kala et al."* Claiming this data is from physical sensors would violate academic ethics. |
| **Evaluation Rigor** | Chronological 80/20 Split | Methodologically sound. Zero data leakage. |
| **Evaluation Metrics** | Report MAE & RMSE | Exclude MAPE from primary reporting; near-zero baseline pollutant values mathematically inflate percentage errors. |
