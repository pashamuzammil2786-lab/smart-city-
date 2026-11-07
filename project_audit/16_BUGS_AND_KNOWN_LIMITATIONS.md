# Complete Bug Register & Known Limitations

**Audit Standard:** Software Quality Assurance (SQA) & Academic Technical Review  
**Priority Classification:**
- **P0 — Critical:** Prevents core functionality, causes test failures, or produces seriously misleading results.
- **P1 — High:** Major reliability, performance, or security problem.
- **P2 — Medium:** Redundant code, incomplete integration, or architectural discrepancy.
- **P3 — Low:** UI polish, documentation stubs, or minor cleanup.

---

## 1. Prioritized Bug & Issue Register

### Issue Index
| Issue ID | Priority | Module | Summary |
| :---: | :---: | :--- | :--- |
| **BUG-01** | **P0** | Transport Testing | Test suite `test_transport_routing.js` fails Scenarios 5 & 6 due to obsolete function name. |
| **BUG-02** | **P0** | Database | Table `users` exists in MySQL but is missing from `database/schema.sql` DDL. |
| **BUG-03** | **P1** | Security | JWT secret key falls back to hardcoded default because `JWT_SECRET` is missing in `.env`. |
| **BUG-04** | **P1** | Database / Routing | Self-join on `transit_stop_times` takes 15–40s for large stop clusters due to missing index. |
| **BUG-05** | **P1** | Version Control | Root `.gitignore` is an empty 0-byte file, risking accidental secret leakage. |
| **BUG-06** | **P2** | Air Quality | Undisclosed synthetic dataset in AQI module creates academic integrity risk. |
| **BUG-07** | **P2** | Codebase Hygiene | Root `aqi/` directory is an exact duplicate of `ml/air_quality/` (2.04 MB dead code). |
| **BUG-08** | **P2** | Frontend Architecture | `frontend/src/pages/Transport.jsx` is an unrouted duplicate of `Dashboard.jsx`. |
| **BUG-09** | **P2** | Backend / Transport | `GET /api/transport/forecast` returns static hardcoded JSON from July 2026. |
| **BUG-10** | **P2** | Backend / Traffic | `POST /api/traffic/predict` claims "Random Forest" in JSON while executing a math formula. |
| **BUG-11** | **P3** | Repository Hygiene | Accidental 0-byte file named `=` in project root from shell syntax error. |
| **BUG-12** | **P3** | Repository Hygiene | 0-byte placeholder files (`predict.py`, `requirements.txt`, `README.md` stubs). |
| **BUG-13** | **P3** | Database | Table `transit_demand_forecasts` in MySQL has 0 rows and is unused. |

---

## 2. Detailed Technical Issue Descriptions

### BUG-01 (Priority: P0 — Critical)
- **Module:** Transport Automated Testing
- **Affected File:** [`backend/tests/test_transport_routing.js`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/backend/tests/test_transport_routing.js), lines 117 & 125
- **Description:** Executing `test_transport_routing.js` fails with `TypeError: routingService.validateLegPlausibility is not a function` in Scenarios 5 & 6.
- **Root Cause:** During the duration calibration refactor on October 30, the method was renamed to `evaluateLegDuration`, but the test file was not updated to reflect this export change.
- **Impact:** Automated test runner reports 2 test failures, preventing a 100% passing test report.
- **Recommended Fix:** Update lines 117 and 125 in `test_transport_routing.js` to invoke `routingService.evaluateLegDuration(depMins, arrMins, distanceKm)`.
- **Dependencies:** None.

---

### BUG-02 (Priority: P0 — Critical)
- **Module:** Relational Database Schema
- **Affected File:** [`database/schema.sql`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/database/schema.sql)
- **Description:** The `users` table exists in the live MySQL database (`smart_city_db`) with 9 rows, but is completely missing from `database/schema.sql`.
- **Root Cause:** Table was created ad-hoc during authentication implementation in October without updating the master DDL script.
- **Impact:** Any fresh database setup from `schema.sql` will fail user registration and login with SQL error: `Table 'smart_city_db.users' doesn't exist`.
- **Recommended Fix:** Append the `CREATE TABLE users` definition to `database/schema.sql`:
  ```sql
  CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;
  ```
- **Dependencies:** None.

---

### BUG-03 (Priority: P1 — High)
- **Module:** Backend Security & Authentication
- **Affected File:** [`backend/routes/auth.js`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/backend/routes/auth.js), line 7
- **Description:** `JWT_SECRET` defaults to `'smart-city-secret-key-2026'` because the variable is missing from `.env`.
- **Root Cause:** Missing environment variable entry in root `.env`.
- **Impact:** Anyone with source code access can forge valid administrative JWT tokens.
- **Recommended Fix:** Add `JWT_SECRET=<secure_random_64_char_key>` to `.env` and remove the hardcoded fallback string.
- **Dependencies:** `.env`, `auth.js`.

---

