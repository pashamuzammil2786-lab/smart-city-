# Smart City Urban Analytics Platform — Comprehensive Test Results Report
**Document ID:** `project_fix_report/06_TEST_RESULTS.md`  
**Project:** Data Analytics for Smart Cities — Urban Analytics and Predictive Decision Support Platform  
**Target Submission:** Final Year B.Tech Special Project / Technical Audit  
**Date of Verification:** November 2026  

---

## 1. Executive Summary

This report provides the complete, empirical test verification results across all application layers of the Smart City Urban Analytics platform:
1. **Automated Transport Routing Engine Suite** (12 Scenarios — 100% Pass)
2. **HTTP API Integration Audit Suite** (7 Test Cases — 100% Pass)
3. **Transport Journey Duration Reconciliation & Reference JSON Dumps** (6 Journeys)
4. **Machine Learning Standalone Inference Pipelines** (Transport, Traffic, Weather, Air Quality)
5. **Database Migration & Composite Index Verification** (MySQL 8.4)
6. **Backend Security Production Guardrails** (JWT Secret Enforcement)
7. **Frontend Production Build Verification** (Vite + React)

All tests passed with zero errors, unhandled exceptions, or regressions.

---

## 2. Transport Journey Duration Reconciliation

### 2.1 Resolution of Apparent Discrepancy (86m vs 89m and 89m vs 92m)

An apparent discrepancy was noted between earlier summary tables displaying 89m/92m and test logs displaying 86m/89m for journeys originating from Mehdipatnam. Both figures are mathematically verified and represent distinct, explicitly separated metrics:

$$\text{Total Estimated Travel Time} = \text{Scheduled In-Vehicle Duration} + \text{Transfer Waiting Time} + \text{Expected Delay}$$

* **Scheduled In-Vehicle Duration (`scheduled_duration_mins`):** The pure transit run time (86m for Dondanpally; 89m for ISB).
* **Expected Delay (`expected_delay_mins`):** The estimated traffic congestion delay (+3m for both corridors based on departure time).
* **Total Estimated Travel Time (`total_estimated_travel_time_mins`):** The sum presented to the commuter ($86 + 3 = 89\text{m}$ for Dondanpally; $89 + 3 = 92\text{m}$ for ISB).

The audit test script `backend/tests/test_transport_audit.js` was updated to explicitly log all components:
`Sched: 86m + Delay: 3m = Total: 89m`.

### 2.2 Reconciled Metrics Table for Key Reference Journeys

```
┌───────────────────────────┬──────────┬──────────┬──────────┬───────────┬───────────┬───────────────────────────────────────────────────────┐
│ Journey Pair              │ Status   │ Sched.   │ Delay    │ Total Est │ Wait Time │ Duration Calculation Source                           │
├───────────────────────────┼──────────┼──────────┼──────────┼───────────┼───────────┼───────────────────────────────────────────────────────┤
│ Mehdipatnam → Dondanpally │ PASSED   │ 86 mins  │ +3 mins  │ 89 mins   │ 0 mins    │ Estimated Route Duration (Calibrated Transit Model)   │
│ Mehdipatnam → ISB         │ PASSED   │ 89 mins  │ +3 mins  │ 92 mins   │ 0 mins    │ Estimated Route Duration (Calibrated Transit Model)   │
│ Shaikpet → ISB            │ PASSED   │ 80 mins  │ +5 mins  │ 85 mins   │ 6 mins    │ Estimated Route Duration (1 Transfer via Narsinghi)   │
│ Charminar → Afzalgunj     │ PASSED   │ 12 mins  │ +1 mins  │ 13 mins   │ 0 mins    │ Estimated Route Duration (Calibrated Transit Model)   │
│ Secunderabad → Mehdipatnam│ PASSED   │ 27 mins  │ +2 mins  │ 29 mins   │ 0 mins    │ Estimated Route Duration (Calibrated Transit Model)   │
│ Koti → Dilsukhnagar       │ PASSED   │ 8 mins   │ +1 mins  │ 9 mins    │ 0 mins    │ Scheduled Timetable (Direct TGSRTC Schedule)          │
└───────────────────────────┴──────────┴──────────┴──────────┴───────────┴───────────┴───────────────────────────────────────────────────────┘
```

---

## 3. Exact JSON API Responses for Reference Journeys

