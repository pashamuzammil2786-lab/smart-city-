"""
Generate a synthetic Hyderabad air-quality dataset (hourly) for development.

Columns mirror the features used in the literature (Zheng 2015, Cabrera 2020, Kala 2020):
  - pollutants: PM2.5, PM10, NO2, CO
  - weather:    temperature, humidity, wind_speed, rainfall
  - traffic:    traffic_congestion (0-1 index)
  - time:       timestamp
  - target:     AQI

REPLACE with real data: put your CSV at data/air_quality.csv with the same column
names (see README) and skip this script.

Usage:
    python generate_data.py --days 1095 --out data/air_quality.csv
"""
import argparse
import os

import numpy as np
import pandas as pd


def pm25_to_aqi(pm25: np.ndarray) -> np.ndarray:
    """Indian CPCB AQI sub-index for PM2.5 (ug/m3), piecewise linear."""
    bp = [(0, 30, 0, 50), (30, 60, 51, 100), (60, 90, 101, 200),
          (90, 120, 201, 300), (120, 250, 301, 400), (250, 500, 401, 500)]
    aqi = np.zeros_like(pm25, dtype=float)
    for lo, hi, ilo, ihi in bp:
        m = (pm25 >= lo) & (pm25 <= hi)
        aqi[m] = (ihi - ilo) / (hi - lo) * (pm25[m] - lo) + ilo
    aqi[pm25 > 500] = 500
    return aqi


def generate(days: int = 365, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    ts = pd.date_range("2025-01-01", periods=days * 24, freq="h")
    n = len(ts)
    hour = ts.hour.values
    doy = ts.dayofyear.values
    dow = ts.dayofweek.values

    # Weather (Hyderabad-like seasonality)
    temperature = 27 + 6 * np.sin(2 * np.pi * (doy - 90) / 365) \
        + 4 * np.sin(2 * np.pi * (hour - 9) / 24) + rng.normal(0, 1, n)
    monsoon = np.exp(-((doy - 220) ** 2) / (2 * 35 ** 2))  # Jun-Sep peak
    humidity = np.clip(45 + 35 * monsoon - 0.8 * (temperature - 27)
                       + rng.normal(0, 5, n), 15, 100)
    wind_speed = np.clip(8 + 3 * monsoon + rng.normal(0, 2.5, n), 0.5, 30)
    rainfall = np.clip(rng.exponential(1.0, n) * monsoon * (rng.random(n) < 0.25) * 6, 0, 60)

    # Traffic congestion: rush-hour peaks, lower on weekends, worse in rain
    rush = np.exp(-((hour - 9) ** 2) / 8) + np.exp(-((hour - 18) ** 2) / 8)
    traffic = np.clip(0.25 + 0.55 * rush - 0.12 * (dow >= 5)
                      + 0.01 * rainfall + rng.normal(0, 0.05, n), 0, 1)

    # Pollutants driven by traffic, wind, rain, winter inversion
    winter = np.exp(-((doy - 15) ** 2) / (2 * 40 ** 2)) + np.exp(-((doy - 365) ** 2) / (2 * 40 ** 2))
    pm25 = np.clip(35 + 70 * traffic + 40 * winter - 2.5 * wind_speed
                   - 1.5 * rainfall + rng.normal(0, 8, n), 5, 450)
    pm10 = np.clip(pm25 * 1.7 + rng.normal(0, 10, n), 10, 700)
    no2 = np.clip(20 + 55 * traffic - 0.8 * wind_speed + rng.normal(0, 6, n), 5, 250)
    co = np.clip(0.4 + 1.6 * traffic + rng.normal(0, 0.15, n), 0.1, 8)

    aqi = np.clip(pm25_to_aqi(pm25) + 0.1 * (pm10 - 1.7 * pm25) + rng.normal(0, 4, n), 0, 500)

    return pd.DataFrame({
        "timestamp": ts, "PM2.5": pm25.round(2), "PM10": pm10.round(2),
        "NO2": no2.round(2), "CO": co.round(3),
        "temperature": temperature.round(2), "humidity": humidity.round(2),
        "wind_speed": wind_speed.round(2), "rainfall": rainfall.round(2),
        "traffic_congestion": traffic.round(3), "AQI": aqi.round(1),
    })


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=1095)
    ap.add_argument("--out", default="data/air_quality.csv")
    args = ap.parse_args()
    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    df = generate(args.days)
    df.to_csv(args.out, index=False)
    print(f"Saved {len(df)} rows -> {args.out}")
