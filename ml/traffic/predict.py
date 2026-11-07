"""
=============================================================================
Smart City Urban Analytics Platform - Traffic Module
Module 3: Traffic Flow & Congestion Prediction
Script: predict.py

Inference script: loads the trained traffic ML model and predicts vehicle count,
traffic congestion index, and travel delay.
=============================================================================
"""

import os
import sys
import json
import argparse
import numpy as np
import pandas as pd
import joblib


def load_model(model_path="ml/traffic/models/traffic_model.pkl"):
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Trained traffic model not found at: {model_path}. Please run train.py first.")
    return joblib.load(model_path)


def predict_traffic(junction=1, hour=18, dayofweek=2, is_weekend=0, weather_cond="Clear", incident=0, model_artifact=None):
    if model_artifact is None:
        model_artifact = load_model()
        
    model = model_artifact["model"]
    scaler = model_artifact["scaler"]
    features = model_artifact["features"]
    is_scaled = model_artifact["is_scaled"]
    
    # Baseline lags for estimation if raw historical buffer not supplied
    junction_means = {1: 45.0, 2: 28.0, 3: 15.0, 4: 8.0}
    base_vehicles = junction_means.get(junction, 25.0)
    
    hour_factor = 1.0
    if hour in [8, 9, 10, 11]:
        hour_factor = 1.65
    elif hour in [17, 18, 19, 20]:
        hour_factor = 1.85
    elif hour in [0, 1, 2, 3, 4, 5]:
        hour_factor = 0.35
        
    est_lag = base_vehicles * hour_factor
    
    row_data = {
        'hour': hour,
        'day': 15,
        'month': 6,
        'dayofweek': dayofweek,
        'is_weekend': 1 if dayofweek in [5, 6] else 0,
        'is_rush_hour': 1 if hour in [8, 9, 10, 11, 17, 18, 19, 20] else 0,
        'hour_sin': np.sin(2 * np.pi * hour / 24),
        'hour_cos': np.cos(2 * np.pi * hour / 24),
        'junction_1': 1 if junction == 1 else 0,
        'junction_2': 1 if junction == 2 else 0,
        'junction_3': 1 if junction == 3 else 0,
        'junction_4': 1 if junction == 4 else 0,
        'lag_1': est_lag,
        'lag_2': est_lag * 0.95,
        'lag_24': est_lag,
        'rolling_mean_6': est_lag * 0.98,
        'rolling_mean_24': base_vehicles
    }
    
    input_df = pd.DataFrame([row_data])[features]
    
    if is_scaled:
        input_scaled = scaler.transform(input_df)
        raw_pred = model.predict(input_scaled)[0]
    else:
        raw_pred = model.predict(input_df)[0]
        
    # Weather and incident adjustments
    weather_multiplier = 1.0
    if weather_cond.lower() == 'rain':
        weather_multiplier = 1.25
    elif weather_cond.lower() == 'storm':
        weather_multiplier = 1.40
    elif weather_cond.lower() == 'fog':
        weather_multiplier = 1.15
        
    incident_delay = 12.0 if incident else 0.0
    
    predicted_vehicles = max(1, int(round(raw_pred * weather_multiplier)))
    
    # Calculate Level of Service (LOS) and Delay
    capacity = 120
    v_c_ratio = predicted_vehicles / capacity
    if v_c_ratio < 0.4:
        los = "A (Free Flow)"
        congestion_pct = int(v_c_ratio * 100)
        delay_mins = 1 + incident_delay
    elif v_c_ratio < 0.6:
        los = "B (Reasonably Free)"
        congestion_pct = int(v_c_ratio * 100)
        delay_mins = 3 + incident_delay
    elif v_c_ratio < 0.75:
        los = "C (Stable Flow)"
        congestion_pct = int(v_c_ratio * 100)
        delay_mins = 6 + incident_delay
    elif v_c_ratio < 0.9:
        los = "D (Approaching Unstable)"
        congestion_pct = int(v_c_ratio * 100)
        delay_mins = 11 + incident_delay
    elif v_c_ratio < 1.0:
        los = "E (Unstable Flow)"
        congestion_pct = int(v_c_ratio * 100)
        delay_mins = 18 + incident_delay
    else:
        los = "F (Forced Breakdown / Gridlock)"
        congestion_pct = min(100, int(v_c_ratio * 100))
        delay_mins = 25 + incident_delay
        
    tti = round(1.0 + (delay_mins / 20.0), 2)
    
    return {
        "junction": junction,
        "hour": hour,
        "predicted_vehicles_per_hour": predicted_vehicles,
        "level_of_service": los,
        "congestion_percentage": congestion_pct,
        "estimated_delay_mins": int(round(delay_mins)),
        "travel_time_index": tti,
        "weather_impact": f"{int((weather_multiplier - 1.0)*100)}% increase" if weather_multiplier > 1.0 else "Normal",
        "incident_active": bool(incident)
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--junction", type=int, default=1, choices=[1, 2, 3, 4])
    parser.add_argument("--hour", type=int, default=18)
    parser.add_argument("--dayofweek", type=int, default=2)
    parser.add_argument("--weather", type=str, default="Clear")
    parser.add_argument("--incident", type=int, default=0)
    args = parser.parse_args()
    
    result = predict_traffic(
        junction=args.junction,
        hour=args.hour,
        dayofweek=args.dayofweek,
        weather_cond=args.weather,
        incident=args.incident
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
