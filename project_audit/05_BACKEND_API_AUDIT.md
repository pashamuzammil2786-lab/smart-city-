# Backend REST API & Server Controller Audit

**Server Architecture:** Node.js v25.8.2 / Express 4.19.2  
**Database Driver:** `mysql2/promise` (Connection Pool of 10)  
**Authentication:** JSON Web Tokens (`jsonwebtoken`) with `bcryptjs` password hashing  
**Host & Port:** `http://localhost:5000`  

---

## 1. Global Server Configuration & Middleware Audit

The backend server entry point is located in [`backend/server.js`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/backend/server.js).

### Active Middleware Stack:
1. `cors()`: Enables cross-origin requests for all domains (unrestricted wildcard `*`).
2. `express.json()`: Standard JSON body parsing.
3. `dotenv.config()`: Loads environment variables from `../.env`.

### Route Mount Points:
```javascript
app.use('/api/auth', authRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/air-quality', airQualityRoutes);
app.use('/api/aqi', airQualityRoutes); // Backward compatibility alias
```

---

## 2. Complete REST Endpoint Inventory

The platform defines **25 distinct API endpoints**. Each is audited in detail below:

---

### A. Authentication Endpoints (`backend/routes/auth.js`)

#### 1. `POST /api/auth/signup`
- **Purpose:** User registration and account creation.
- **Input (JSON Body):** `{ name, email, password }`
- **Validation:** Enforces non-empty strings and minimum 4-character password length.
- **Database Query:**
  - `SELECT id FROM users WHERE email = ?`
  - `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`
- **Cryptography:** Generates 10-round bcrypt salt (`bcrypt.genSalt(10)`) and hash.
- **Output (201 Created):** `{ message, token, user: { id, name, email } }`
- **Implementation State:** Fully dynamic and functional against MySQL `users` table.

#### 2. `POST /api/auth/login`
- **Purpose:** User sign-in and session token issuance.
- **Input (JSON Body):** `{ email, password }`
- **Database Query:** `SELECT * FROM users WHERE email = ?`
- **Verification:** `bcrypt.compare(password, user.password_hash)`
- **Output (200 OK):** `{ message, token, user: { id, name, email } }`
- **Token Spec:** Signs JWT with 7-day expiration (`expiresIn: '7d'`).

#### 3. `GET /api/auth/me`
- **Purpose:** Validates existing session token and returns active user profile.
- **Headers:** `Authorization: Bearer <token>`
- **Middleware:** `authenticateToken` validates JWT against secret key.
- **Database Query:** `SELECT id, name, email, created_at FROM users WHERE id = ?`
- **Output (200 OK):** `{ user: { id, name, email, created_at } }`

---

### B. Public Transportation Endpoints (`backend/routes/transport.js`)

#### 4. `GET /api/transport/stops`
- **Purpose:** Autocomplete and keyword search for bus stops.
- **Query Params:** `q` (search string, optional), `limit` (default: 10)
- **Database Query:**
  ```sql
  SELECT stop_id, stop_name, zone_id, stop_lat, stop_lon, stop_desc 
  FROM transit_stops 
  WHERE stop_name LIKE ? OR stop_desc LIKE ? 
  ORDER BY CASE WHEN stop_name LIKE ? THEN 1 ELSE 2 END, LENGTH(stop_name) ASC 
  LIMIT ?
  ```
- **Output:** `{ stops: [...] }`
- **Performance:** Optimized with database index `idx_stop_name`. Sub-5ms response time.

#### 5. `GET /api/transport/nearby-stops`
- **Purpose:** Geospatial radius discovery of bus stops near user GPS coordinates.
- **Query Params:** `lat`, `lon`, `radius` (km, default 2.0), `limit` (default 5)
- **Algorithm:** Bounding box SQL pre-filter followed by precise in-memory Haversine distance calculation and sorting.
- **Database Query:**
  ```sql
  SELECT stop_id, stop_name, zone_id, stop_lat, stop_lon, stop_desc
  FROM transit_stops
  WHERE stop_lat BETWEEN ? AND ? AND stop_lon BETWEEN ? AND ?
  ```
- **Output:** `{ nearbyStops: [ { stop_id, stop_name, distance_km, distance_meters, ... } ] }`

#### 6. `GET /api/transport/routes`
- **Purpose:** Primary multi-tier journey planner (Direct, 1-Transfer, 2-Transfer routes).
- **Query Params:** `origin` (name or ID), `destination` (name or ID), `limit` (default 8)
- **Controller Action:** Invokes `routingService.findTransitJourneys(origin, destination, maxOptions)`.
- **Database Interactions:**
  - `transit_stops`: Resolves candidate stop clusters.
  - `transit_stop_times`: Evaluates direct sequences and transfer combinations across 1,132,807 rows.
  - `transit_trips`, `transit_routes`: Resolves headsigns and route names.
  - `user_trip_searches`: Non-blocking search query audit logging.
