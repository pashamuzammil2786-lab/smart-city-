-- =============================================================================
-- Smart City Urban Analytics Platform - Relational SQL Schema
-- Target Database: MySQL 8.0+ / smart_city_db
-- Description: DDL definitions for public transit networks, GTFS timetables,
--              crowd prediction caches, and multi-domain analytics records.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS smart_city_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_city_db;

-- -----------------------------------------------------------------------------
-- 1. PUBLIC TRANSIT: Bus & Rail Stops
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS transit_stop_times;
DROP TABLE IF EXISTS transit_trips;
DROP TABLE IF EXISTS transit_routes;
DROP TABLE IF EXISTS transit_stops;

CREATE TABLE transit_stops (
    stop_id VARCHAR(50) PRIMARY KEY,
    stop_name VARCHAR(255) NOT NULL,
    zone_id VARCHAR(100),
    stop_lat DECIMAL(10, 8),
    stop_lon DECIMAL(11, 8),
    stop_desc TEXT,
    INDEX idx_stop_name (stop_name),
    INDEX idx_stop_lat_lon (stop_lat, stop_lon)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 2. PUBLIC TRANSIT: Routes
-- -----------------------------------------------------------------------------
CREATE TABLE transit_routes (
    route_id VARCHAR(50) PRIMARY KEY,
    route_long_name VARCHAR(255),
    agency_id VARCHAR(50) DEFAULT 'TGSRTC',
    route_type INT DEFAULT 3, -- 3 = Bus, 2 = Rail
    INDEX idx_route_name (route_long_name)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 3. PUBLIC TRANSIT: Trips
-- -----------------------------------------------------------------------------
CREATE TABLE transit_trips (
    trip_id VARCHAR(100) PRIMARY KEY,
    route_id VARCHAR(50) NOT NULL,
    service_id VARCHAR(50),
    direction_id INT DEFAULT 0,
    trip_short_name VARCHAR(255),
    INDEX idx_trips_route (route_id),
    CONSTRAINT fk_trips_route FOREIGN KEY (route_id)
        REFERENCES transit_routes (route_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 4. PUBLIC TRANSIT: Stop Times & Timetables
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 5. TRANSIT PREDICTIONS: Daily Demand & Crowding Forecast Cache
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transit_demand_forecasts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    forecast_date DATE NOT NULL UNIQUE,
    day_name VARCHAR(20) NOT NULL,
    day_type VARCHAR(30) NOT NULL,
    predicted_total_ridership INT NOT NULL,
    model_version VARCHAR(50) DEFAULT 'RandomForest-v1.0',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 6. SAVED TRIPS & USER PREFERENCES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_trip_searches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    origin_stop_id VARCHAR(50),
    destination_stop_id VARCHAR(50),
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recent_searches (searched_at)
) ENGINE=InnoDB;

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
