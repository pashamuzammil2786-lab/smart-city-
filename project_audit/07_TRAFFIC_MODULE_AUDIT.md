# Traffic Flow & Congestion Module Audit

**Module ID:** Module 3  
**Domain Lead:** Navkar Gelda Jain  
**Focus Area:** Hourly Junction Flow, Arterial Corridor Monitoring, and Congestion Forecasting  
**Key Code Files:**
- Training Pipeline: [`ml/traffic/train.py`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/ml/traffic/train.py) (255 lines)
- Inference Script: [`ml/traffic/predict.py`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/ml/traffic/predict.py) (154 lines)
- Backend Controller: [`backend/routes/traffic.js`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/backend/routes/traffic.js) (499 lines)
- Frontend Interface: [`frontend/src/pages/Traffic.jsx`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/frontend/src/pages/Traffic.jsx) (580 lines)

---

## 1. Dataset Origin & Ingestion

### Dataset Metadata:
- **File Location:** [`ml/traffic/dataset/traffic_data.csv`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/ml/traffic/dataset/traffic_data.csv)
- **File Size:** 1.89 MB
- **Dataset Origin:** Kaggle Traffic Prediction Benchmark Dataset (Google Sheets export)
- **Total Samples:** **48,120 hourly records** spanning November 1, 2015 to June 30, 2017
- **Raw Columns:**
  - `DateTime` (Timestamp string: `2015-11-01 0:00:00` to `2017-06-30 23:00:00`)
  - `Junction` (Integer: 1, 2, 3, or 4)
  - `Vehicles` (Target: Integer vehicle count per hour)
  - `ID` (Unique observation identifier)
  - `Column 1`, `Column 2` (Artifact columns with all NaN values; dropped during preprocessing)

---

## 2. Feature Engineering & Preprocessing Pipeline

Feature engineering in [`ml/traffic/train.py`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/ml/traffic/train.py) generates **17 temporal, spatial, and autoregressive features**:

```text
48,120 Raw Records
  ├── DateTime Parsing & Chronological Sorting per Junction
  ├── Calendar Features:
  │     ├── hour (0 - 23), day (1 - 31), month (1 - 12), year
  │     ├── dayofweek (0=Monday, 6=Sunday)
  │     ├── is_weekend (binary: Saturday/Sunday = 1)
  │     └── is_rush_hour (binary: 8-11 AM, 5-8 PM = 1)
  ├── Cyclical Encodings:
  │     ├── hour_sin = sin(2 * π * hour / 24)
  │     └── hour_cos = cos(2 * π * hour / 24)
  ├── Spatial Indicator One-Hot Encodings:
  │     └── junction_1, junction_2, junction_3, junction_4
  └── Autoregressive & Rolling Window Features (grouped per junction):
        ├── lag_1 (traffic count 1 hour prior)
        ├── lag_2 (traffic count 2 hours prior)
        ├── lag_24 (traffic count same hour yesterday)
        ├── rolling_mean_6 (6-hour moving average)
        └── rolling_mean_24 (24-hour moving average)
```

---

## 3. Machine Learning Algorithms & Benchmark Performance

Model training in [`ml/traffic/train.py`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/ml/traffic/train.py) enforces a **strict chronological 80/20 train/test split** (no shuffling, zero future data leakage):
- **Training Samples:** 38,496 hourly observations (Nov 2015 – Feb 2017)
- **Testing Samples:** 9,624 hourly observations (Feb 2017 – June 2017)
- **Target Variable:** `Vehicles` (Hourly count passing through junction)

### Benchmark Comparison Table (Audited on 9,624 Test Samples):

| Algorithm | $R^2$ Score | MAE (Vehicles/hr) | RMSE (Vehicles/hr) | MAPE (%) | Selection Status |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Gradient Boosting Regressor** | **0.9684** | **2.9341** | **4.8367** | **17.33%** | **Selected Best Model** |
| **Random Forest Regressor** | 0.9677 | 2.9774 | 4.8967 | 18.06% | Alternative Tree Ensemble |
| **Ridge Regression** | 0.9658 | 3.2504 | 5.0345 | 19.50% | Regularized Linear Baseline |
| **Linear Regression** | 0.9658 | 3.2504 | 5.0345 | 19.51% | Ordinary Least Squares |

