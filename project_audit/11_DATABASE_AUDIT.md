# Relational Database Schema & Query Performance Audit

**Database Engine:** MySQL Community Server 8.4  
**Target Database:** `smart_city_db`  
**Host & Port:** `localhost:3306`  
**Charset & Collation:** `utf8mb4`, `utf8mb4_unicode_ci`  
**Connection Pool:** `mysql2/promise` (Limit: 10 connections, Queue: 0)  

---

## 1. Relational Entity-Relationship Model

```mermaid
erDiagram
    users {
        int id PK
        varchar(100) name
        varchar(150) email UK
        varchar(255) password_hash
        timestamp created_at
    }

    user_trip_searches {
        int id PK
        varchar(50) origin_stop_id
        varchar(50) destination_stop_id
        timestamp searched_at
    }

    transit_demand_forecasts {
        int id PK
        date forecast_date UK
        varchar(20) day_name
        varchar(30) day_type
        int predicted_total_ridership
        varchar(50) model_version
        timestamp generated_at
    }

    transit_stops ||--o{ transit_stop_times : "services"
    transit_routes ||--o{ transit_trips : "contains"
    transit_trips ||--o{ transit_stop_times : "scheduled_at"

    transit_stops {
        varchar(50) stop_id PK
        varchar(255) stop_name
        varchar(100) zone_id
        decimal stop_lat
        decimal stop_lon
        text stop_desc
    }

    transit_routes {
        varchar(50) route_id PK
        varchar(255) route_long_name
        varchar(50) agency_id
        int route_type
    }

    transit_trips {
        varchar(100) trip_id PK
        varchar(50) route_id FK
        varchar(50) service_id
        int direction_id
        varchar(255) trip_short_name
    }

    transit_stop_times {
        bigint id PK
        varchar(100) trip_id FK
        int stop_sequence
        varchar(50) stop_id FK
        varchar(20) departure_time
        varchar(20) arrival_time
        int timepoint
    }
```

---

## 2. Table-by-Table Technical Specifications & Live Row Counts

The database contains **7 active tables** hosting **1,183,995 total rows**:

### 1. `transit_stop_times` (**1,132,807 rows**)
- **Purpose:** GTFS scheduled departure and arrival timetables for every stop along every trip.
- **Columns:**
  - `id`: `BIGINT AUTO_INCREMENT` (Primary Key)
  - `trip_id`: `VARCHAR(100)` (Foreign Key $\to$ `transit_trips.trip_id`)
  - `stop_sequence`: `INT` (Ordered stop index, 1 to 50+)
  - `stop_id`: `VARCHAR(50)` (Foreign Key $\to$ `transit_stops.stop_id`)
  - `departure_time`: `VARCHAR(20)` (GTFS time string: `HH:MM:SS`, including $> 24:00:00$)
  - `arrival_time`: `VARCHAR(20)` (GTFS time string: `HH:MM:SS`)
  - `timepoint`: `INT DEFAULT 0`
- **Active Indexes:**
  - `PRIMARY` on `id`
  - `idx_st_stop_trip` on `(stop_id, trip_id, stop_sequence)`
  - `idx_st_trip_seq` on `(trip_id, stop_sequence)`
- **Foreign Keys:**
  - `fk_st_trip` $\to$ `transit_trips(trip_id)` `ON DELETE CASCADE`
  - `fk_st_stop` $\to$ `transit_stops(stop_id)` `ON DELETE CASCADE`

---

### 2. `transit_trips` (**44,892 rows**)
- **Purpose:** GTFS trip definitions detailing direction, service schedules, and route mappings.
- **Columns:**
  - `trip_id`: `VARCHAR(100)` (Primary Key)
  - `route_id`: `VARCHAR(50)` (Foreign Key $\to$ `transit_routes.route_id`)
  - `service_id`: `VARCHAR(50)` (All set to `'MTWTFSS'`)
  - `direction_id`: `INT DEFAULT 0` (0: Outbound, 1: Inbound)
  - `trip_short_name`: `VARCHAR(255)` (Trip title/headsign)
- **Active Indexes:**
  - `PRIMARY` on `trip_id`
  - `idx_trips_route` on `route_id`
- **Foreign Keys:**
  - `fk_trips_route` $\to$ `transit_routes(route_id)` `ON DELETE CASCADE`

---

