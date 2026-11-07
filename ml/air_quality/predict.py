"""
=============================================================================
Smart City Urban Analytics Platform - Air Quality Module
Module 4: Ambient Air Quality & NAQI Multi-Source Fusion Forecasting
Script: predict.py

Inference script: loads the trained Support Vector Regressor (SVR) model artifact
and forecasts the 1-hour ahead Air Quality Index (AQI), CPCB NAQI category,
and public health advisory.
=============================================================================
"""

import os
import sys
import json
import argparse
import numpy as np
import pandas as pd
import joblib

try:
    from features import aqi_category
except ImportError:
    # Fallback CPCB category mapper
    def aqi_category(aqi: float) -> str:
        if aqi <= 50: return "Good"
        if aqi <= 100: return "Satisfactory"
        if aqi <= 200: return "Moderate"
        if aqi <= 300: return "Poor"
        if aqi <= 400: return "Very Poor"
        return "Severe"


def load_model(model_path=None):
    if model_path is None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        candidates = [
            os.path.join(base_dir, "models", "aqi_model.joblib"),
            os.path.join(base_dir, "aqi_model.joblib"),
            os.path.join("ml", "air_quality", "models", "aqi_model.joblib")
        ]
        for p in candidates:
            if os.path.exists(p):
                model_path = p
                break

    if not model_path or not os.path.exists(model_path):
        raise FileNotFoundError(f"Trained AQI model not found at {model_path}. Run train.py first.")

    return joblib.load(model_path)


def predict_from_features(row_dict, model_artifact=None):
    if model_artifact is None:
        model_artifact = load_model()

    model = model_artifact["model"]
    feature_names = model_artifact["features"]

    df_row = pd.DataFrame([row_dict])
    for col in feature_names:
        if col not in df_row.columns:
            df_row[col] = 0.0

    X = df_row[feature_names]
    pred_val = float(model.predict(X)[0])
    pred_val = max(0.0, round(pred_val, 1))

    category = aqi_category(pred_val)
    return {
        "predicted_aqi": pred_val,
        "category": category,
        "model": model_artifact.get("name", "SVR"),
        "horizon_hours": model_artifact.get("horizon", 1)
    }


def predict_aqi(pm25=55.0, pm10=110.0, no2=45.0, co=1.2, temp=28.0,
                humidity=55.0, wind=8.0, rainfall=0.0, traffic=0.65,
                hour=14, dayofweek=2, month=5, current_aqi=None,
                model_artifact=None):
    """
    Convenience function to predict next-hour AQI from direct environmental metrics.
    """
    if current_aqi is None:
        # Approximate current AQI from PM2.5 baseline
        current_aqi = max(pm25 * 1.8, pm10 * 0.9)

    is_weekend = 1 if dayofweek >= 5 else 0
    hour_sin = np.sin(2 * np.pi * hour / 24)
    hour_cos = np.cos(2 * np.pi * hour / 24)

    row = {
        'PM2.5': float(pm25),
        'PM10': float(pm10),
        'NO2': float(no2),
        'CO': float(co),
        'temperature': float(temp),
        'humidity': float(humidity),
        'wind_speed': float(wind),
        'rainfall': float(rainfall),
        'traffic_congestion': float(traffic),
        'AQI': float(current_aqi),
        'hour': int(hour),
        'dayofweek': int(dayofweek),
        'month': int(month),
        'is_weekend': int(is_weekend),
        'hour_sin': float(hour_sin),
        'hour_cos': float(hour_cos),
        'AQI_lag1': float(current_aqi),
        'AQI_lag3': float(current_aqi * 0.98),
        'AQI_lag6': float(current_aqi * 0.95),
        'AQI_lag24': float(current_aqi),
        'AQI_roll6': float(current_aqi),
        'traffic_roll3': float(traffic)
    }

    return predict_from_features(row, model_artifact)


def main():
    parser = argparse.ArgumentParser(description="Predict 1-Hour Ahead AQI using trained SVR model")
    parser.add_argument("--pm25", type=float, default=58.5, help="PM2.5 concentration in ug/m3")
    parser.add_argument("--pm10", type=float, default=114.0, help="PM10 concentration in ug/m3")
    parser.add_argument("--no2", type=float, default=48.0, help="NO2 concentration in ug/m3")
    parser.add_argument("--co", type=float, default=1.35, help="CO concentration in mg/m3")
    parser.add_argument("--temp", type=float, default=29.0, help="Ambient temperature in C")
    parser.add_argument("--humidity", type=float, default=52.0, help="Relative humidity in percent")
    parser.add_argument("--wind", type=float, default=7.5, help="Wind speed in km/h")
    parser.add_argument("--traffic", type=float, default=0.72, help="Traffic congestion index (0 to 1)")
    parser.add_argument("--hour", type=int, default=18, help="Hour of the day (0-23)")
    parser.add_argument("--model", type=str, default=None, help="Path to aqi_model.joblib")

    args = parser.parse_args()

    try:
        artifact = load_model(args.model)
        result = predict_aqi(
            pm25=args.pm25,
            pm10=args.pm10,
            no2=args.no2,
            co=args.co,
            temp=args.temp,
            humidity=args.humidity,
            wind=args.wind,
            traffic=args.traffic,
            hour=args.hour,
            model_artifact=artifact
        )
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