### Top Predictive Feature Importances (Gradient Boosting):
1. `lag_1` (Previous hour traffic flow): **95.09%**
2. `lag_24` (Same hour yesterday): **1.03%**
3. `rolling_mean_24` (24-hour moving average): **0.64%**
4. `lag_2` (Traffic count 2 hours prior): **0.60%**
5. `hour` (Hour of day): **0.54%**
6. `hour_cos` (Cyclical time encoding): **0.52%**

---

## 4. Backend Implementation Reality: Simulation vs. Model Inference

A key finding of this audit is that **the Node.js backend does not invoke `traffic_model.pkl` during online request processing**:

### Offline vs. Online Architecture:
- **Offline Machine Learning:** The Python model is trained and evaluated in `ml/traffic/train.py`, saving `traffic_model.pkl` (836 KB) and publishing evaluation results to `ml/traffic/models/metrics.json`.
- **Online REST Endpoint (`POST /api/traffic/predict`):** When a user triggers the What-If Simulator in the frontend, [`backend/routes/traffic.js`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/backend/routes/traffic.js) executes an **analytical multiplier formula** directly in JavaScript:
  $$T_{\text{predicted}} = T_{\text{free}} \times F_{\text{diurnal}} \times M_{\text{weather}} \times M_{\text{incident}}$$
  Where:
  - $F_{\text{diurnal}} = 1.75$ during peak hours (8–10 AM, 5–8 PM), $1.25$ midday, $0.85$ night.
  - $M_{\text{weather}} = 1.35$ for Rain, $1.70$ for Heavy Rain.
  - $M_{\text{incident}} = 1.25$ for Minor Blockage, $1.60$ for Major Accident.

### Note on Response Label:
In `backend/routes/traffic.js` line 486, the JSON response returns:
`modelUsed: 'Random Forest Dynamic Flow Estimator'`
**Audit Finding:** This is technically inaccurate; the endpoint executes the analytical multiplier formula described above rather than invoking a Random Forest model.

---

## 5. Frontend Presentation in `Traffic.jsx`

The frontend component [`frontend/src/pages/Traffic.jsx`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/frontend/src/pages/Traffic.jsx) (mounted via the Traffic tab in `Dashboard.jsx`) presents:
1. **Network KPI Cards:** Citywide Congestion Index ($58\%$), Average Speed ($29.6\text{ km/h}$), Speed Deficit ($-38\%$).
2. **8 Hyderabad Arterial Corridors:**
   - Mehdipatnam – Gachibowli IT Corridor (14.2 km)
   - Panjagutta – Banjara Hills – Jubilee Hills (9.8 km)
   - Begumpet – Secunderabad Station (7.5 km)
   - Dilsukhnagar – LB Nagar Highway (8.2 km)
   - Charminar – Falaknuma Heritage Corridor (6.4 km)
   - HITEC City – Madhapur – Mindspace (8.6 km)
   - Kukatpally – Miyapur Metro Corridor (11.5 km)
   - Outer Ring Road (ORR) Gachibowli – Shamshabad Airport (24.0 km)
3. **24-Hour Diurnal Congestion Chart:** Rendered using Recharts with twin series for Congestion Index and Average Speed.
4. **Interactive What-If Delay Simulator:** Allows testing corridor travel times under weather and incident scenarios.

---

## 6. Academic & IEEE Research Readiness Assessment

| Aspect | Current Status | Academic Recommendation |
| :--- | :--- | :--- |
| **Dataset Authenticity** | Generic Kaggle 4-Junction Dataset | Clearly acknowledge that junction counts are derived from open benchmark datasets and mapped to Hyderabad corridors as a representative proof-of-concept. |
| **Prediction Target** | `Vehicles` (Hourly Count) | Correctly report target as hourly vehicle volume, not corridor travel time or delay minutes. |
| **Evaluation Rigor** | Chronological 80/20 Split | Fully sound. $R^2 = 0.9684$ is reproducible and free of temporal leakage. |
| **Simulation Transparency** | Analytical Formula in Node.js | Clarify in research documentation that the What-If delay simulator is a physics-based parametric model calibrated by time-of-day factors. |
