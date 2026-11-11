# Database Setup & Schema Guide

This directory contains the database definition and migrations for the **Smart City Urban Analytics Platform**.

## Engine & Requirements
- **Database Engine**: MySQL 8.4 LTS
- **Default Database Name**: `smart_city_db`
- **Default Port**: `3306`

## Files
- `schema.sql`: Core database schema defining `users`, `transit_routes`, `transit_trips`, `transit_stops`, and `transit_stop_times`.
- `migrations/add_composite_index.sql`: Composite performance indexes (`idx_stop_times_trip_seq`, `idx_stop_times_stop_seq`) for high-throughput GTFS timetable queries.

## Initializing the Database

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS smart_city_db;"
mysql -u root -p smart_city_db < database/schema.sql
mysql -u root -p smart_city_db < database/migrations/add_composite_index.sql
```

Ensure the credentials in `.env` match your local MySQL configuration:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smart_city_db
```
