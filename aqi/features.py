"""Shared data loading + feature engineering for the Air Quality module."""
import numpy as np
import pandas as pd

TARGET = "AQI"
BASE_COLS = ["PM2.5", "PM10", "NO2", "CO", "temperature", "humidity",
             "wind_speed", "rainfall", "traffic_congestion"]
REQUIRED = ["timestamp"] + BASE_COLS + [TARGET]


def load_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, parse_dates=["timestamp"])
    missing = [c for c in REQUIRED if c not in df.columns]
    if missing:
        raise ValueError(f"CSV is missing columns: {missing}")
    df = df.sort_values("timestamp").drop_duplicates("timestamp").reset_index(drop=True)
    # Clean: interpolate gaps, clip negatives
    df[BASE_COLS + [TARGET]] = (df[BASE_COLS + [TARGET]]
                                .interpolate(limit_direction="both").clip(lower=0))
    return df


def add_features(df: pd.DataFrame, horizon: int = 1) -> pd.DataFrame:
    """Build features. Target = AQI `horizon` hours ahead (short-term forecast)."""
    d = df.copy()
    d["hour"] = d["timestamp"].dt.hour
    d["dayofweek"] = d["timestamp"].dt.dayofweek
    d["month"] = d["timestamp"].dt.month
    d["is_weekend"] = (d["dayofweek"] >= 5).astype(int)
    d["hour_sin"] = np.sin(2 * np.pi * d["hour"] / 24)
    d["hour_cos"] = np.cos(2 * np.pi * d["hour"] / 24)
    # Lag / rolling features (current state -> future AQI)
    for lag in (1, 3, 6, 24):
        d[f"AQI_lag{lag}"] = d[TARGET].shift(lag)
    d["AQI_roll6"] = d[TARGET].rolling(6).mean()
    d["traffic_roll3"] = d["traffic_congestion"].rolling(3).mean()
    d["target"] = d[TARGET].shift(-horizon)
    return d.dropna().reset_index(drop=True)


def feature_columns(d: pd.DataFrame):
    drop = {"timestamp", "target"}
    return [c for c in d.columns if c not in drop]


def aqi_category(aqi: float) -> str:
    """Indian CPCB AQI categories."""
    if aqi <= 50: return "Good"
    if aqi <= 100: return "Satisfactory"
    if aqi <= 200: return "Moderate"
    if aqi <= 300: return "Poor"
    if aqi <= 400: return "Very Poor"
    return "Severe"
