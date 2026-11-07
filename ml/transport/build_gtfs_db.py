"""
=============================================================================
Smart City Urban Analytics Platform - Transport ML Module
Script: build_gtfs_db.py

Description:
Ingests official TGSRTC GTFS feeds (stops, routes, trips, stop_times)
directly into MySQL Server (smart_city_db) using high-speed batch transactions.
Enables sub-second Origin-to-Destination SQL queries and spatial transit analytics.
=============================================================================
"""

import os
import time
import pandas as pd
import pymysql
from dotenv import load_dotenv

# Load database configuration from root .env
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
load_dotenv(os.path.join(project_root, ".env"))

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "root")
DB_NAME = os.getenv("DB_NAME", "smart_city_db")


def get_db_connection():
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False
    )


def populate_mysql_gtfs():
    opencity_dir = os.path.join(current_dir, "dataset", "opencity")
    gtfs_dir = os.path.join(opencity_dir, "gtfs_tgsrtc_extracted")

    stops_csv = os.path.join(opencity_dir, "hyd_stops.csv")
    routes_txt = os.path.join(gtfs_dir, "routes.txt")
    trips_txt = os.path.join(gtfs_dir, "trips.txt")
    stop_times_txt = os.path.join(gtfs_dir, "stop_times.txt")

    print("=" * 70)
    print("INGESTING GTFS HYDERABAD DATASET INTO MYSQL (smart_city_db)")
    print(f"Host: {DB_HOST}:{DB_PORT} | Database: {DB_NAME} | User: {DB_USER}")
    print("=" * 70)

    start_total = time.time()
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Disable foreign key and unique checks for high-speed batch loading
        cur.execute("SET foreign_key_checks = 0;")
        cur.execute("SET unique_checks = 0;")

        # 1. Ingest STOPS
        print("\n[1/4] Ingesting Stops (hyd_stops.csv)...")
        t0 = time.time()
        cur.execute("TRUNCATE TABLE transit_stops;")
        df_stops = pd.read_csv(stops_csv)
        df_stops.columns = [c.strip() for c in df_stops.columns]
        
        stops_records = []
        for _, row in df_stops.iterrows():
            stops_records.append((
                str(row.get('stop_id', '')),
                str(row.get('stop_name', '')),
                str(row.get('zone_id', '')),
                float(row.get('stop_lat', 0.0)) if pd.notnull(row.get('stop_lat')) else None,
                float(row.get('stop_lon', 0.0)) if pd.notnull(row.get('stop_lon')) else None,
                str(row.get('stop_desc', ''))
            ))

        sql_stops = """
            INSERT INTO transit_stops (stop_id, stop_name, zone_id, stop_lat, stop_lon, stop_desc)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cur.executemany(sql_stops, stops_records)
        conn.commit()
        print(f"      Loaded {len(stops_records):,} stops in {time.time() - t0:.2f}s")

        # 2. Ingest ROUTES
        print("\n[2/4] Ingesting Routes (routes.txt)...")
        t0 = time.time()
        cur.execute("TRUNCATE TABLE transit_routes;")
        df_routes = pd.read_csv(routes_txt)
        df_routes.columns = [c.strip() for c in df_routes.columns]

        routes_records = []
        for _, row in df_routes.iterrows():
            routes_records.append((
                str(row.get('route_id', '')),
                str(row.get('route_long_name', '')),
                str(row.get('agency_id', 'TGSRTC')),
                int(row.get('route_type', 3)) if pd.notnull(row.get('route_type')) else 3
            ))

        sql_routes = """
            INSERT INTO transit_routes (route_id, route_long_name, agency_id, route_type)
            VALUES (%s, %s, %s, %s)
        """
        cur.executemany(sql_routes, routes_records)
        conn.commit()
        print(f"      Loaded {len(routes_records):,} routes in {time.time() - t0:.2f}s")

        # 3. Ingest TRIPS
        print("\n[3/4] Ingesting Trips (trips.txt)...")
        t0 = time.time()
        cur.execute("TRUNCATE TABLE transit_trips;")
        df_trips = pd.read_csv(trips_txt)
        df_trips.columns = [c.strip() for c in df_trips.columns]

        trips_records = []
        for _, row in df_trips.iterrows():
            trips_records.append((
                str(row.get('trip_id', '')),
                str(row.get('route_id', '')),
                str(row.get('service_id', '')),
                int(row.get('direction_id', 0)) if pd.notnull(row.get('direction_id')) else 0,
                str(row.get('trip_short_name', ''))
            ))

        sql_trips = """
            INSERT INTO transit_trips (trip_id, route_id, service_id, direction_id, trip_short_name)
            VALUES (%s, %s, %s, %s, %s)
        """
        batch_size = 10000
        for i in range(0, len(trips_records), batch_size):
            cur.executemany(sql_trips, trips_records[i:i + batch_size])
            conn.commit()
        print(f"      Loaded {len(trips_records):,} trips in {time.time() - t0:.2f}s")

        # 4. Ingest STOP_TIMES in chunks
        print("\n[4/4] Ingesting Stop Times (stop_times.txt - 1.13M rows)...")
        t0 = time.time()
        cur.execute("TRUNCATE TABLE transit_stop_times;")
        
        sql_st = """
            INSERT INTO transit_stop_times (trip_id, stop_sequence, stop_id, departure_time, arrival_time, timepoint)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        
        chunk_size = 50000
        total_st = 0
        for chunk in pd.read_csv(stop_times_txt, chunksize=chunk_size):
            chunk.columns = [c.strip() for c in chunk.columns]
            batch = [
                (
                    str(r['trip_id']),
                    int(r['stop_sequence']),
                    str(r['stop_id']),
                    str(r['departure_time']),
                    str(r['arrival_time']),
                    int(r.get('timepoint', 0)) if pd.notnull(r.get('timepoint')) else 0
                )
                for _, r in chunk.iterrows()
            ]
            cur.executemany(sql_st, batch)
            conn.commit()
            total_st += len(batch)
            print(f"      Loaded {total_st:,} rows...")

        print(f"      Completed {total_st:,} stop_time rows in {time.time() - t0:.2f}s")

        # Re-enable checks
        cur.execute("SET foreign_key_checks = 1;")
        cur.execute("SET unique_checks = 1;")
        conn.commit()

        print("\n" + "=" * 70)
        print("ALL GTFS TABLES SUCCESSFULLY LOADED INTO MYSQL (smart_city_db)!")
        print(f"Total Ingestion Time: {time.time() - start_total:.2f}s")
        print("=" * 70)

    except Exception as e:
        conn.rollback()
        print(f"\n[ERROR] Failed to ingest data into MySQL: {e}")
        raise e
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    populate_mysql_gtfs()
