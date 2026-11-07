# Frontend Architecture & Component Investigation

**Project:** Urban Analytics and Predictive Decision Support Platform  
**Frontend Framework:** React 18.3.1 with Vite 5.2.11  
**Target Resolution:** Desktop & Mobile Responsive Web  
**Primary CSS Theme:** Dark Glassmorphism (`#0B132B`, `#111C35`, `#233554`)  

---

## 1. Directory Structure & Component Organization

The client application resides in `frontend/src/` with a modular architecture:

```text
frontend/src/
├── main.jsx                     (React 18 root mount using createRoot)
├── App.jsx                      (Router definition, session bootstrap, Error Boundary)
├── index.css                    (Global design system, dark palette, utility classes)
│
├── components/
│   ├── Navbar.jsx               (Universal header, module switcher, user profile, logout)
│   └── LeafletMap.jsx           (Interactive map container, route polylines, stop markers)
│
├── pages/
│   ├── Landing.jsx              (Public splash page, platform introduction, feature preview)
│   ├── AuthPage.jsx             (Unified login/signup container with tabbed interface)
│   ├── Login.jsx                (Thin wrapper around AuthPage)
│   ├── Signup.jsx               (Thin wrapper around AuthPage)
│   ├── Dashboard.jsx            (Master 4-module hub: Transport, AQI, Traffic, Weather)
│   ├── Transport.jsx            (Standalone transport planner, currently unrouted)
│   ├── Traffic.jsx              (Corridor status, 24h diurnal curve, delay simulator)
│   ├── Weather.jsx              (Microclimates, UHI cooling simulator, 7-day forecast)
│   ├── AirQuality.jsx           (NAQI sub-index, station telemetry, scenario predictor)
│   └── ModelPerformance.jsx    (Academic 4-module ML audit research dashboard)
│
└── services/
    └── api.js                   (Centralized fetch client for all backend REST endpoints)
```

---

## 2. Page-by-Page Technical Investigation

### A. Landing Page (`frontend/src/pages/Landing.jsx`)
- **Route:** `/` (when unauthenticated) and `/landing`
- **Purpose:** Public presentation introducing the Smart City Urban Analytics Platform.
- **Key Features:**
  - Hero banner highlighting AI-driven urban analytics for Hyderabad.
  - Interactive feature preview cards across all 4 domains (Transport, Traffic, Weather, Air Quality).
  - Quick action buttons directing guests to **Login** or **Register**.
  - System architecture summary and research credentials.
- **Implementation State:** Fully implemented. Clean CSS animations, zero console errors, responsive layout.

---

### B. Authentication Subsystem (`AuthPage.jsx`, `Login.jsx`, `Signup.jsx`)
- **Routes:** `/login`, `/signup`
- **Component Architecture:**
  - `Login.jsx` (191 bytes) and `Signup.jsx` (195 bytes) are thin passthrough wrappers that render `<AuthPage initialMode="login" />` and `<AuthPage initialMode="signup" />`.
  - [`AuthPage.jsx`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/frontend/src/pages/AuthPage.jsx) (24.9 KB) encapsulates full form validation, tab switching between Sign In and Create Account, password visibility toggles, error banner presentation, and demo credentials pre-fill (`muzammil@smartcity.edu` / `student123`).
- **Session Handling:**
  - On submission, calls `api.login()` or `api.signup()`.
  - Saves JWT token to `localStorage.setItem('smart_city_token', data.token)`.
  - Passes user object to `App.jsx` root state, triggering immediate navigation to `/dashboard`.
- **Implementation State:** Fully implemented and verified.

---

### C. Master Operations Dashboard (`frontend/src/pages/Dashboard.jsx`)
- **Route:** `/dashboard` (and `/` when authenticated)
- **Role:** Central operational command center.
- **Internal Architecture:**
  [`Dashboard.jsx`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/frontend/src/pages/Dashboard.jsx) (47.2 KB, 998 lines) acts as a **Master Tabbed Hub**:
  ```jsx
  const [activeModule, setActiveModule] = useState('transport'); // 'transport' | 'aqi' | 'traffic' | 'weather'
  ```
  It renders a top-level 4-domain selector bar:
  1. **Transport Tab (`activeModule === 'transport'`):** Renders inline transport journey planning controls, corridor chips, route cards, and Leaflet map.
  2. **Air Quality Tab (`activeModule === 'aqi'`):** Dynamically mounts `<AirQuality />`.
  3. **Traffic Tab (`activeModule === 'traffic'`):** Dynamically mounts `<Traffic />`.
  4. **Weather Tab (`activeModule === 'weather'`):** Dynamically mounts `<Weather />`.
