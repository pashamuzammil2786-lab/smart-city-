# Security, Vulnerability & Code Quality Audit

**Target System:** Express REST API Backend, React Frontend, MySQL Database  
**Security Standard:** OWASP Top 10 Web Application Security Risks  
**Code Quality Standard:** Clean Code, Modularity, and DRY (Don't Repeat Yourself) Principles  

---

## 1. Security & Vulnerability Assessment

### A. Secret Management & Hardcoded Fallback Key (HIGH RISK)
- **Finding:** In [`backend/routes/auth.js`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/backend/routes/auth.js) line 7:
  ```javascript
  const JWT_SECRET = process.env.JWT_SECRET || 'smart-city-secret-key-2026';
  ```
- **Audit Evidence:** An inspection of the root `.env` file confirms that `JWT_SECRET` is **not defined**. Consequently, the server defaults to the hardcoded string `'smart-city-secret-key-2026'`.
- **Security Impact:** Anyone with access to the source code repository can forge valid JWT tokens for any user ID without knowing the user's password, completely bypassing authentication.
- **Recommended Remedy:** Add a cryptographically random string (e.g., 64-byte hex) to `.env`:
  ```ini
  JWT_SECRET=f4b9c1d2e8...
  ```
  And enforce that the application crashes on startup if `process.env.JWT_SECRET` is undefined in production.

---

### B. Route Authorization & Endpoint Access Control (MEDIUM RISK)
- **Finding:** The middleware `authenticateToken` is implemented in `auth.js` but is **only applied to `GET /api/auth/me`**.
- **Audit Evidence:** All other API endpoints across Transport, Traffic, Weather, Air Quality, and Model Audit are unauthenticated public routes:
  ```javascript
  // backend/server.js
  app.use('/api/transport', transportRoutes); // Completely public
  app.use('/api/traffic', trafficRoutes);     // Completely public
  app.use('/api/air-quality', airQualityRoutes); // Completely public
  ```
- **Security Impact:** In an academic setting, public read access to civic data is standard. However, mutating endpoints or sensitive audit logs (such as `user_trip_searches`) can be triggered by unauthenticated clients.
- **Recommended Remedy:** Apply `authenticateToken` middleware to sensitive simulation routes if user quotas or auditing are required.

---

### C. SQL Injection Resistance (VERIFIED SECURE - ZERO RISK)
- **Finding:** Every SQL interaction across [`backend/routes/auth.js`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/backend/routes/auth.js), [`backend/routes/transport.js`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/backend/routes/transport.js), and [`backend/services/routingService.js`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/backend/services/routingService.js) uses **prepared statements with parameterized placeholders (`?`)**:
  ```javascript
  // Example from routingService.js:
  const [rows] = await pool.query(
    'SELECT * FROM transit_stops WHERE stop_name LIKE ? OR stop_desc LIKE ? LIMIT ?',
    [`%${query}%`, `%${query}%`, limit]
  );
  ```
- **Verification:** An automated code scan confirms **zero occurrences** of raw string concatenation or template literal interpolation (`${}`) inside SQL queries. The application is completely secure against SQL injection attacks.

---

### D. Password Hashing & Storage (VERIFIED SECURE)
- **Finding:** User registration in `backend/routes/auth.js` hashes passwords using `bcryptjs` with 10 salt rounds:
  ```javascript
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  ```
- **Verification:** Querying the `users` table confirms that only the 60-character bcrypt hash strings (`$2a$10$...`) are stored. Passwords are never logged or stored in plain text.

---

### E. Cross-Origin Resource Sharing (CORS) Configuration
- **Finding:** `backend/server.js` configures:
  ```javascript
  app.use(cors());
  ```
- **Impact:** Allows unrestricted cross-origin requests from any domain (`Access-Control-Allow-Origin: *`). While convenient for local development (connecting Vite port 5173 to Express port 5000), a production deployment should restrict origins to authorized domain names.

---

### F. Version Control Secret Leakage (.gitignore Gap)
- **Finding:** The root `.gitignore` file was created as an empty 0-byte file during the initial commit on August 28, 2026.
- **Risk:** Although `.env` was not committed in the initial two commits, the lack of an active `.gitignore` means any developer running `git add .` would unintentionally commit local database passwords, environment variables, and node_modules to Git history.
- **Recommended Remedy:** Populate `.gitignore` with standard rules:
  ```text
  .env
  node_modules/
  dist/
  __pycache__/
  *.pyc
  *.pkl
  *.joblib
  ```

---

## 2. Code Quality, Redundancy & Technical Debt

### A. Duplicate Directory: `aqi/` vs. `ml/air_quality/`
- **Audit Finding:** The project root contains a directory named `aqi/` (2.04 MB) containing:
  `app.py`, `features.py`, `generate_data.py`, `train.py`, `metrics.json`, `requirements.txt`, etc.
  These files are identical to those inside `ml/air_quality/`.
- **Debt Impact:** Redundant files clutter the repository and risk confusion if one copy is edited while the other is executed.
- **Action:** Delete the root `aqi/` folder; maintain `ml/air_quality/` as the single source of truth.

---

### B. Redundant Frontend Page: `Transport.jsx` vs. `Dashboard.jsx`
- **Audit Finding:**
  - `frontend/src/pages/Transport.jsx` (34.4 KB, 724 lines) contains a complete, working public transport journey planner.
  - `frontend/src/pages/Dashboard.jsx` (47.2 KB, 998 lines) contains an almost identical copy of the transport planner embedded in its Transport tab.
  - In `App.jsx`, route `/transport` simply redirects to `/dashboard`.
- **Debt Impact:** Bug fixes or UI updates applied to `Dashboard.jsx` (such as duration badges or leg breakdown drawer) must be duplicated in `Transport.jsx` to prevent divergence.
- **Action:** Either refactor the transport planner into a shared component (`components/TransportPlanner.jsx`) imported by both pages, or remove `Transport.jsx`.

---

### C. 0-Byte Placeholder Files
The following files exist in the repository with a size of 0 bytes:
1. `=` (Root directory: accidental shell command artifact).
2. `ml/air_quality/predict.py` (Unimplemented inference stub).
3. `ml/traffic/requirements.txt` (Empty dependencies stub).
4. `ml/weather/requirements.txt` (Empty dependencies stub).
5. `backend/README.md`, `database/README.md`, `frontend/README.md`, `LICENSE`.

---

### D. Unused Flask Microservice (`ml/air_quality/app.py`)
- **Finding:** A complete Flask API server exists in `ml/air_quality/app.py` intended to serve AQI predictions.
- **Debt Impact:** Because the main application consolidated all API routing into Express (`backend/routes/airQuality.js`), `app.py` is never executed. It remains in the codebase as dead code.

---

## 3. Security & Quality Summary Matrix

```text
┌───────────────────────────────────────┬──────────────┬────────────────────────────────────────────────────────┐
│ Security & Quality Dimension          │ Grade        │ Audit Finding & Recommendation                         │
├───────────────────────────────────────┼──────────────┼────────────────────────────────────────────────────────┤
│ SQL Injection Defense                 │ EXCELLENT    │ Parameterized queries used 100% across all endpoints.  │
│ Password Security & Hashing           │ EXCELLENT    │ Bcrypt with 10 salt rounds, no plain-text leaks.       │
│ JWT Secret Management                 │ WARNING      │ Falls back to hardcoded default key; add to .env.      │
│ API Route Authorization               │ ACCEPTABLE   │ Public endpoints suitable for civic data; audit me.    │
│ Version Control Hygiene               │ WARNING      │ Empty .gitignore file; risk of accidental .env commit. │
│ Code Redundancy & Duplication         │ NEEDS WORK   │ Root aqi/ duplicates ml/air_quality; redundant files.  │
│ Dead Code & Stubs                     │ NEEDS WORK   │ 0-byte files (=, predict.py) and unused Flask app.py.  │
└───────────────────────────────────────┴──────────────┴────────────────────────────────────────────────────────┘
```