- **Output:**
  ```json
  {
    "status": "SUCCESS",
    "origin": { "stop_name": "Mehdipatnam", "stop_lat": 17.3916, ... },
    "destination": { "stop_name": "Dontapally", "stop_lat": 17.4320, ... },
    "direct_distance_km": 19.4,
    "road_distance_km": 24.8,
    "total_routes_found": 3,
    "options": [
      {
        "journey_type": "direct",
        "route_name": "505",
        "scheduled_duration_mins": 86,
        "duration_source": "Estimated Route Duration (Calibrated Transit Model)",
        "expected_delay_mins": 7,
        "total_estimated_travel_time_mins": 93,
        "legs": [...]
      }
    ]
  }
  ```

#### 7. `GET /api/transport/route-stops`
- **Purpose:** Retrieves the full ordered sequence of intermediate bus stops for a selected journey.
- **Query Params:** `trip_id` (single or compound `trip1_trip2`), `route_id`
- **Database Query:** Joins `transit_stop_times` with `transit_stops` ordered by `stop_sequence ASC`.
- **Output:** `{ trip_id, stops: [ { stop_id, stop_name, stop_sequence, departure_time, arrival_time, stop_lat, stop_lon } ] }`

#### 8. `GET /api/transport/forecast`
- **Purpose:** 7-day transit passenger demand forecast.
- **Output:** Returns JSON array of 7 forward days with predicted total ridership.
- **Implementation State:** **Static JSON**. Returns fixed values for dates `2026-07-01` to `2026-07-07`. Does not execute live Python inference.

#### 9. `GET /api/transport/ml-metrics`
- **Purpose:** Returns Random Forest demand forecasting evaluation metrics.
- **Data Source:** Reads `ml/transport/models/model_metadata.json` if present; otherwise returns fallback constants ($R^2 = 0.6413$, $\text{MAPE} = 14.32\%$).

#### 10. `GET /api/transport/model-comparison`
- **Purpose:** Returns benchmark comparison table of 5 algorithms (Random Forest, Linear, Ridge, Gradient Boosting, Decision Tree).
- **Implementation State:** In-memory JSON response reflecting results from `ml/transport/train.py`.

#### 11. `GET /api/transport/actual-vs-predicted`
- **Purpose:** Returns time-series test series data points for frontend plotting.
- **Data Source:** Reads `ml/transport/models/evaluation_test_series.json`.

---

### C. Traffic Congestion Endpoints (`backend/routes/traffic.js`)

#### 12. `GET /api/traffic`
- **Purpose:** Metadata endpoint. Returns module name, lead author, and version.

#### 13. `GET /api/traffic/overview`
- **Purpose:** City-wide traffic summary statistics.
- **Calculation:** Computes average congestion index, average speed, speed deficit, and active incident counts across 8 Hyderabad corridors in memory.

#### 14. `GET /api/traffic/corridors`
- **Purpose:** Returns detailed telemetry for 8 major Hyderabad arterial corridors.
- **Corridors Included:** Mehdipatnam–Gachibowli, Panjagutta–Jubilee Hills, Begumpet–Secunderabad, Dilsukhnagar–LB Nagar, Charminar–Falaknuma, HITEC City–Madhapur, Kukatpally–Miyapur, ORR Expressway.

#### 15. `GET /api/traffic/history`
- **Purpose:** 24-hour diurnal speed and congestion curve.
- **Output:** Array of 21 time points from 00:00 to 23:00.

#### 16. `GET /api/traffic/ml-metrics`
- **Purpose:** Machine learning evaluation metrics for vehicle flow forecasting.
- **Data Source:** Reads `ml/traffic/models/metrics.json` if available; otherwise returns validated constants (Gradient Boosting $R^2 = 0.9684$).

#### 17. `POST /api/traffic/predict`
- **Purpose:** Interactive what-if traffic scenario simulator.
- **Input (JSON Body):** `{ corridorId, hourOfDay, weatherCondition, incidentSeverity }`
- **Algorithm:**
  $$T_{\text{pred}} = T_{\text{free}} \times F_{\text{diurnal}} \times M_{\text{weather}} \times M_{\text{incident}}$$
- **Output:** `{ predictedTravelTimeMin, predictedDelayMin, predictedAverageSpeedKmH, levelOfService }`
- **Implementation State:** Uses empirical multipliers rather than loading `traffic_model.pkl` at runtime.

---

### D. Weather & Microclimate Endpoints (`backend/routes/weather.js`)

#### 18. `GET /api/weather`
- **Purpose:** Module metadata endpoint.

