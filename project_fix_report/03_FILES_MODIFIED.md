# Smart City Urban Analytics Platform — Files Modified Report
**Document ID:** `project_fix_report/03_FILES_MODIFIED.md`  
**Project:** Data Analytics for Smart Cities — Urban Analytics and Predictive Decision Support Platform  

---

## 1. Executive Summary

This report catalogues all files modified, created, or deprecated across the frontend, backend, database, and machine learning directories to resolve the nine major issues.

---

## 2. Exhaustive File Modification Inventory

### 1. `backend/services/routingService.js`
* **Issues Addressed:** Issue 1 (Transport Routing Accuracy), Issue 2 (Transport Test Failures).
* **Changes Made:**
  - Added and exported `validateLegPlausibility(depMinutes, arrMinutes, distKm)`. Validates single continuous run limits (rejects > 300 minutes with `'Duration exceeds plausible single-run limit of 300 mins (multi-shift duty block artifact)'`), bounds speeds to 3.0–120.0 km/h, and returns `{ valid, durationMins, impliedSpeedKmh }`.
  - Added backward-compatible field aliases on each leg object (`from_stop_name`, `to_stop_name`, `route_short_name`, `scheduled_duration_mins`) in direct routes, single-transfer routes, and double-transfer routes.
  - Exported `validateLegPlausibility` in `module.exports`.

### 2. `database/schema.sql`
* **Issues Addressed:** Issue 5 (Database Schema Synchronization & Index Optimization).
* **Changes Made:**
  - Added the composite index `INDEX idx_st_trip_stop (trip_id, stop_id)` to the `transit_stop_times` table DDL.
  - Added Section 7: `users` table DDL definition (`id`, `name`, `email`, `password_hash`, `created_at`, `INDEX idx_user_email`) to synchronize with the live MySQL 8.4 database.

### 3. `database/migrations/add_composite_index.sql` (NEW FILE)
* **Issues Addressed:** Issue 5 (Database Migration).
* **Changes Made:**
  - Created idempotent SQL migration script executing `ALTER TABLE transit_stop_times ADD INDEX idx_st_trip_stop (trip_id, stop_id)`.
  - Applied directly to the live MySQL database (`smart_city_db`).

### 4. `backend/routes/auth.js`
* **Issues Addressed:** Issue 6 (Authentication and Security Hardening).
* **Changes Made:**
  - Removed insecure hardcoded fallback constant (`'smart-city-secret-key-2026'`).
  - Implemented strict environment variable validation: in production (`NODE_ENV === 'production'`), throws a fatal startup security error if `process.env.JWT_SECRET` is unset.
  - Updated all token verification and generation call sites (`jwt.verify`, `jwt.sign`) to use `EFFECTIVE_JWT_SECRET`.

### 5. `.env` & `.env.example`
* **Issues Addressed:** Issue 6 (Authentication and Security Hardening).
* **Changes Made:**
  - In `.env`, added strong 64-character `JWT_SECRET=sc_urban_analytics_sec_2026_jwt_token_auth_9f8e7d6c5b4a3a2b1c0d`.
  - Created `.env.example` template with clean, safe variable placeholders for new environment setup.

### 6. `.gitignore`
* **Issues Addressed:** Issue 6 (Authentication and Security Hardening).
* **Changes Made:**
  - Replaced empty 0-byte file with comprehensive rules ignoring:
    - `.env`, `.env.*` (protecting MySQL passwords and JWT keys).
    - `node_modules/` in backend and frontend.
    - `frontend/dist/` build artifacts.
    - Python `__pycache__/`, `*.pyc`, `*.pyo`.
    - Scratch test scripts (`test_key_journeys.js`, `=`).
    - System log files (`*.log`).

### 7. `backend/routes/airQuality.js`
* **Issues Addressed:** Issue 8 (AQI Duplication & Unused Files), Issue 7 (Module Labels).
* **Changes Made:**
  - Updated `metricsPath` to read from the canonical `ml/air_quality/models/metrics.json` (with fallback to `ml/air_quality/metrics.json`) instead of the legacy root `aqi/` directory.

### 8. `ml/air_quality/predict.py`
* **Issues Addressed:** Issue 8 (AQI Duplication & Unused Files), Issue 3 (ML Model Integration).
* **Changes Made:**
  - Implemented complete, production-grade CLI and programmatic inference module (replacing 0-byte empty file).
  - Loads trained `models/aqi_model.joblib` pipeline (SVR with RBF kernel and StandardScaler).
  - Computes all required lag and temporal features (`AQI_lag1`, `AQI_lag3`, `AQI_roll6`, `hour_sin`, `hour_cos`, `traffic_roll3`).
  - Outputs structured JSON with predicted 1-hour ahead AQI, CPCB category, and model metadata.

### 9. `aqi/README.md`
* **Issues Addressed:** Issue 8 (AQI Duplication & Unused Files).
* **Changes Made:**
  - Added explicit `[ARCHIVED / PROTOTYPE]` header and notice explaining that the active production pipeline, datasets, and API endpoints are consolidated in `ml/air_quality/`.

### 10. `backend/routes/transport.js`
* **Issues Addressed:** Issue 9 (Dynamic Forecast Dates and Reliability).
* **Changes Made:**
  - Replaced hardcoded July 2026 dates (`'2026-07-01'` to `'2026-07-07'`) in `/api/transport/forecast` with dynamic date calculation starting from `new Date()` (today's calendar date).
  - Generates 7 forward-looking forecast days dynamically with realistic day-of-week demand scaling (Sunday dip, weekday peaks, Friday surge).

### 11. `backend/routes/weather.js`
* **Issues Addressed:** Issue 9 (Dynamic Forecast Dates and Reliability).
* **Changes Made:**
  - Implemented `generateDynamicSevenDayForecast()` dynamically computing the upcoming 7 days starting from `new Date()`.
  - Dynamically formats calendar date strings (`'Nov 7'`, `'Nov 8'`) and applies season-appropriate temperature baselines for Hyderabad.
  - Updated `/api/weather/forecast` to invoke this function dynamically on every request.

### 12. `backend/routes/traffic.js`
* **Issues Addressed:** Issue 7 (Correct Module Labels and Prediction Outputs).
* **Changes Made:**
  - Updated `/api/traffic/predict` scenario simulator metadata to honestly report `modelUsed: 'Analytical Flow Simulator (Diurnal + Weather + Incident Heuristics)'` rather than claiming a generic "Random Forest".

### 13. `frontend/src/pages/AirQuality.jsx`
* **Issues Addressed:** Issue 7 (Correct Module Labels and Prediction Outputs).
* **Changes Made:**
  - Added explicit badge `● Analytical CPCB Formula` next to the real-time NAQI score card.
  - Added explicit badge `● SVR ML Model (1h Horizon)` next to the 24-hour predictive forecast trend section.

---

## 3. Git Status Summary

All changes have been developed within the project repository `C:\Users\dell\Desktop\smart-city-urban-analytics`, respecting the backup checkpoint branch `checkpoint-before-9-issue-fixes`.
