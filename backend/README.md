# Smart City Urban Analytics — Backend API

Node.js / Express backend service providing REST APIs for public transportation routing, traffic flow simulations, urban microclimate intelligence, air quality forecasting, and user authentication.

## Architecture
- **Framework**: Express.js
- **Database**: MySQL 8.4 via `mysql2/promise` connection pool
- **ML Integration**: Hybrid architecture connecting to persistent Python ML Daemon (`http://127.0.0.1:5001`) with automatic CLI subprocess fallback (`python ml/unified_inference_service.py`)
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing (10 salt rounds)

## Directory Structure
- `routes/`: API route controllers:
  - `transport.js`: Public transport timetable queries, routing, and demand forecasts
  - `traffic.js`: Junction vehicular flow ML inference and arterial corridor simulator
  - `weather.js`: Temperature forecasting and microclimate zones
  - `airQuality.js`: CPCB NAQI calculation and 1-hour ahead SVR forecast
  - `auth.js`: User registration, login, and profile management
- `services/`:
  - `routingService.js`: GTFS multi-leg routing engine with calibrated transit duration model
  - `mlInferenceService.js`: Unified ML gateway managing daemon memory cache & CLI fallback
- `tests/`: Automated test suites:
  - `test_transport_routing.js`: 12-scenario GTFS routing engine validation
  - `test_transport_audit.js`: 7 benchmark journey validation cases
  - `test_live_ml_integration.js`: 27-assertion live ML integration verification
  - `test_key_journeys.js`: Quick benchmark origin-destination journey test

## Running the Backend

```bash
cd backend
npm install
npm start
```
Default port: `http://localhost:5000`