- **Transport Subsystem Controls inside Dashboard:**
  - Autocomplete inputs for Origin and Destination bus stops with debounced `api.getStops()` querying.
  - One-click corridor chips: `Charminar → Afzalgunj`, `Mehdipatnam → Dondanpally`, `Shaikpet → ISB`, `Secunderabad → Mehdipatnam`, `Koti → Dilsukhnagar`.
  - GPS "Use Current Location" button connecting to browser Geolocation.
  - 4 Summary KPI Cards: Available Routes count, Journey Duration, Predicted Delay, Crowd Occupancy level.
  - Route options list rendering:
    - Route numbers and headsigns.
    - Transfer badges (Direct Bus, 1 Transfer, 2 Transfers).
    - **Duration source badges:** `{route.duration_source === 'Scheduled Timetable' ? '● Timetable' : '● Calibrated Transit Model'}`.
    - Ordered multi-leg itinerary breakdown with boarding/alighting stops, times, and transfer waiting duration.
- **Implementation State:** Fully implemented, verified, and operational.

---

### D. Traffic Module Page (`frontend/src/pages/Traffic.jsx`)
- **Mounted via:** `Dashboard.jsx` (Traffic tab)
- **Component File:** [`Traffic.jsx`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/frontend/src/pages/Traffic.jsx) (26.6 KB, 580 lines)
- **Features:**
  - 4 City Overview KPI cards: Network Congestion Index (%), Average Velocity (km/h), Speed Deficit (%), Monitored Roadways (km).
  - 8 Arterial Corridors list with real-time status pills (Level of Service A–F), travel times, and known bottlenecks.
  - 24-Hour Diurnal Congestion & Speed Curve chart (Recharts LineChart).
  - Interactive What-If Scenario Simulator: Allows users to test how rainy weather or major vehicle breakdowns impact travel times across selected corridors.
  - Offline ML Benchmark Card: Displays Gradient Boosting model evaluation metrics ($R^2 = 0.9684$).
- **Implementation State:** Fully implemented. Uses analytical backend simulation endpoints.

---

### E. Weather & Microclimates Page (`frontend/src/pages/Weather.jsx`)
- **Mounted via:** `Dashboard.jsx` (Weather tab)
- **Component File:** [`Weather.jsx`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/frontend/src/pages/Weather.jsx) (27.6 KB, 620 lines)
- **Features:**
  - Current meteorological conditions: Temperature (°C), Humidity (%), Wind Speed (km/h), UV Alert, Air Dispersion index.
  - 6 Urban Microclimate Zones monitor (Charminar, HITEC City, Banjara Hills, Secunderabad, Hussain Sagar, Shamshabad) showing Urban Heat Island (UHI) temperature differentials.
  - 7-Day Forward Forecast & 24-Hour Diurnal Temperature Curve.
  - Urban Heat Island Mitigation Simulator: Sliders for added tree canopy (0–40%) and cool roof albedo boost (0–50%), computing estimated temperature drops and air conditioning energy savings.
  - Offline ML Benchmark Card: Displays Linear Regression metrics ($R^2 = 0.9894$).
- **Implementation State:** Fully implemented. Uses urban climate physics equations.

---

### F. Air Quality Module Page (`frontend/src/pages/AirQuality.jsx`)
- **Mounted via:** `Dashboard.jsx` (AQI tab)
- **Component File:** [`AirQuality.jsx`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/frontend/src/pages/AirQuality.jsx) (27.3 KB, 595 lines)
- **Features:**
  - National AQI Gauge Card: Overall AQI score with official CPCB color coding (Good, Satisfactory, Moderate, Poor, Very Poor, Severe) and dominant pollutant indicator.
  - Sub-index pollutant cards: PM2.5, PM10, NO2, CO, SO2, O3 with concentration values and CPCB standard limits.
  - 7 Hyderabad Environmental Monitoring Stations (Sanathnagar, Zoo Park, Patancheru, Gachibowli, Jubilee Hills, Charminar, Uppal).
  - 24-Hour Diurnal AQI Trend chart and 24-Hour Predictive Forecast curve.
  - Interactive Scenario Predictor: Allows inputs for PM2.5, PM10, NO2, traffic density, and wind speed, computing the predicted next-hour AQI.
  - Offline ML Benchmark Card: Displays SVR model metrics ($R^2 = 0.7742$).