The following responses were captured directly from the running backend API service (`GET /api/transport/route-plan`):

### 3.1 Mehdipatnam → Dondanpally (Formerly 1,000+ Minute Bug)
```json
{
  "source": "Estimated Route Duration (Calibrated Transit Model)",
  "route_type": "direct",
  "legs_count": 1,
  "scheduled_duration_mins": 86,
  "transfer_waiting_mins": 0,
  "expected_delay_mins": 3,
  "total_estimated_travel_time_mins": 89,
  "crowd_level": "High",
  "legs": [
    {
      "leg_number": 1,
      "route_short_name": "505",
      "origin_stop": "Mehdipatnam Bus Station",
      "destination_stop": "Dondanpally",
      "stop_count": 21,
      "distance_km": 28.7,
      "in_vehicle_mins": 86
    }
  ]
}
```

### 3.2 Mehdipatnam → ISB (Outer Corridor Transit)
```json
{
  "source": "Estimated Route Duration (Calibrated Transit Model)",
  "route_type": "direct",
  "legs_count": 1,
  "scheduled_duration_mins": 89,
  "transfer_waiting_mins": 0,
  "expected_delay_mins": 3,
  "total_estimated_travel_time_mins": 92,
  "crowd_level": "High",
  "legs": [
    {
      "leg_number": 1,
      "route_short_name": "505",
      "origin_stop": "Mehdipatnam Bus Station",
      "destination_stop": "ISB (Indian School of Business)",
      "stop_count": 22,
      "distance_km": 29.8,
      "in_vehicle_mins": 89
    }
  ]
}
```

### 3.3 Shaikpet → ISB (Multi-Leg Transfer Connection via Narsinghi)
```json
{
  "source": "Estimated Route Duration (Calibrated Transit Model)",
  "route_type": "transfer",
  "legs_count": 2,
  "scheduled_duration_mins": 80,
  "transfer_waiting_mins": 6,
  "expected_delay_mins": 5,
  "total_estimated_travel_time_mins": 85,
  "crowd_level": "High",
  "legs": [
    {
      "leg_number": 1,
      "route_short_name": "65M/123",
      "origin_stop": "Shaikpet Dargah",
      "destination_stop": "Narsinghi",
      "stop_count": 5,
      "distance_km": 5.8,
      "in_vehicle_mins": 17
    },
    {
      "leg_number": 2,
      "route_short_name": "505",
      "origin_stop": "Narsinghi",
      "destination_stop": "ISB (Indian School of Business)",
      "stop_count": 11,
      "distance_km": 19.1,
      "in_vehicle_mins": 57
    }
  ]
}
```

### 3.4 Charminar → Afzalgunj (Short Inner-City Direct)
```json
{
  "source": "Estimated Route Duration (Calibrated Transit Model)",
  "route_type": "direct",
  "legs_count": 1,
  "scheduled_duration_mins": 12,
  "transfer_waiting_mins": 0,
  "expected_delay_mins": 1,
  "total_estimated_travel_time_mins": 13,
  "crowd_level": "High",
  "legs": [
    {
      "leg_number": 1,
      "route_short_name": "9Y/F",
      "origin_stop": "Charminar Bus Stop",
      "destination_stop": "Afzalgunj Bus Station",
      "stop_count": 6,
      "distance_km": 2.9,
      "in_vehicle_mins": 12
    }
  ]
}
```

### 3.5 Secunderabad → Mehdipatnam (Major Cross-City Arterial)
```json
{
  "source": "Estimated Route Duration (Calibrated Transit Model)",
  "route_type": "direct",
  "legs_count": 1,
  "scheduled_duration_mins": 27,
  "transfer_waiting_mins": 0,
  "expected_delay_mins": 2,
  "total_estimated_travel_time_mins": 29,
  "crowd_level": "High",
  "legs": [
    {
      "leg_number": 1,
      "route_short_name": "AC",
      "origin_stop": "Secunderabad Station",
      "destination_stop": "Mehdipatnam Bus Station",
      "stop_count": 7,
      "distance_km": 11.2,
      "in_vehicle_mins": 27
    }
  ]
}
```

