"""
=============================================================================
Smart City Urban Analytics Platform - Traffic Module
Module 3: Traffic Flow & Congestion Prediction
Script: train.py

Trains and compares Machine Learning models (Linear Regression, Ridge,
Random Forest, Gradient Boosting) on the Google Sheets / Kaggle Traffic Dataset
(48,120 hourly records across 4 major junctions).
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
    
    # MAPE with epsilon to avoid div by zero
    non_zero = y_true > 0
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
    print(f"Loading traffic data from: {data_path}")
    df = pd.read_csv(data_path)
    
    # Drop empty or artifact columns
    cols_to_drop = [c for c in df.columns if 'column' in c.lower() or 'unnamed' in c.lower()]
    if cols_to_drop:
        df = df.drop(columns=cols_to_drop)
        
    df['DateTime'] = pd.to_datetime(df['DateTime'])
    df = df.sort_values(by=['Junction', 'DateTime']).reset_index(drop=True)
    
    # Temporal & Calendar Features
    df['hour'] = df['DateTime'].dt.hour
    df['day'] = df['DateTime'].dt.day
    df['month'] = df['DateTime'].dt.month
    df['year'] = df['DateTime'].dt.year
    df['dayofweek'] = df['DateTime'].dt.dayofweek
    df['is_weekend'] = df['dayofweek'].isin([5, 6]).astype(int)
    df['is_rush_hour'] = df['hour'].isin([8, 9, 10, 11, 17, 18, 19, 20]).astype(int)
    
    # Cyclical hour encoding
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
    
    # Junction One-Hot Encoding
    for j in [1, 2, 3, 4]:
        df[f'junction_{j}'] = (df['Junction'] == j).astype(int)
        
    # Lag and Rolling Features per Junction
    dfs = []
    for j in df['Junction'].unique():
        sub = df[df['Junction'] == j].copy()
        sub['lag_1'] = sub['Vehicles'].shift(1)
        sub['lag_2'] = sub['Vehicles'].shift(2)
        sub['lag_24'] = sub['Vehicles'].shift(24)
        sub['rolling_mean_6'] = sub['Vehicles'].shift(1).rolling(window=6, min_periods=1).mean()
        sub['rolling_mean_24'] = sub['Vehicles'].shift(1).rolling(window=24, min_periods=1).mean()
        dfs.append(sub)
        
    df = pd.concat(dfs).sort_values(by='DateTime').reset_index(drop=True)
    
    # Backfill / forward fill initial lag NaNs
    lag_cols = ['lag_1', 'lag_2', 'lag_24', 'rolling_mean_6', 'rolling_mean_24']
    for c in lag_cols:
        df[c] = df[c].bfill().ffill()
        
    feature_cols = [
        'hour', 'day', 'month', 'dayofweek', 'is_weekend', 'is_rush_hour',
        'hour_sin', 'hour_cos',
        'junction_1', 'junction_2', 'junction_3', 'junction_4',
        'lag_1', 'lag_2', 'lag_24', 'rolling_mean_6', 'rolling_mean_24'
    ]
    
    return df, feature_cols


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="ml/traffic/dataset/traffic_data.csv")
    parser.add_argument("--out", default="ml/traffic/models")
    args = parser.parse_args()
    
    os.makedirs(args.out, exist_ok=True)
    df, feature_cols = load_and_engineer_features(args.data)
    
    print(f"Total processed samples: {len(df)}")
    print(f"Features ({len(feature_cols)}): {feature_cols}")
    
    # Chronological Time-Series Train/Test Split (80% train, 20% test)
    split_idx = int(len(df) * 0.8)
    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]
    
    X_train = train_df[feature_cols]
    y_train = train_df['Vehicles']
    X_test = test_df[feature_cols]
    y_test = test_df['Vehicles']
    
    print(f"Train samples: {len(X_train)} ({train_df['DateTime'].min()} to {train_df['DateTime'].max()})")
    print(f"Test samples:  {len(X_test)} ({test_df['DateTime'].min()} to {test_df['DateTime'].max()})")
    
    # Standard Scaler
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
    print("TRAINING AND EVALUATING MODELS")
    print("=" * 65)
    
    for name, model in models.items():
        print(f"Training {name}...")
        if name in ["Linear Regression", "Ridge Regression"]:
            model.fit(X_train_scaled, y_train)
            y_pred = model.predict(X_test_scaled)
        else:
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            
        y_pred = np.clip(y_pred, a_min=0, a_max=None)
        res = calculate_metrics(y_test, y_pred)
        results[name] = res
        fitted_models[name] = model
        preds_dict[name] = y_pred
        print(f"--> {name:20s}: R² = {res['R2']:.4f} | MAE = {res['MAE']:.2f} | RMSE = {res['RMSE']:.2f} | MAPE = {res['MAPE']:.2f}%")
        
    # Best model selection by lowest RMSE
    best_name = min(results, key=lambda k: results[k]['RMSE'])
    best_model = fitted_models[best_name]
    print("\n" + "=" * 65)
    print(f"WINNING MODEL: {best_name} (R² = {results[best_name]['R2']}, RMSE = {results[best_name]['RMSE']})")
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
    joblib.dump(model_artifact, os.path.join(args.out, "traffic_model.pkl"))
    
    metrics_data = {
        "module": "Traffic Flow & Congestion Analytics",
        "dataset": "Google Sheets / Kaggle Traffic Dataset (48,120 rows)",
        "target": "Vehicles (Hourly Junction Flow)",
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
            for ts, act, prd in zip(test_df['DateTime'].iloc[-48:], y_test.iloc[-48:], preds_dict[best_name][-48:])
        ]
    }
    
    with open(os.path.join(args.out, "metrics.json"), "w") as f:
        json.dump(metrics_data, f, indent=2)
        
    print(f"\nModel and metrics successfully saved to {args.out}/")
    
    # Plots if matplotlib is installed
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        
        # 1. Forecast plot
        n_pts = min(168, len(y_test))
        plt.figure(figsize=(12, 4))
        plt.plot(y_test.values[-n_pts:], label="Actual Vehicles", color="#38BDF8", lw=1.8)
        plt.plot(preds_dict[best_name][-n_pts:], label=f"Predicted ({best_name})", color="#F59E0B", lw=1.5, linestyle="--")
        plt.title(f"Traffic Flow Forecast ({best_name}) - Last {n_pts} Hours of Test Period", fontsize=12, fontweight="bold")
        plt.xlabel("Hours", fontsize=10)
        plt.ylabel("Vehicle Count", fontsize=10)
        plt.legend()
        plt.grid(True, alpha=0.25)
        plt.tight_layout()
        plt.savefig(os.path.join(args.out, "forecast_plot.png"), dpi=120)
        plt.close()
        
        # 2. Feature importance plot
        plt.figure(figsize=(9, 5))
        top_imp = feat_imp[:10][::-1]
        plt.barh([x['feature'] for x in top_imp], [x['importance'] for x in top_imp], color="#D97706")
        plt.title(f"Top 10 Feature Importances - Traffic ML Model", fontsize=12, fontweight="bold")
        plt.xlabel("Importance Weight", fontsize=10)
        plt.tight_layout()
        plt.savefig(os.path.join(args.out, "feature_importance.png"), dpi=120)
        plt.close()
        print(f"Generated forecast_plot.png and feature_importance.png in {args.out}/")
    except Exception as e:
        print(f"Matplotlib plotting skipped: {e}")


if __name__ == "__main__":
    main()