### BUG-04 (Priority: P1 — High)
- **Module:** Database Performance / Transit Routing
- **Affected File:** [`backend/services/routingService.js`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/backend/services/routingService.js), lines 479–505
- **Description:** Discovering 1-transfer journeys for large candidate clusters (e.g., Charminar to Afzalgunj) takes 15 to 40 seconds.
- **Root Cause:** A `DISTINCT` self-join across 1,132,807 rows in `transit_stop_times` without a composite covering index for `(trip_id, stop_id)`.
- **Impact:** High server response latency and potential UI timeout on complex O-D pairs.
- **Recommended Fix:** Execute `ALTER TABLE transit_stop_times ADD INDEX idx_trip_stop (trip_id, stop_id);` in MySQL.
- **Dependencies:** MySQL `transit_stop_times`.

---

### BUG-05 (Priority: P1 — High)
- **Module:** Version Control Hygiene
- **Affected File:** [`.gitignore`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/.gitignore)
- **Description:** Root `.gitignore` is an empty 0-byte file.
- **Root Cause:** Initial commit created placeholder `.gitignore` without populating exclusion patterns.
- **Impact:** `git status` lists hundreds of local files (`node_modules`, `dist`, `.env`). Running `git add .` would leak local database passwords and API secrets to remote repositories.
- **Recommended Fix:** Add standard node/python ignore patterns to `.gitignore`.
- **Dependencies:** Git.

---

### BUG-06 (Priority: P2 — Medium)
- **Module:** Air Quality Academic Readiness
- **Affected File:** [`ml/air_quality/dataset/air_quality.csv`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/ml/air_quality/dataset/air_quality.csv)
- **Description:** Dataset is generated synthetically via `generate_data.py` rather than collected from physical CPCB sensors.
- **Root Cause:** Public CPCB station APIs were restricted during development.
- **Impact:** If presented in an IEEE paper as physical sensor telemetry, the paper risks desk rejection for academic fraud.
- **Recommended Fix:** Explicitly document in paper and README that the dataset is a physically simulated baseline.
- **Dependencies:** Academic documentation.

---

### BUG-07 (Priority: P2 — Medium)
- **Module:** Repository Cleanliness
- **Affected Folder:** [`aqi/`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/aqi/)
- **Description:** Exact duplicate directory of `ml/air_quality/` occupying 2.04 MB.
- **Root Cause:** Folder was cloned during initial development and never deleted.
- **Impact:** Clutters repository and creates confusion about which files are executed.
- **Recommended Fix:** Safely delete the `aqi/` directory.
- **Dependencies:** None.

---

### BUG-08 (Priority: P2 — Medium)
- **Module:** Frontend Routing Architecture
- **Affected File:** [`frontend/src/pages/Transport.jsx`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/frontend/src/pages/Transport.jsx)
- **Description:** Full 724-line component is completely unrouted; `/transport` redirects to `/dashboard`.
- **Root Cause:** Transport planner was duplicated inside `Dashboard.jsx`.
- **Impact:** Technical debt and dual-maintenance overhead.
- **Recommended Fix:** Remove `Transport.jsx` or refactor shared controls into `components/TransportPlanner.jsx`.
- **Dependencies:** `frontend/src/App.jsx`.

---

### BUG-09 (Priority: P2 — Medium)
- **Module:** Transport API
- **Affected File:** [`backend/routes/transport.js`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/backend/routes/transport.js), lines 333–355
- **Description:** `GET /api/transport/forecast` returns a static hardcoded array from July 2026.
- **Root Cause:** Temporary mock array was not replaced with live model predictions.
- **Impact:** The forecast endpoint is static and does not dynamically update based on current dates.
- **Recommended Fix:** Connect the endpoint to read the latest predictions from `ml/transport/models/evaluation_test_series.json`.
- **Dependencies:** `backend/routes/transport.js`.

---

### BUG-10 (Priority: P2 — Medium)
- **Module:** Traffic API
- **Affected File:** [`backend/routes/traffic.js`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/backend/routes/traffic.js), line 486
- **Description:** Response includes `modelUsed: 'Random Forest Dynamic Flow Estimator'`, but executes an analytical multiplier formula.
- **Root Cause:** Copy-paste labeling error from early design draft.
- **Impact:** Misleading technical claim in API responses.
- **Recommended Fix:** Update label to `modelUsed: 'Parametric Corridor Congestion Simulator'`.
- **Dependencies:** `backend/routes/traffic.js`.

---

### BUG-11 (Priority: P3 — Low)
- **Module:** Repository Hygiene
- **Affected File:** [`=`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/=) (0 bytes)
- **Description:** 0-byte file named `=` in root directory.
- **Root Cause:** Accidental shell command syntax error.
- **Recommended Fix:** Delete the file.
- **Dependencies:** None.

---

### BUG-12 (Priority: P3 — Low)
- **Module:** Repository Hygiene
- **Affected Files:** `ml/air_quality/predict.py`, `ml/traffic/requirements.txt`, `ml/weather/requirements.txt`, `backend/README.md`, `database/README.md`, `frontend/README.md`
- **Description:** Multiple empty 0-byte files across the repository.
- **Recommended Fix:** Either populate with proper documentation/code or delete stubs.
- **Dependencies:** None.

---

### BUG-13 (Priority: P3 — Low)
- **Module:** Database Cleanup
- **Affected Table:** `transit_demand_forecasts` in `smart_city_db`
- **Description:** Table exists with 0 rows and is never populated or read by the backend.
- **Recommended Fix:** Either populate with daily predictions from `train.py` or document as a planned caching schema.
- **Dependencies:** `database/schema.sql`.