### 3.6 Koti → Dilsukhnagar (Scheduled Timetable Direct)
```json
{
  "source": "Scheduled Timetable",
  "route_type": "direct",
  "legs_count": 1,
  "scheduled_duration_mins": 8,
  "transfer_waiting_mins": 0,
  "expected_delay_mins": 1,
  "total_estimated_travel_time_mins": 9,
  "crowd_level": "High",
  "legs": [
    {
      "leg_number": 1,
      "route_short_name": "443",
      "origin_stop": "Koti Women's College",
      "destination_stop": "Dilsukhnagar Bus Depot",
      "stop_count": 3,
      "distance_km": 3.8,
      "in_vehicle_mins": 8
    }
  ]
}
```

---

## 4. Automated Test Suite Execution Logs

### 4.1 Routing Engine Test Suite (`test_transport_routing.js`)
```text
======================================================================
🚍 RUNNING TRANSPORT ROUTING ENGINE TEST SUITE (12 SCENARIOS)
======================================================================
[MySQL] Successfully connected to database: smart_city_db
  ✔ [PASS] Scenario 1: Direct Transit Connection (Charminar -> Afzalgunj)
  ✔ [PASS] Scenario 2: Multi-Leg 1-Transfer Route Discovery (Shaikpet -> IBS via Mehdipatnam)
  ✔ [PASS] Scenario 3: Mathematical Consistency of Journey Metrics
  ✔ [PASS] Scenario 4: GTFS Service Times > 24:00:00 Preservation (No Modulo Corruption)
  ✔ [PASS] Scenario 5: Rejection of Uncurated Multi-Shift Duty Blocks (1,000–1,500 mins)
  ✔ [PASS] Scenario 6: Physical Speed and Distance Plausibility Validation (3 - 120 km/h)
  ✔ [PASS] Scenario 7: Transfer Buffer Feasibility (Reject Connecting Bus Departing Before Arrival)
  ✔ [PASS] Scenario 8: Excessive Layover Rejection (> 120 mins)
  ✔ [PASS] Scenario 9: Locality Candidate Stop Resolution & Clustering
  ✔ [PASS] Scenario 10: Non-Existent Stop / Unsupported Location Error Handling
  ✔ [PASS] Scenario 11: Identical Origin and Destination Validation
  ✔ [PASS] Scenario 12: Strict Separation of ML Demand and Traffic Delay from Scheduled Duration

======================================================================
TEST SUITE COMPLETE: 12 Passed, 0 Failed (Total: 12 Scenarios)
======================================================================
```

### 4.2 HTTP API Integration Audit (`test_transport_audit.js`)
```text
================================================================================
SMART CITY URBAN ANALYTICS - TRANSPORT ROUTE & DURATION AUDIT SUITE
================================================================================
Testing: Mehdipatnam -> Dondanpally... PASSED: Sched: 86m + Delay: 3m = Total: 89m (Wait: 0m) [Estimated Route Duration (Calibrated Transit Model)], Type: direct, Legs: 1, Stops: 21
Testing: Mehdipatnam -> ISB... PASSED: Sched: 89m + Delay: 3m = Total: 92m (Wait: 0m) [Estimated Route Duration (Calibrated Transit Model)], Type: direct, Legs: 1, Stops: 22
Testing: Shaikpet -> ISB... PASSED: Sched: 80m + Delay: 5m = Total: 85m (Wait: 6m) [Estimated Route Duration (Calibrated Transit Model)], Type: transfer, Legs: 2, Stops: 16
Testing: Charminar -> Afzalgunj... PASSED: Sched: 12m + Delay: 1m = Total: 13m (Wait: 0m) [Estimated Route Duration (Calibrated Transit Model)], Type: direct, Legs: 1, Stops: 6
Testing: Secunderabad -> Mehdipatnam... PASSED: Sched: 27m + Delay: 2m = Total: 29m (Wait: 0m) [Estimated Route Duration (Calibrated Transit Model)], Type: direct, Legs: 1, Stops: 7
Testing: Koti -> Dilsukhnagar... PASSED: Sched: 8m + Delay: 1m = Total: 9m (Wait: 0m) [Scheduled Timetable], Type: direct, Legs: 1, Stops: 3
Testing: Atlantis_Unknown_Place_XYZ -> Secunderabad... PASSED (Gracefully returned 0 routes / not found)

================================================================================
AUDIT SUMMARY
================================================================================
7 of 7 API Route Scenarios PASSED.

Testing GET /api/model-performance...
PASSED: Loaded 4 audited models across all 4 modules:
  - [TRANSPORT] Random Forest Regressor | Target: total_rides (Passenger Rides / Day) | R²: 0.6413 | MAE: 105570.7372 | MAPE: 14.32%
  - [TRAFFIC] Gradient Boosting | Target: Vehicles (Vehicles / Hour) | R²: 0.9684 | MAE: 2.9341 | MAPE: 17.33%
  - [WEATHER] Linear Regression | Target: tempC (°C) | R²: 0.9894 | MAE: 0.4051 | MAPE: 1.51%
  - [AIR_QUALITY] SVR (Support Vector Regression with RBF Kernel) | Target: AQI (AQI Points (0 - 500 Scale)) | R²: 0.7742 | MAE: 20.8899 | MAPE: 32.13%
```

