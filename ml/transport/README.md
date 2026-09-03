# Transport Module - Public Transit & Urban Mobility Analytics

This module implements the **Transport + Machine Learning** subsystem for the **Smart City Urban Analytics Platform**. It focuses on public transit data integration, geospatial transit network mapping, and predictive modeling for transit passenger demand (ridership).

---

## 1. Data Sources & Organization

All raw and extracted datasets are stored inside `ml/transport/dataset/` organized by source:

```text
ml/transport/dataset/
├── opencity/
│   ├── hyd_stops.csv                                  (5,028 bus stops across Greater Hyderabad)
│   ├── telangana_gtfs_tgsrtc.zip                      (Official TGSRTC GTFS schedule feed archive)
│   └── gtfs_tgsrtc_extracted/                         (Extracted GTFS tables: routes, stops, trips, stop_times)
│
├── mobility_gtfs/
│   ├── hyderabad_mmts_gtfs.zip                        (Hyderabad Multi-Modal Transport System GTFS feed)
│   └── mmts_gtfs_extracted/                           (Extracted suburban train GTFS tables)
│
├── historical_ridership/
│   └── historical_transit_ridership.csv               (9,312 daily public transit boarding records)
│
└── passenger_counts/
    └── README.md                                      (Instructions for Kaggle manual download)
```

---

## 2. Dataset Inventory & Inspection

| Dataset Name | Source / Provider | Geographic Scope | Format | Rows | Columns | Missing Values | Key Features & Target Columns | Suitability for ML |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Hyderabad Bus Stops** | OpenCity / TSRTC | Hyderabad, India | CSV (461 KB) | 5,028 | 6 | 0 | `stop_id`, `stop_name`, `zone_id`, `stop_lat`, `stop_lon`, `stop_desc` | Geographic stop reference and spatial density mapping |
| **TGSRTC Bus GTFS** | OpenCity / Telangana Open Data | Greater Hyderabad & Telangana | GTFS (ZIP, 10.5 MB) | 1,031 routes, 5,028 stops, 10,000+ trips | Multiple relational tables | 0 | `routes.txt`, `stops.txt`, `trips.txt`, `stop_times.txt`, `calendar.txt` | Route scheduling, stop sequences, transit network topology |
| **Hyderabad MMTS GTFS** | MobilityDatabase (`mdb-921`) | Hyderabad MMTS (Suburban Rail) | GTFS (ZIP, 20 KB) | 142 route variations, 54 stations, 2,354 stop times | Multiple relational tables | 0 | `IN_distance`, `IN_duration`, `IN_speed`, `stop_lat`, `stop_lon`, `arrival_time`, `departure_time` | Multi-modal suburban train timetables, inter-station distances & speeds |
| **Historical Transit Ridership** | Open Transit Portal / Kaggle Benchmark | Public Transit Authority | CSV (323 KB) | 9,312 | 5 | 0 | `service_date`, `day_type`, `bus`, `rail_boardings`, `total_rides` | Daily time-series passenger demand forecasting |
| **Passenger Counts (Stop Level)** | Kaggle (`ifuurh`) | Generic Multi-modal (Tram/Bus) | CSV (Requires Kaggle login) | ~88 MB | 19 | Requires login | `operating_day`, `line_id`, `stop_id`, `arrival`, `departure`, `vehicle_seats`, `passengers` | High-resolution stop-level passenger count modeling |

---

## 3. Machine Learning Problem Formulation

Based on the actual available columns in the dataset, the primary prediction problem is formulated as follows:

- **Target Variable**: `total_rides` (Total daily transit passenger boardings, with sub-breakdown for `bus` and `rail_boardings`).
- **Prediction Type**: Time-Series Regression (Demand Forecasting).
- **Why this target was selected**: In a Smart City operations center, predicting future passenger demand allows transit authorities to dynamically optimize bus frequencies, prevent severe crowding during rush hours, allocate fuel/fleet resources efficiently, and reduce urban traffic congestion.

### Input Features Engineered
1. **Calendar & Temporal Features**:
   - `year`, `month`, `day`, `day_of_week` (0 to 6), `day_of_year`, `is_weekend` (0/1), `quarter`
2. **Categorical Day Types (One-Hot Encoded)**:
   - `day_type_W` (Weekday), `day_type_A` (Saturday), `day_type_U` (Sunday / Holiday)
3. **Time-Series Lag Features**:
   - `lag_1` (yesterday's ridership), `lag_2`, `lag_7` (same day last week), `lag_14` (two weeks ago), `lag_30` (one month ago)
4. **Rolling Window Statistics**:
   - `rolling_mean_7`, `rolling_std_7`, `rolling_mean_14`, `rolling_mean_30`, `rolling_min_7`, `rolling_max_7`
5. **Sequential Trend Index**:
   - `time_index` (integer trend counter)

---

## 4. Model Training, Evaluation & Benchmark Comparison

A **time-aware chronological split** was applied (80% training on historical data, 20% testing on the most recent unseen period) to ensure zero future-data leakage.

### Benchmark Evaluation Results (on Unseen Test Set):

| Model | MAE | RMSE | R² Score | MAPE (%) | Ranking |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Random Forest Regressor** | **105,570.74** | **135,231.47** | **0.6413** | **14.32%** | **Best Model (Saved)** |
| **Linear Regression (Baseline)** | 118,912.26 | 148,107.39 | 0.5698 | 19.54% | 2nd |
| **Ridge Regression (L2)** | 119,019.66 | 148,208.84 | 0.5692 | 19.56% | 3rd |
| **Gradient Boosting Regressor** | 140,707.46 | 176,832.05 | 0.3867 | 17.87% | 4th |
| **Decision Tree Regressor** | 224,210.80 | 297,600.64 | -0.7371 | 28.44% | 5th |

### Model Selection Rationale:
The **Random Forest Regressor** achieved the highest $R^2$ score ($0.6413$), lowest RMSE ($135,231.47$), and lowest MAPE ($14.32\%$). Its ensemble architecture effectively models non-linear interactions between day-of-week patterns, seasonal shifts, and short-term rolling momentum without overfitting.

---

## 5. How to Run the Module

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Train the ML Models
```bash
python train.py
```
*Output: Evaluates all models, displays comparison table, and saves the best model to `models/transport_demand_model.pkl`.*

### Step 3: Run Inference & Forecasting
```bash
python predict.py
```
*Output: Loads the trained model and outputs a 7-day recursive daily passenger ridership forecast.*

---

## 6. Sample 7-Day Prediction Output

```text
      Date       Day Name          Day Type        Predicted Total Ridership
2026-07-01      Wednesday          Weekday                         1,085,430
2026-07-02       Thursday          Weekday                         1,001,129
2026-07-03         Friday          Weekday                         1,052,524
2026-07-04       Saturday         Saturday                           752,671
2026-07-05         Sunday Sunday / Holiday                           556,614
2026-07-06         Monday          Weekday                         1,095,973
2026-07-07        Tuesday          Weekday                         1,074,029
```
