"""
=============================================================================
Smart City Urban Analytics Platform - Transport ML Module
Module: Public Transport Passenger Demand Forecasting
Script: predict.py

Description:
This script loads the trained best Machine Learning model (Random Forest /
Gradient Boosting) and performs passenger ridership predictions for future
dates or specific date scenarios.

Usage:
  1. As a standalone script:
     python predict.py
  2. As a module imported by the Backend API / Frontend:
     from predict import predict_demand_for_date, forecast_upcoming_days
=============================================================================
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta


def load_trained_model():
    """
    Load the saved model bundle containing the model, scaler, and feature definitions.
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, "models", "transport_demand_model.pkl")
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Trained model not found at {model_path}. "
            "Please run 'python train.py' first to train and save the model."
        )
    
    artifact = joblib.load(model_path)
    return artifact


def forecast_upcoming_days(num_days: int = 7) -> list:
    """
    Forecast passenger demand for the next `num_days` using the latest available
    historical context and recursive lag updates.
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, "dataset", "historical_ridership", "historical_transit_ridership.csv")
    
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Historical dataset not found at {data_path}")
    
    # 1. Load trained model artifact
    artifact = load_trained_model()
    model = artifact["model"]
    scaler = artifact["scaler"]
    feature_cols = artifact["feature_cols"]
    target_col = artifact["target_col"]
    
    # 2. Load historical series to construct initial lag buffer
    df = pd.read_csv(data_path)
    df.columns = [c.strip().lower() for c in df.columns]
    date_col = 'service_date' if 'service_date' in df.columns else df.columns[0]
    df['date'] = pd.to_datetime(df[date_col], format='%m/%d/%Y', errors='coerce')
    df = df.dropna(subset=['date']).sort_values('date').reset_index(drop=True)
    
    last_date = df['date'].max()
    history_rides = list(df[target_col].values)
    
    forecasts = []
    
    print("=" * 65)
    print(f"GENERATING MULTI-DAY TRANSIT DEMAND FORECAST ({num_days} DAYS)")
    print(f"Base Date: {last_date.strftime('%Y-%m-%d')}")
    print("=" * 65)
    
    for step in range(1, num_days + 1):
        target_date = last_date + timedelta(days=step)
        
        # Determine day type: W = Weekday, A = Saturday, U = Sunday
        dow = target_date.dayofweek
        if dow == 5:
            day_type_A, day_type_U, day_type_W = 1, 0, 0
            day_type_name = "Saturday"
        elif dow == 6:
            day_type_A, day_type_U, day_type_W = 0, 1, 0
            day_type_name = "Sunday / Holiday"
        else:
            day_type_A, day_type_U, day_type_W = 0, 0, 1
            day_type_name = "Weekday"
        
        # Extract lags from history
        lag_1 = history_rides[-1]
        lag_2 = history_rides[-2] if len(history_rides) >= 2 else lag_1
        lag_7 = history_rides[-7] if len(history_rides) >= 7 else lag_1
        lag_14 = history_rides[-14] if len(history_rides) >= 14 else lag_7
        lag_30 = history_rides[-30] if len(history_rides) >= 30 else lag_14
        
        # Calculate rolling statistics
        recent_7 = history_rides[-7:]
        recent_14 = history_rides[-14:]
        recent_30 = history_rides[-30:]
        
        rolling_mean_7 = np.mean(recent_7)
        rolling_std_7 = np.std(recent_7)
        rolling_mean_14 = np.mean(recent_14)
        rolling_mean_30 = np.mean(recent_30)
        rolling_min_7 = np.min(recent_7)
        rolling_max_7 = np.max(recent_7)
        
        # Construct single-row feature dictionary
        features_dict = {
            'year': target_date.year,
            'month': target_date.month,
            'day': target_date.day,
            'day_of_week': dow,
            'day_of_year': target_date.timetuple().tm_yday,
            'is_weekend': 1 if dow in [5, 6] else 0,
            'quarter': (target_date.month - 1) // 3 + 1,
            'day_type_A': day_type_A,
            'day_type_U': day_type_U,
            'day_type_W': day_type_W,
            'lag_1': lag_1,
            'lag_2': lag_2,
            'lag_7': lag_7,
            'lag_14': lag_14,
            'lag_30': lag_30,
            'rolling_mean_7': rolling_mean_7,
            'rolling_std_7': rolling_std_7,
            'rolling_mean_14': rolling_mean_14,
            'rolling_mean_30': rolling_mean_30,
            'rolling_min_7': rolling_min_7,
            'rolling_max_7': rolling_max_7,
            'time_index': len(df) + step
        }
        
        # Format input vector matching model's expected columns
        X_input = pd.DataFrame([features_dict])[feature_cols]
        X_input_scaled = scaler.transform(X_input)
        
        predicted_rides = float(model.predict(X_input_scaled)[0])
        predicted_rides = max(0, round(predicted_rides))
        
        # Append prediction to history buffer for recursive subsequent day forecasting
        history_rides.append(predicted_rides)
        
        forecasts.append({
            "step": step,
            "date": target_date.strftime("%Y-%m-%d"),
            "day_name": target_date.strftime("%A"),
            "day_type": day_type_name,
            "predicted_total_ridership": predicted_rides
        })
    
    # Print formatted forecast table
    forecast_df = pd.DataFrame(forecasts)
    print(forecast_df[["date", "day_name", "day_type", "predicted_total_ridership"]].to_string(index=False))
    print("=" * 65)
    
    return forecasts


def main():
    print("Smart City Urban Analytics - Transit Demand Predictor")
    print(f"Execution timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    try:
        results = forecast_upcoming_days(num_days=7)
        print("\nForecast completed successfully.")
    except Exception as e:
        print(f"Prediction error: {e}")


if __name__ == "__main__":
    main()
