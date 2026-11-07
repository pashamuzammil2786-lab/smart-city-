-- =============================================================================
-- Migration: Add composite index on transit_stop_times (trip_id, stop_id)
-- Purpose: Accelerates join queries between trip_id and stop_id for multi-leg
--          interchange resolution and timetable lookups across 1.13M GTFS rows.
-- Database: smart_city_db (MySQL 8.4)
-- =============================================================================

USE smart_city_db;

-- Create composite index if not already present
SET @dbname = DATABASE();
SET @tablename = "transit_stop_times";
SET @indexname = "idx_st_trip_stop";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE table_schema = @dbname
      AND table_name = @tablename
      AND index_name = @indexname
  ) > 0,
  "SELECT 'Index idx_st_trip_stop already exists' AS status;",
  "ALTER TABLE transit_stop_times ADD INDEX idx_st_trip_stop (trip_id, stop_id);"
));
PREPARE addIndexIfNotExists FROM @preparedStatement;
EXECUTE addIndexIfNotExists;
DEALLOCATE PREPARE addIndexIfNotExists;
