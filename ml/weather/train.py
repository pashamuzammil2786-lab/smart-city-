"""
=============================================================================
Smart City Urban Analytics Platform - Weather Module
Module 2: Urban Microclimate & Temperature Forecasting
Script: train.py

Trains and compares Machine Learning models (Linear Regression, Ridge,
Random Forest, Gradient Boosting) on the Kaggle Hyderabad Historical Weather
Dataset (96,432 hourly observations spanning 2009-2019).
=============================================================================
"""

import os
import json
import argparse
import numpy as np
import pandas as pd
import joblib

from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def calculate_metrics(y_true, y_pred):
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = float(r2_score(y_true, y_pred))
    
    non_zero = y_true != 0
    if np.sum(non_zero) > 0:
        mape = float(np.mean(np.abs((y_true[non_zero] - y_pred[non_zero]) / y_true[non_zero])) * 100)
    else:
        mape = 0.0
        
    return {
        "MAE": round(mae, 4),
        "RMSE": round(rmse, 4),
        "R2": round(r2, 4),
        "MAPE": round(mape, 2)
    }


def load_and_engineer_features(data_path: str):
    print(f"Loading Hyderabad weather data from: {data_path}")
    df = pd.read_csv(data_path)
    
    # Parse timestamp and sort chronologically
    df['date_time'] = pd.to_datetime(df['date_time'])
    df = df.sort_values(by='date_time').reset_index(drop=True)
    
    # Temporal & Calendar Features
    df['hour'] = df['date_time'].dt.hour
    df['day'] = df['date_time'].dt.day
    df['month'] = df['date_time'].dt.month
    df['dayofyear'] = df['date_time'].dt.dayofyear
    df['dayofweek'] = df['date_time'].dt.dayofweek
    
    # Cyclical encodings
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
    
    # Clean numeric columns
    numeric_cols = ['tempC', 'DewPointC', 'humidity', 'pressure', 'windspeedKmph', 'cloudcover', 'precipMM', 'sunHour', 'WindGustKmph']
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')
        
    # Lag and Rolling window features
    df['temp_lag_1'] = df['tempC'].shift(1)
    df['temp_lag_2'] = df['tempC'].shift(2)
    df['temp_lag_24'] = df['tempC'].shift(24)
    df['temp_rolling_6'] = df['tempC'].shift(1).rolling(window=6, min_periods=1).mean()
    df['temp_rolling_24'] = df['tempC'].shift(1).rolling(window=24, min_periods=1).mean()
    df['humidity_lag_1'] = df['humidity'].shift(1)
    
    # Fill initial NaNs
    lag_cols = ['temp_lag_1', 'temp_lag_2', 'temp_lag_24', 'temp_rolling_6', 'temp_rolling_24', 'humidity_lag_1']
    for c in lag_cols:
        df[c] = df[c].bfill().ffill()
        
    feature_cols = [
        'hour', 'month', 'dayofyear', 'hour_sin', 'hour_cos', 'month_sin', 'month_cos',
        'DewPointC', 'humidity', 'pressure', 'windspeedKmph', 'cloudcover', 'precipMM', 'sunHour', 'WindGustKmph',
        'temp_lag_1', 'temp_lag_2', 'temp_lag_24', 'temp_rolling_6', 'temp_rolling_24', 'humidity_lag_1'
    ]
    
    return df, feature_cols


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="ml/weather/dataset/hyderabad_weather.csv")
    parser.add_argument("--out", default="ml/weather/models")
    args = parser.parse_args()
    
    os.makedirs(args.out, exist_ok=True)
    df, feature_cols = load_and_engineer_features(args.data)
    
    print(f"Total processed samples: {len(df)}")
    print(f"Features ({len(feature_cols)}): {feature_cols}")
    
    # Split chronologically (80% train, 20% test)
    split_idx = int(len(df) * 0.8)
    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]
    
    X_train = train_df[feature_cols]
    y_train = train_df['tempC']
    X_test = test_df[feature_cols]
    y_test = test_df['tempC']
    
    print(f"Train samples: {len(X_train)} ({train_df['date_time'].min()} to {train_df['date_time'].max()})")
    print(f"Test samples:  {len(X_test)} ({test_df['date_time'].min()} to {test_df['date_time'].max()})")
    
    # Scaler for linear models
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    models = {
        "Linear Regression": LinearRegression(),
        "Ridge Regression": Ridge(alpha=10.0),
        "Random Forest": RandomForestRegressor(n_estimators=100, max_depth=16, n_jobs=-1, random_state=42),
        "Gradient Boosting": GradientBoostingRegressor(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42)
    }
    
    results = {}
    fitted_models = {}
    preds_dict = {}
    
    print("\n" + "=" * 65)
    print("TRAINING AND EVALUATING WEATHER MODELS")
    print("=" * 65)
    
    for name, model in models.items():
        print(f"Training {name}...")
        if name in ["Linear Regression", "Ridge Regression"]:
            model.fit(X_train_scaled, y_train)
            y_pred = model.predict(X_test_scaled)
        else:
            # Subsample for faster robust training on 77k rows
            sub_train = X_train.sample(n=35000, random_state=42)
            sub_y = y_train.loc[sub_train.index]
            model.fit(sub_train, sub_y)
            y_pred = model.predict(X_test)
            
        res = calculate_metrics(y_test, y_pred)
        results[name] = res
        fitted_models[name] = model
        preds_dict[name] = y_pred
        print(f"--> {name:20s}: R² = {res['R2']:.4f} | MAE = {res['MAE']:.2f}°C | RMSE = {res['RMSE']:.2f}°C | MAPE = {res['MAPE']:.2f}%")
        
    best_name = min(results, key=lambda k: results[k]['RMSE'])
    best_model = fitted_models[best_name]
    print("\n" + "=" * 65)
    print(f"WINNING MODEL: {best_name} (R² = {results[best_name]['R2']}, RMSE = {results[best_name]['RMSE']}°C)")
    print("=" * 65)
    
    # Feature importances
    if hasattr(best_model, 'feature_importances_'):
        importances = best_model.feature_importances_
    elif hasattr(fitted_models["Random Forest"], 'feature_importances_'):
        importances = fitted_models["Random Forest"].feature_importances_
    else:
        importances = np.ones(len(feature_cols)) / len(feature_cols)
        
    feat_imp = sorted(
        [{"feature": col, "importance": round(float(imp), 4)} for col, imp in zip(feature_cols, importances)],
        key=lambda x: x["importance"],
        reverse=True
    )
    
    # Save artifacts
    model_artifact = {
        "model": best_model,
        "scaler": scaler,
        "features": feature_cols,
        "best_model_name": best_name,
        "is_scaled": best_name in ["Linear Regression", "Ridge Regression"]
    }
    joblib.dump(model_artifact, os.path.join(args.out, "weather_model.pkl"))
    
    metrics_data = {
        "module": "Weather & Urban Microclimate Intelligence",
        "dataset": "Kaggle Hyderabad Historical Weather (96,432 rows, 2009-2019)",
        "target": "tempC (Ambient Temperature °C)",
        "samples_total": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "best_model": best_name,
        "comparison": results,
        "feature_importance": feat_imp,
        "actual_vs_predicted_sample": [
            {
                "timestamp": str(ts),
                "actual": round(float(act), 1),
                "predicted": round(float(prd), 1)
            }
            for ts, act, prd in zip(test_df['date_time'].iloc[-48:], y_test.iloc[-48:], preds_dict[best_name][-48:])
        ]
    }
    
    with open(os.path.join(args.out, "metrics.json"), "w") as f:
        json.dump(metrics_data, f, indent=2)
        
    print(f"\nModel and metrics successfully saved to {args.out}/")
    
    # Plotting
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        
        # 1. Forecast plot
        n_pts = min(168, len(y_test))
        plt.figure(figsize=(12, 4))
        plt.plot(y_test.values[-n_pts:], label="Actual Temp (°C)", color="#A855F7", lw=1.8)
        plt.plot(preds_dict[best_name][-n_pts:], label=f"Predicted ({best_name})", color="#38BDF8", lw=1.5, linestyle="--")
        plt.title(f"Hyderabad Microclimate Temperature Forecast ({best_name}) - Last {n_pts} Hours", fontsize=12, fontweight="bold")
        plt.xlabel("Hours", fontsize=10)
        plt.ylabel("Temperature (°C)", fontsize=10)
        plt.legend()
        plt.grid(True, alpha=0.25)
        plt.tight_layout()
        plt.savefig(os.path.join(args.out, "forecast_plot.png"), dpi=120)
        plt.close()
        
        # 2. Feature importance plot
        plt.figure(figsize=(9, 5))
        top_imp = feat_imp[:10][::-1]
        plt.barh([x['feature'] for x in top_imp], [x['importance'] for x in top_imp], color="#7C3AED")
        plt.title("Top 10 Feature Importances - Weather ML Model", fontsize=12, fontweight="bold")
        plt.xlabel("Importance Weight", fontsize=10)
        plt.tight_layout()
        plt.savefig(os.path.join(args.out, "feature_importance.png"), dpi=120)
        plt.close()
        print(f"Generated forecast_plot.png and feature_importance.png in {args.out}/")
    except Exception as e:
        print(f"Matplotlib plotting skipped: {e}")


if __name__ == "__main__":
    main()