- **Implementation State:** Fully implemented with exact CPCB mathematical definitions.

---

### G. Academic Model Performance Research Portal (`frontend/src/pages/ModelPerformance.jsx`)
- **Route:** `/model-performance`
- **Navigation:** Accessible via the discrete **Model Audit** link in the navbar (`Navbar.jsx`).
- **Component File:** [`ModelPerformance.jsx`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/frontend/src/pages/ModelPerformance.jsx) (19.3 KB, 430 lines)
- **Features:**
  - Loads reproducible audit results directly from `GET /api/model-performance`.
  - 4 Module Metric Cards: Shows exact algorithm, prediction target, dataset name, sample size, chronological split ratio, $R^2$ score, MAE, RMSE, and MAPE.
  - Interactive Actual vs. Predicted time-series charts (Recharts AreaChart) over the held-out test series.
  - 12-Bin Residual Error Distribution histograms showing prediction error skew and standard deviation.
  - Documented features inventory and explicit academic limitations for each domain.
- **Implementation State:** Fully implemented, verified, and active.

---

### H. Standalone Transport Page (`frontend/src/pages/Transport.jsx`)
- **Component File:** [`Transport.jsx`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/frontend/src/pages/Transport.jsx) (34.4 KB, 724 lines)
- **Findings:**
  - Originally developed as the dedicated transport page before all its controls were integrated into `Dashboard.jsx`.
  - In `App.jsx`, routes `/transport` and `/routes` currently redirect to `/dashboard`.
  - `Transport.jsx` remains in the codebase as a complete, working component with duplicate logic to `Dashboard.jsx`.
- **Implementation State:** Working code, but currently unrouted in the application router.

---

## 3. Shared Components Inspection

### A. Navigation Bar (`frontend/src/components/Navbar.jsx`)
- **Features:**
  - Brand identity: "Smart City Transport — Public Transit & Route Analytics".
  - Desktop links: **Dashboard** (`/`) and **Model Audit** (`/model-performance`).
  - User profile pill displaying the authenticated user's name.
  - Logout action button invoking token invalidation.
  - Mobile responsive hamburger menu with toggle drawer for small screens.
- **Audit Finding:** The navigation bar cleanly hides internal technical jargon, presenting an uncluttered interface for citizens while providing discrete access to the academic audit portal.

### B. Interactive Leaflet Map Container (`frontend/src/components/LeafletMap.jsx`)
- **Features:**
  - Embedded Leaflet map centered by default on central Hyderabad (`17.3850, 78.4867`).
  - Map tiles loaded from OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
  - Renders custom SVG markers for Start (Green), Destination (Red), Intermediate Stops (Blue), and Transfer Interchanges (Amber).
  - Draws connecting dashed transit polylines along stop sequences.
  - Automatic `map.fitBounds()` re-centering when new routes or stop clusters are selected.
- **Audit Finding:** Leaflet CSS is properly imported in `index.html`. Handles missing stop coordinates gracefully without crashing.

---

## 4. Frontend State Management & API Integration Layer

The frontend avoids heavyweight state libraries (Redux, MobX) in favor of clean React state primitives (`useState`, `useEffect`, `useCallback`) and a centralized API service client in [`frontend/src/services/api.js`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/frontend/src/services/api.js).

### API Client Review:
- All fetch requests target `http://localhost:5000/api`.
- Automatically attaches `Authorization: Bearer <token>` from `localStorage` for authenticated requests.
- Handles non-OK HTTP status codes by parsing JSON error objects and rethrowing standard JavaScript `Error` instances caught by page-level try/catch blocks.

---

## 5. Error Handling, Loading States & UX Quality

1. **Top-Level Error Boundary:**
   `App.jsx` wraps the application in an `ErrorBoundary` component that catches unhandled React rendering crashes, displaying a clean recovery screen ("Something went wrong — Reload Dashboard") instead of a blank white screen.
2. **Debounced Search Inputs:**
   Stop inputs check `val.trim().length >= 2` before triggering search API requests, reducing unnecessary network load.
3. **Skeleton & Spinner Indicators:**
   Geolocating, searching, and stop list expansion display clear loading text and disabled buttons, preventing repeated user clicks.
4. **Production Build Cleanliness:**
   Executing `npm run build` compiles 2,360 modules with zero TypeScript/JSX errors, outputting production assets to `frontend/dist/`.
