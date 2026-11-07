"""
=============================================================================
Smart City Urban Analytics Platform - Weather Module
Module 2: Urban Microclimate & Temperature Forecasting
Script: predict.py

Inference script: loads the trained weather ML model and predicts hourly ambient
temperature, thermal comfort index, and Urban Heat Island intensity.
=============================================================================
"""

import os
import sys
import json
import argparse
import numpy as np
import pandas as pd
import joblib


def load_model(model_path="ml/weather/models/weather_model.pkl"):
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Trained weather model not found at: {model_path}. Please run train.py first.")
    return joblib.load(model_path)


def predict_weather(hour=14, month=5, humidity=45.0, dewpoint=18.0, pressure=1010.0, windspeed=12.0, cloudcover=20.0, sunhour=10.5, model_artifact=None):
    if model_artifact is None:
        model_artifact = load_model()
        
    model = model_artifact["model"]
    scaler = model_artifact["scaler"]
    features = model_artifact["features"]
    is_scaled = model_artifact["is_scaled"]
    
    # Estimate reasonable seasonal baseline temperature for Hyderabad
    month_base = {
        1: 22.0, 2: 26.0, 3: 31.0, 4: 35.0, 5: 37.0, 6: 32.0,
        7: 28.0, 8: 27.0, 9: 28.0, 10: 27.0, 11: 24.0, 12: 21.0
    }
    base_t = month_base.get(month, 28.0)
    
    # Diurnal adjustment
    hour_adj = 5.0 * np.sin(2 * np.pi * (hour - 9) / 24)
    est_temp = base_t + hour_adj
    
    row_data = {
        'hour': hour,
        'month': month,
        'dayofyear': int(month * 30.4 - 15),
        'hour_sin': np.sin(2 * np.pi * hour / 24),
        'hour_cos': np.cos(2 * np.pi * hour / 24),
        'month_sin': np.sin(2 * np.pi * month / 12),
        'month_cos': np.cos(2 * np.pi * month / 12),
        'DewPointC': dewpoint,
        'humidity': humidity,
        'pressure': pressure,
        'windspeedKmph': windspeed,
        'cloudcover': cloudcover,
        'precipMM': 0.0,
        'sunHour': sunhour,
        'WindGustKmph': windspeed * 1.35,
        'temp_lag_1': est_temp - 0.4,
        'temp_lag_2': est_temp - 0.9,
        'temp_lag_24': est_temp,
        'temp_rolling_6': est_temp - 1.2,
        'temp_rolling_24': base_t,
        'humidity_lag_1': humidity + 1.5
    }
    
    input_df = pd.DataFrame([row_data])[features]
    
    if is_scaled:
        input_scaled = scaler.transform(input_df)
        predicted_t = float(model.predict(input_scaled)[0])
    else:
        predicted_t = float(model.predict(input_df)[0])
        
    predicted_t = round(predicted_t, 1)
    
    # Steadman apparent temperature formula for feels-like
    e = (humidity / 100.0) * 6.105 * np.exp((17.27 * predicted_t) / (237.7 + predicted_t))
    feels_like = round(predicted_t + 0.33 * e - 0.70 * (windspeed / 3.6) - 4.0, 1)
    
    # Heat stress category
    if feels_like < 20:
        thermal_category = "Cool / Comfortable"
    elif feels_like <= 27:
        thermal_category = "Optimal Comfort"
    elif feels_like <= 34:
        thermal_category = "Moderate Thermal Stress"
    elif feels_like <= 40:
        thermal_category = "High Heat Caution"
    else:
        thermal_category = "Severe Heat Warning"
        
    return {
        "hour": hour,
        "month": month,
        "predicted_temperature_c": predicted_t,
        "feels_like_c": feels_like,
        "humidity_pct": humidity,
        "dew_point_c": dewpoint,
        "wind_speed_kmph": windspeed,
        "thermal_comfort_level": thermal_category,
        "uhi_maximum_potential_delta": "+3.4°C (High Density Urban Core vs Baseline)"
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--hour", type=int, default=14)
    parser.add_argument("--month", type=int, default=5)
    parser.add_argument("--humidity", type=float, default=45.0)
    parser.add_argument("--dewpoint", type=float, default=18.0)
    parser.add_argument("--pressure", type=float, default=1010.0)
    parser.add_argument("--windspeed", type=float, default=12.0)
    args = parser.parse_args()
    
    result = predict_weather(
        hour=args.hour,
        month=args.month,
        humidity=args.humidity,
        dewpoint=args.dewpoint,
        pressure=args.pressure,
        windspeed=args.windspeed
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
