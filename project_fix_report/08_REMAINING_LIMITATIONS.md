# Smart City Urban Analytics Platform — Remaining Limitations & Future Work
**Document ID:** `project_fix_report/08_REMAINING_LIMITATIONS.md`  
**Project:** Data Analytics for Smart Cities — Urban Analytics and Predictive Decision Support Platform  

---

## 1. Executive Summary

In adherence to IEEE rigorous reporting standards and academic honesty, this report details the known remaining constraints, external assumptions, and areas for future technical enhancement across the platform.

---

## 2. Inventory of Remaining Limitations

### 2.1 Transport Module
1. **Static GTFS vs. Real-Time Vehicle Tracking (GTFS-RT):**
   - *Current Implementation:* The routing engine is powered by the static Hyderabad TGSRTC GTFS schedule feed (5,028 stops, 44,892 trips). While scheduled durations are calibrated and traffic delay heuristics are applied, live GPS automated vehicle location (AVL) feeds are not publicly broadcasted by TGSRTC via standard GTFS-RT Protobuf endpoints.
   - *Future Work:* Interface with real-time ITS/CAD-AVL APIs when made publicly available by state transport authorities.

2. **Road Circuity Factor Approximation:**
   - *Current Implementation:* A city-wide transit circuity factor of $1.28\times$ over Haversine distance is applied for calibrated speed modeling. While empirically accurate for Hyderabad's radial and ring arterial network, route-specific circuity varies between $1.15\times$ on straight highways (ORR) and $1.45\times$ in dense historic alleyways (Old City).
   - *Future Work:* Integrate an OpenStreetMap (OSM) contraction hierarchies routing graph to query exact road network turn-by-turn geometry.

---

### 2.2 Air Quality Module
1. **Synthetic Research Demonstration Dataset:**
   - *Current Implementation:* While the ML pipeline, feature engineering, and SVR algorithm follow Cabrera et al. (2020) and Kala et al. (2020), the bundled training dataset `ml/air_quality/dataset/air_quality.csv` was generated synthetically using diurnal and rush-hour Gaussian distributions (`generate_data.py`).
   - *Academic Implication:* The reported evaluation metrics ($R^2 = 0.7742$, $\text{RMSE} = 27.30$) validate the multi-source fusion ML pipeline architecture, but do not represent empirical real-world field trials.
   - *Future Work:* Establish an automated ETL pipeline ingesting live continuous ambient air quality monitoring stations (CAAQMS) from Central Pollution Control Board (CPCB) or OpenAQ.

---

### 2.3 Traffic Module
1. **Corridor Simulation vs. Live Dynamic Traffic Assignment (DTA):**
   - *Current Implementation:* Corridor travel times and delay estimates use an analytical simulation framework combining baseline free-flow times with diurnal rush-hour Gaussian curves, incident penalties, and weather multipliers.
   - *Future Work:* Connect with TomTom Traffic Flow API or Google Maps Distance Matrix API using production enterprise API keys for real-time corridor telemetry.

---

### 2.4 Weather Module
1. **Microclimate Sensor Station Density:**
   - *Current Implementation:* 6 calibrated microclimate zones across Hyderabad (Mir Alam Mandi, Cyber Towers, KBR Park, Bolarum Cantonment, Necklace Road, Shamshabad RGIA) provide Urban Heat Island differentials.
   - *Future Work:* Deploy low-cost IoT LoRaWAN temperature/humidity sensor meshes to provide high-density block-by-block thermal mapping.

---

## 3. Summary for IEEE Publication

These limitations represent standard engineering boundaries for an interdisciplinary university research project. They do not impair system execution, architectural integrity, or demonstrability.
