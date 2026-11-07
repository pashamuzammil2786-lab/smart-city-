# Smart City Urban Analytics Platform — Database Changes Report
**Document ID:** `project_fix_report/04_DATABASE_CHANGES.md`  
**Project:** Data Analytics for Smart Cities — Urban Analytics and Predictive Decision Support Platform  
**Target RDBMS:** MySQL 8.4 Community Server  
**Target Schema:** `smart_city_db`  

---

## 1. Executive Summary

This report provides complete documentation of all database alterations, schema synchronizations, and index optimizations implemented in MySQL 8.4 (`smart_city_db`). All changes preserve the existing relational architecture, improve query latency across 1.13 million GTFS timetable records, and resolve schema drift.

---

## 2. Table Inventory and Record Counts

The live MySQL database `smart_city_db` contains 7 relational tables:

```
┌───────────────────────────┬───────────────┬─────────────────────────────────────────────────────────┐
│ Table Name                │ Record Count  │ Description / Domain                                    │
├───────────────────────────┼───────────────┼─────────────────────────────────────────────────────────┤
│ transit_stops             │ 5,028 rows    │ Hyderabad TGSRTC bus & MMTS rail stations with GPS locs │
│ transit_routes            │ 1,031 rows    │ Bus and suburban rail transit line definitions          │
│ transit_trips             │ 44,892 rows   │ Scheduled trips across directional routes               │
│ transit_stop_times        │ 1,132,807 rows│ Stop sequences, scheduled arrival & departure times     │
│ transit_demand_forecasts  │ 7 rows        │ Cached multi-day aggregate passenger volume forecasts   │
│ user_trip_searches        │ 236 rows      │ User origin-destination search history logs             │
│ users                     │ 9 rows        │ Registered user accounts, bcrypt password hashes, JWT   │
└───────────────────────────┴───────────────┴─────────────────────────────────────────────────────────┘
```

---

## 3. Schema DDL Synchronizations in `database/schema.sql`

### 3.1 Addition of `users` Table Definition
The `users` table was present in the live database but missing from `database/schema.sql`. The following DDL was added to ensure complete reproducibility:

```sql
-- -----------------------------------------------------------------------------
-- 7. USER ACCOUNTS & AUTHENTICATION
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_email (email)
) ENGINE=InnoDB;
```

### 3.2 Addition of Composite Index on `transit_stop_times`
In `database/schema.sql`, the DDL for `transit_stop_times` was updated to declare the composite index `idx_st_trip_stop`:

```sql
CREATE TABLE transit_stop_times (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trip_id VARCHAR(100) NOT NULL,
    stop_sequence INT NOT NULL,
    stop_id VARCHAR(50) NOT NULL,
    departure_time VARCHAR(20) NOT NULL,
    arrival_time VARCHAR(20) NOT NULL,
    timepoint INT DEFAULT 0,
    INDEX idx_st_stop_trip (stop_id, trip_id, stop_sequence),
    INDEX idx_st_trip_seq (trip_id, stop_sequence),
    INDEX idx_st_trip_stop (trip_id, stop_id),
    CONSTRAINT fk_st_trip FOREIGN KEY (trip_id)
        REFERENCES transit_trips (trip_id) ON DELETE CASCADE,
    CONSTRAINT fk_st_stop FOREIGN KEY (stop_id)
        REFERENCES transit_stops (stop_id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

---

## 4. Live Database Migration: `idx_st_trip_stop`

### 4.1 Migration Script (`database/migrations/add_composite_index.sql`)
To apply the index to the live MySQL database without disrupting table data, the following migration was executed:

```sql
USE smart_city_db;

ALTER TABLE transit_stop_times 
ADD INDEX idx_st_trip_stop (trip_id, stop_id);
```

### 4.2 Migration Execution & Verification Output
The migration was executed via Node.js MySQL driver with the following verified result:

```
Applying migration...
[MySQL] Successfully connected to database: smart_city_db
Migration succeeded: ResultSetHeader {
  fieldCount: 0,
  affectedRows: 0,
  insertId: 0,
  info: 'Records: 0  Duplicates: 0  Warnings: 0',
  serverStatus: 2,
  warningStatus: 0,
  changedRows: 0
}
Verified index: [
  { Key_name: 'idx_st_trip_stop', Column_name: 'trip_id' },
  { Key_name: 'idx_st_trip_stop', Column_name: 'stop_id' }
]
```

### 4.3 Query Performance Impact
- **Before Migration:** Queries matching `st1.trip_id = st2.trip_id AND st2.stop_id IN (?)` had to perform partial index traversals across `idx_st_trip_seq`, inspecting sequence columns before matching `stop_id`.
- **After Migration:** The composite B-Tree index on `(trip_id, stop_id)` allows direct composite key lookups in $O(\log N)$ time, accelerating multi-leg transfer joins across 1,132,807 rows.
