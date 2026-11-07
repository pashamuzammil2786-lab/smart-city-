# Smart City Urban Analytics Platform — Root Cause Analysis Report
**Document ID:** `project_fix_report/02_ROOT_CAUSE_ANALYSIS.md`  
**Project:** Data Analytics for Smart Cities — Urban Analytics and Predictive Decision Support Platform  

---

## 1. Executive Summary

This report delivers a deep technical root cause analysis for each of the nine issues investigated in the project. Each section identifies the precise mechanisms, code lines, architectural decisions, and data characteristics that produced the observed defects.

---

## 2. Root Cause Breakdown by Issue

### Root Cause 1: Transport Duration Anomaly (1,000–1,500 mins) & Missing Multi-Leg Routes
* **Underlying Mechanism:** 
  1. **Uncurated GTFS Vehicle Duty Blocks:** In the raw TGSRTC GTFS feed (`stop_times.txt`), numerous trips represented continuous driver shift duty blocks or depot holding cycles rather than single continuous passenger journeys. For instance, Trip `2623_17` had an initial departure recorded at `17:37:41` (1058 mins from midnight) and a final destination arrival at `42:53:04` (2573 mins from midnight), spanning 1,515 elapsed minutes across 24.5 km (implied speed of 0.97 km/h).
  2. **Previous Naive Calculation:** Early versions of the code either blindly subtracted departure time from arrival time without physical bounds checking, or applied `% 24` modulo math that corrupted post-midnight GTFS service times (e.g., `25:30:00` turned into `01:30:00`, causing negative durations that triggered naive `+1440` minute offsets).
  3. **Lack of Locality & Multi-Tier Routing:** Search queries looking for "ISB" or "Dondanpally" failed because the GTFS database named the stops "Indian Business School ( Ibs )" or "Dontapally / Donthanpally", and the routing engine only checked direct single-trip connections without exploring transfers at natural interchange hubs (such as Mehdipatnam or Narsinghi).

### Root Cause 2: Automated Routing Test Suite Failure
* **Underlying Mechanism:**
  During an earlier refactor of the routing engine, a comprehensive leg evaluation method `evaluateLegDuration` was introduced to calculate calibrated transit speeds. However, the existing test suite `backend/tests/test_transport_routing.js` at Scenarios 5 and 6 called `routingService.validateLegPlausibility(depMins, arrMins, distanceKm)`. Because `validateLegPlausibility` was omitted from `module.exports` and replaced internally, Node.js threw an unhandled `TypeError: routingService.validateLegPlausibility is not a function`.

### Root Cause 3: Machine Learning Model Integration & Target Variable Disconnect
* **Underlying Mechanism:**
  The project developed four distinct machine learning pipelines:
  - **Transport:** Random Forest trained on 9,282 daily records to predict total network ridership volume (`total_rides`).
  - **Traffic:** Gradient Boosting trained on 48,120 hourly records to predict junction vehicle counts (`Vehicles`).
  - **Weather:** Random Forest / Linear Regression trained on 96,453 hourly records to predict ambient temperature (`tempC`).
  - **Air Quality:** SVR trained on multi-source hourly data to predict next-hour `AQI`.
  The root confusion arose because early documentation and UI prototypes erroneously referred to "ML Journey Duration Prediction." Machine learning in urban transit predicts aggregate passenger crowding and corridor delay penalties, whereas individual scheduled trip durations are deterministically dictated by GTFS timetable departure/arrival schedules and physical road network distances.

### Root Cause 4: Lack of Explicit Dataset Provenance & Metadata
* **Underlying Mechanism:**
  Datasets were added to `ml/*/dataset/` without comprehensive accompanying data dictionaries or documentation specifying whether they were real open government data (TGSRTC GTFS from OpenCity Telangana, Kaggle meteorological station observations) or synthetic research demonstration data (Air Quality 3-year hourly dataset generated via `generate_data.py`). Without explicit provenance documentation, academic reviewers could not assess external validity.