#### 19. `GET /api/weather/overview`
- **Purpose:** City weather snapshot (temperature, humidity, pressure, UV index, max UHI gradient).

#### 20. `GET /api/weather/microclimates`
- **Purpose:** Telemetry for 6 Hyderabad microclimate zones (Charminar, HITEC City, Banjara Hills, Secunderabad, Hussain Sagar, Shamshabad).

#### 21. `GET /api/weather/forecast`
- **Purpose:** 7-day weather forecast and 24-hour hourly temperature/rain profile.

#### 22. `GET /api/weather/ml-metrics`
- **Purpose:** Temperature regression model evaluation metrics.
- **Data Source:** Reads `ml/weather/models/metrics.json` ($R^2 = 0.9894$).

#### 23. `POST /api/weather/simulate`
- **Purpose:** Urban Heat Island cooling simulation.
- **Input (JSON Body):** `{ zoneId, addedTreeCanopyPct, coolRoofAlbedoIncreasePct, waterFeatureBuffer }`
- **Algorithm:** Empirical cooling formula from urban climate literature (Akbari et al.):
  $$\Delta T = (0.085 \times \text{Canopy}) + (0.032 \times \text{Albedo}) + (0.65 \text{ if Water})$$
- **Output:** `{ projectedTempC, totalTemperatureDropC, projectedUHIDifferentialC, estimatedAcEnergySavingPct }`

---

### E. Air Quality (NAQI) Endpoints (`backend/routes/airQuality.js`)

#### 24. `GET /api/air-quality/current` (also aliased as `/api/aqi/current`)
- **Purpose:** City-wide air quality overview and dominant pollutant identification.
- **Implementation:** Executes official Indian CPCB piecewise linear equations across PM2.5, PM10, NO2, CO. Returns composite AQI and health advisory.

#### 25. `GET /api/air-quality/stations`
- **Purpose:** Telemetry for 7 Hyderabad monitoring stations (Sanathnagar, Zoo Park, Patancheru, Gachibowli, Jubilee Hills, Charminar, Uppal).

#### 26. `GET /api/air-quality/history`
- **Purpose:** 24-hour diurnal historical AQI and pollutant trends.
- **Implementation:** Generates diurnal Gaussian curve anchored to Hyderabad morning and evening rush-hour traffic peaks.

#### 27. `GET /api/air-quality/forecast`
- **Purpose:** 24-hour forward predictive AQI forecast.

#### 28. `GET /api/air-quality/ml-metrics`
- **Purpose:** Machine learning evaluation benchmarks for NAQI forecasting.
- **Data Source:** Reads `aqi/metrics.json` (SVR with RBF kernel, $R^2 = 0.7742$).

#### 29. `POST /api/air-quality/predict`
- **Purpose:** Interactive pollutant and weather scenario predictor.
- **Input (JSON Body):** `{ pm25, pm10, no2, co, temperature, humidity, wind_speed, traffic_congestion }`
- **Implementation:** Computes predicted sub-indices using CPCB piecewise equations.

---

### F. Academic Audit & System Endpoints

#### 30. `GET /api/model-performance`
- **Purpose:** Research portal endpoint exposing reproducible evaluation metrics across all 4 modules.
- **Data Source:** Reads [`backend/data/ml_performance_audit.json`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/backend/data/ml_performance_audit.json).
- **Output:** Full audit schema containing algorithm names, target units, test sample sizes, $R^2$, MAE, RMSE, MAPE, time-series sample points, error histograms, and known academic limitations.

#### 31. `GET /api/health`
- **Purpose:** Health check returning server uptime, timestamp, and database status.

#### 32. `GET /`
- **Purpose:** Root fallback confirming Express server is operational.

---

## 3. Backend Implementation Reality Summary Table

```text
┌──────────────────────────────────────┬───────────────────────────┬────────────────────────────────────────┐
│ Endpoint Category                    │ Count                     │ Primary Mechanism                      │
├──────────────────────────────────────┼───────────────────────────┼────────────────────────────────────────┤
│ Public Transit Routing & Search      │ 4 endpoints               │ Live MySQL 8.4 SQL Queries (1.1M rows) │
│ User Authentication                  │ 3 endpoints               │ Live MySQL `users` table + bcrypt/JWT  │
│ Reproducible ML Audit                │ 1 endpoint                │ File Read (`ml_performance_audit.json`)│
│ Scientific Formula Simulators        │ 3 endpoints (POST)        │ In-Memory Mathematical Physics / CPCB  │
│ Offline Benchmark Metadata           │ 4 endpoints               │ Cached JSON Files from Python Training │
│ Analytical Profiles / Corridors      │ 7 endpoints               │ In-Memory Domain Telemetry Arrays      │
└──────────────────────────────────────┴───────────────────────────┴────────────────────────────────────────┘
```