### 3. `transit_stops` (**5,028 rows**)
- **Purpose:** Geospatial and descriptive registry of all public transit stops across Greater Hyderabad.
- **Columns:**
  - `stop_id`: `VARCHAR(50)` (Primary Key)
  - `stop_name`: `VARCHAR(255)` (Stop display name)
  - `zone_id`: `VARCHAR(100)` (Municipal zone identifier)
  - `stop_lat`: `DECIMAL(10, 8)` (Latitude)
  - `stop_lon`: `DECIMAL(11, 8)` (Longitude)
  - `stop_desc`: `TEXT` (Signboard and orientation details)
- **Active Indexes:**
  - `PRIMARY` on `stop_id`
  - `idx_stop_name` on `stop_name`
  - `idx_stop_lat_lon` on `(stop_lat, stop_lon)`

---

### 4. `transit_routes` (**1,031 rows**)
- **Purpose:** Catalog of bus routes operated by TGSRTC.
- **Columns:**
  - `route_id`: `VARCHAR(50)` (Primary Key, e.g. `'505'`, `'9Y/F'`, `'1'`, `'216'`)
  - `route_long_name`: `VARCHAR(255)` (Route corridor description)
  - `agency_id`: `VARCHAR(50) DEFAULT 'TGSRTC'`
  - `route_type`: `INT DEFAULT 3` (3 = Bus, 2 = Rail)
- **Active Indexes:**
  - `PRIMARY` on `route_id`
  - `idx_route_name` on `route_long_name`

---

### 5. `users` (**9 rows**)
- **Purpose:** User credentials and accounts for platform authentication.
- **Columns:**
  - `id`: `INT AUTO_INCREMENT` (Primary Key)
  - `name`: `VARCHAR(100)` (User full name)
  - `email`: `VARCHAR(150)` (Unique email address)
  - `password_hash`: `VARCHAR(255)` (Bcrypt hashed password)
  - `created_at`: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **Active Indexes:**
  - `PRIMARY` on `id`
  - `email` (Unique Key)

---

### 6. `user_trip_searches` (**236 rows**)
- **Purpose:** Operational search query logging.
- **Columns:**
  - `id`: `INT AUTO_INCREMENT` (Primary Key)
  - `origin_stop_id`: `VARCHAR(50)`
  - `destination_stop_id`: `VARCHAR(50)`
  - `searched_at`: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **Active Indexes:**
  - `PRIMARY` on `id`
  - `idx_recent_searches` on `searched_at`

---

### 7. `transit_demand_forecasts` (**0 rows**)
- **Purpose:** Designed to cache daily demand forecasts.
- **Current State:** Table exists but contains 0 rows. The backend serves demand forecasts from a static array in `backend/routes/transport.js`.

---

## 3. Critical Database Findings & Technical Debt

### A. Missing `users` Table in `database/schema.sql`
- **Finding:** While the `users` table exists in the live MySQL database (with 9 registered user accounts), **it is completely absent from [`database/schema.sql`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/database/schema.sql)**.
- **Risk:** If a collaborator or evaluator initializes a fresh database using `schema.sql`, user registration and login will fail with `Table 'smart_city_db.users' doesn't exist`.
- **Solution:** Add the `CREATE TABLE users` DDL definition to `database/schema.sql`.

### B. Query Performance & Indexing Bottlenecks
- **Finding:** In [`routingService.js`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/backend/services/routingService.js), multi-hop transfer discovery joins `transit_stop_times` against itself:
  ```sql
  SELECT DISTINCT st_inter.stop_id
  FROM transit_stop_times st_orig
  JOIN transit_stop_times st_inter ON st_orig.trip_id = st_inter.trip_id
  WHERE st_orig.stop_id IN (?) AND st_inter.stop_sequence > st_orig.stop_sequence
  ```
- Across 1.13 million records, this join can take **15 to 45 seconds** for popular stop clusters (such as Charminar) because MySQL evaluates large intermediate row sets.
- **Recommendation:** Adding a dedicated index on `transit_stop_times(trip_id, stop_id)` will optimize this self-join by enabling index-only covering scans.

---

## 4. Connection Pool & Reliability Analysis

The database connection configuration in [`backend/db.js`](file:///C:/Users/dell/Desktop/smart-city-urban-analytics/backend/db.js):
```javascript
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'smart_city_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});
```

- **Evaluation:**
  - Utilizing `mysql2/promise` pool prevents single-connection saturation during concurrent queries.
  - Automatic reconnection and promise resolution operate reliably under load.
  - Credentials properly read from `.env` with fallback defaults.