### Root Cause 5: Database Schema Desynchronization & Missing Join Index
* **Underlying Mechanism:**
  1. **Schema File Drift:** The live MySQL database had been updated with user authentication tables via migration scripts (`users` table), but the master schema definition file `database/schema.sql` was never updated to reflect the `users` DDL.
  2. **Sub-Optimal Index on Large Table:** The table `transit_stop_times` contains 1,132,807 rows. The existing indexes were `idx_st_stop_trip (stop_id, trip_id, stop_sequence)` and `idx_st_trip_seq (trip_id, stop_sequence)`. However, point-to-point and transfer join queries execute queries of the form:
     ```sql
     JOIN transit_stop_times st2 ON st1.trip_id = st2.trip_id AND st2.stop_id IN (?)
     ```
     Because neither index had `(trip_id, stop_id)` leading consecutively, MySQL was forced to scan multiple index branches or inspect row lookups, increasing query latency.

### Root Cause 6: Insecure Fallback in Authentication & Missing `.gitignore`
* **Underlying Mechanism:**
  1. **Hardcoded Fallback Secret:** `backend/routes/auth.js` utilized:
     ```javascript
     const JWT_SECRET = process.env.JWT_SECRET || 'smart-city-secret-key-2026';
     ```
     If the developer forgot to define `JWT_SECRET` in `.env`, the server silently defaulted to a publicly visible constant in git history, making any issued JWT tokens forgeable.
  2. **Empty `.gitignore`:** The repository's root `.gitignore` file contained 0 bytes. As a consequence, `.env` files containing local MySQL passwords, `node_modules/`, `dist/` build outputs, and temporary files were exposed to git tracking.

### Root Cause 7: Ambiguous User Interface Labels & Prediction Outputs
* **Underlying Mechanism:**
  Components in the React frontend displayed generic badge text such as "AI Prediction" or "Machine Learning Analysis" for values that were actually calculated using:
  - The deterministic **CPCB National Air Quality Index (NAQI)** piecewise linear formula:
    $$I_p = \frac{I_{\text{hi}} - I_{\text{lo}}}{B_{\text{hi}} - B_{\text{lo}}} \times (C_p - B_{\text{lo}}) + I_{\text{lo}}$$
  - The **calibrated physical transit speed model** (incorporating a 1.28x road circuity factor and 0.6 min dwell times).
  - The **arterial traffic scenario simulator** (combining diurnal rush-hour Gaussian peaks with weather and incident multipliers).
  This violated scientific transparency standards.

### Root Cause 8: Directory Duplication & Unfinished Inference Script in AQI Module
* **Underlying Mechanism:**
  The air quality module was originally prototyped as a standalone Python Flask microservice inside the root directory `aqi/`. Later, the project unified its machine learning directory under `ml/air_quality/`. During this migration:
  1. The legacy root folder `aqi/` was left untouched.
  2. `backend/routes/airQuality.js` continued to read `metrics.json` from `../../aqi/metrics.json`.
  3. `ml/air_quality/predict.py` was created as an empty placeholder (0 bytes) while `train.py` was migrated.

### Root Cause 9: Hardcoded Forecast Horizon Dates
* **Underlying Mechanism:**
  In `backend/routes/transport.js`, the 7-day passenger demand forecast endpoint `/api/transport/forecast` returned a hardcoded array initialized with dates from July 2026 (`'2026-07-01'` to `'2026-07-07'`). Similarly, `backend/routes/weather.js` returned an array with static string dates (`'Oct 14'` to `'Oct 20'`). The backend never evaluated the system's current calendar date (`new Date()`).

---

## 3. Summary of Root Causes

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CORE ROOT CAUSE MATRIX                          │
├───────────────────┬────────────────────────────────────────────────────┤
│ Issue             │ Fundamental Root Cause                             │
├───────────────────┼────────────────────────────────────────────────────┤
│ 1. Durations      │ Uncurated GTFS duty blocks (1500m) + no alias map  │
│ 2. Test Failure   │ Function name mismatch in routingService exports   │
│ 3. ML Integration │ Target variable conflation (total_rides vs mins)   │
│ 4. Datasets       │ Missing provenance & data dictionary documentation │
│ 5. Database       │ DDL drift in schema.sql + missing composite index  │
│ 6. Auth/Security  │ Hardcoded fallback string + empty .gitignore       │
│ 7. Module Labels  │ Generic "AI" badges on analytical / physical math  │
│ 8. AQI Duplicate  │ Partial migration from root aqi/ + empty predict.py│
│ 9. Forecast Dates │ Static July 2026 arrays without Date() generation  │
└───────────────────┴────────────────────────────────────────────────────┘
```