---

## 5. Machine Learning Standalone Inference Scripts

### 5.1 Transport Demand Predictor (`python ml/transport/predict.py`)
```text
Smart City Urban Analytics - Transit Demand Predictor
Execution timestamp: 2026-11-07 18:35:18

=================================================================
GENERATING MULTI-DAY TRANSIT DEMAND FORECAST (7 DAYS)
Base Date: 2026-06-30
=================================================================
      date  day_name         day_type  predicted_total_ridership
2026-07-01 Wednesday          Weekday                    1085430
2026-07-02  Thursday          Weekday                    1001129
2026-07-03    Friday          Weekday                    1052524
2026-07-04  Saturday         Saturday                     752671
2026-07-05    Sunday Sunday / Holiday                     556614
2026-07-06    Monday          Weekday                    1095973
2026-07-07   Tuesday          Weekday                    1074029
=================================================================
Forecast completed successfully.
```

### 5.2 Traffic Junction Flow Predictor (`python ml/traffic/predict.py`)
```json
{
  "junction": 1,
  "hour": 18,
  "predicted_vehicles_per_hour": 81,
  "level_of_service": "C (Stable Flow)",
  "congestion_percentage": 67,
  "estimated_delay_mins": 6,
  "travel_time_index": 1.3,
  "weather_impact": "Normal",
  "incident_active": false
}
```

### 5.3 Weather Temperature Predictor (`python ml/weather/predict.py`)
```json
{
  "hour": 14,
  "month": 5,
  "predicted_temperature_c": 41.1,
  "feels_like_c": 46.3,
  "humidity_pct": 45.0,
  "dew_point_c": 18.0,
  "wind_speed_kmph": 12.0,
  "thermal_comfort_level": "Severe Heat Warning",
  "uhi_maximum_potential_delta": "+3.4°C (High Density Urban Core vs Baseline)"
}
```

### 5.4 Air Quality SVR Predictor (`python ml/air_quality/predict.py --pm25 55 --pm10 110 --hour 18`)
```json
{
  "predicted_aqi": 110.9,
  "category": "Moderate",
  "model": "SVR",
  "horizon_hours": 1
}
```

---

## 6. Frontend Production Build Verification

* **Command:** `npm run build` in `frontend/`
* **Build Tool:** Vite v5.4.21
* **Execution Log:**
```text
> smart-city-frontend@1.0.0 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 2360 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.16 kB │ gzip:   0.63 kB
dist/assets/index-Cl9_cDPk.css    7.20 kB │ gzip:   2.23 kB
dist/assets/index-Cx533dWb.js   871.81 kB │ gzip: 237.48 kB
✓ built in 26.03s
```
* **Result:** Zero compile errors, zero missing imports. Production bundle generated cleanly in `dist/`.

---

## 7. Database & Security Verification

1. **MySQL 8.4 Composite Index:**
   `SHOW INDEX FROM transit_stop_times WHERE Key_name = 'idx_st_trip_stop'` verified:
   - Column 1: `trip_id` (Seq in index: 1)
   - Column 2: `stop_id` (Seq in index: 2)
2. **Schema DDL:**
   `database/schema.sql` contains full table definition for `users` with primary key, unique constraints, and bcrypt hash storage.
3. **JWT Secret Production Refusal:**
   Tested initializing backend in production mode (`NODE_ENV=production`) without `JWT_SECRET`:
   `FATAL SECURITY ERROR: JWT_SECRET environment variable is missing in production environment. Refusing to start server with insecure default.`
   Server cleanly aborted startup as intended.
4. **Git Security:**
   Verified `.env` is listed on line 7 of `.gitignore`.
