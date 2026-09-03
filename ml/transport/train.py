"""
=============================================================================
Smart City Urban Analytics Platform - Transport ML Module
Module: Public Transport Passenger Demand Forecasting
Script: train.py

Description:
This script builds an end-to-end Machine Learning pipeline to predict public
transit passenger demand (ridership) using historical time-series transit data.

Pipeline Steps:
  1. Load raw dataset (historical transit ridership).
  2. Data cleaning & Chronological Sorting.
  3. Feature Engineering:
     - Calendar & date features (month, day of week, weekend indicator, etc.)
     - One-hot encoded day types (Weekday, Saturday, Sunday/Holiday)
     - Historical lag features (1-day, 7-day, 14-day, 30-day lag)
     - Rolling window statistics (7-day and 14-day moving average and standard deviation)
  4. Time-Aware Train/Test Split (80% past historical data for train, 20% recent data for test).
  5. Feature Scaling using StandardScaler.
  6. Train & Compare Multiple ML Algorithms:
     - Linear Regression (Baseline)
     - Ridge Regression (L2 Regularized)
     - Decision Tree Regressor
     - Random Forest Regressor
     - Gradient Boosting Regressor
  7. Evaluation on Test Set using MAE, RMSE, R², and MAPE.
  8. Automatically save the best model and metadata to `models/transport_demand_model.pkl`.
=============================================================================
"""

import os
import json
import numpy as np
import pandas as pd
import joblib

from sklearn.linear_model import LinearRegression, Ridge
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def load_and_preprocess_data(data_path: str) -> pd.DataFrame:
    """
    Load the historical ridership CSV, clean columns, parse dates, and sort chronologically.
    """
    print("=" * 70)
    print("STEP 1: LOADING AND PREPROCESSING DATA")
    print("=" * 70)
    
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at: {data_path}")
    
    df = pd.read_csv(data_path)
    print(f"Loaded raw dataset with {df.shape[0]} rows and {df.shape[1]} columns.")
    print(f"Raw columns: {list(df.columns)}")
    
    # Normalize column names
    df.columns = [c.strip().lower() for c in df.columns]
    
    # Parse date column
    date_col = 'service_date' if 'service_date' in df.columns else df.columns[0]
    df['date'] = pd.to_datetime(df[date_col], format='%m/%d/%Y', errors='coerce')
    
    # Drop invalid dates if any
    df = df.dropna(subset=['date']).copy()
    
    # Sort chronologically
    df = df.sort_values(by='date').reset_index(drop=True)
    
    print(f"Data spans from {df['date'].min().strftime('%Y-%m-%d')} to {df['date'].max().strftime('%Y-%m-%d')}")
    print(f"Missing values count:\n{df.isnull().sum()}")
    
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Generate time-series and calendar features for ridership demand prediction.
    """
    print("\n" + "=" * 70)
    print("STEP 2: FEATURE ENGINEERING")
    print("=" * 70)
    
    data = df.copy()
    
    # 1. Calendar & Temporal Features
    data['year'] = data['date'].dt.year
    data['month'] = data['date'].dt.month
    data['day'] = data['date'].dt.day
    data['day_of_week'] = data['date'].dt.dayofweek  # 0=Monday, 6=Sunday
    data['day_of_year'] = data['date'].dt.dayofyear
    data['is_weekend'] = data['day_of_week'].isin([5, 6]).astype(int)
    data['quarter'] = data['date'].dt.quarter
    
    # 2. Categorical Day Type (One-Hot Encoding)
    # Day type: W = Weekday, A = Saturday, U = Sunday / Holiday
    if 'day_type' in data.columns:
        day_type_dummies = pd.get_dummies(data['day_type'], prefix='day_type', dtype=int)
        data = pd.concat([data, day_type_dummies], axis=1)
    
    # Target variable is total_rides (or bus if total_rides not available)
    target_col = 'total_rides' if 'total_rides' in data.columns else 'bus'
    
    # 3. Time-series Lag Features (Previous historical ridership values)
    # lag_1: yesterday's ridership
    # lag_7: ridership on the same day last week
    # lag_14: ridership two weeks ago
    # lag_30: ridership one month ago
    data['lag_1'] = data[target_col].shift(1)
    data['lag_2'] = data[target_col].shift(2)
    data['lag_7'] = data[target_col].shift(7)
    data['lag_14'] = data[target_col].shift(14)
    data['lag_30'] = data[target_col].shift(30)
    
    # 4. Rolling Window Statistics (Moving Averages & Standard Deviations)
    # Using shift(1) so future/current day data is NOT leaked into rolling calculations
    data['rolling_mean_7'] = data[target_col].shift(1).rolling(window=7).mean()
    data['rolling_std_7'] = data[target_col].shift(1).rolling(window=7).std()
    data['rolling_mean_14'] = data[target_col].shift(1).rolling(window=14).mean()
    data['rolling_mean_30'] = data[target_col].shift(1).rolling(window=30).mean()
    data['rolling_min_7'] = data[target_col].shift(1).rolling(window=7).min()
    data['rolling_max_7'] = data[target_col].shift(1).rolling(window=7).max()
    
    # 5. Long-term Trend Feature (Sequential integer index)
    data['time_index'] = np.arange(len(data))
    
    # Drop rows with NaN values created by lag & rolling operations (first 30 rows)
    initial_len = len(data)
    data = data.dropna().reset_index(drop=True)
    print(f"Generated temporal, lag, and rolling features.")
    print(f"Dropped {initial_len - len(data)} rows containing NaN from initial lag window.")
    print(f"Usable records after feature engineering: {len(data)}")
    
    return data


def calculate_mape(y_true, y_pred):
    """Calculate Mean Absolute Percentage Error (MAPE)."""
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    # Avoid division by zero
    non_zero = y_true != 0
    return np.mean(np.abs((y_true[non_zero] - y_pred[non_zero]) / y_true[non_zero])) * 100


def train_and_evaluate(df_processed: pd.DataFrame, models_dir: str):
    """
    Split data into time-aware train/test sets, train multiple models, evaluate, and save the best one.
    """
    print("\n" + "=" * 70)
    print("STEP 3: TIME-AWARE TRAIN / TEST SPLIT")
    print("=" * 70)
    
    target_col = 'total_rides' if 'total_rides' in df_processed.columns else 'bus'
    
    # Exclude non-feature columns
    exclude_cols = ['date', 'service_date', 'day_type', 'bus', 'rail_boardings', 'total_rides']
    feature_cols = [c for c in df_processed.columns if c not in exclude_cols]
    
    print(f"Target Variable: {target_col}")
    print(f"Number of Input Features: {len(feature_cols)}")
    print(f"Feature list: {feature_cols}")
    
    X = df_processed[feature_cols]
    y = df_processed[target_col]
    
    # Temporal Split: 80% past for training, 20% recent for testing (NO future data leakage)
    split_index = int(len(df_processed) * 0.80)
    
    X_train, X_test = X.iloc[:split_index], X.iloc[split_index:]
    y_train, y_test = y.iloc[:split_index], y.iloc[split_index:]
    train_dates = df_processed['date'].iloc[:split_index]
    test_dates = df_processed['date'].iloc[split_index:]
    
    print(f"Training set: {len(X_train)} samples ({train_dates.min().strftime('%Y-%m-%d')} to {train_dates.max().strftime('%Y-%m-%d')})")
    print(f"Test set:     {len(X_test)} samples ({test_dates.min().strftime('%Y-%m-%d')} to {test_dates.max().strftime('%Y-%m-%d')})")
    
    # Standardize features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print("\n" + "=" * 70)
    print("STEP 4: MODEL TRAINING & COMPARISON")
    print("=" * 70)
    
    # Models dictionary
    models = {
        "Linear Regression": LinearRegression(),
        "Ridge Regression": Ridge(alpha=1.0),
        "Decision Tree Regressor": DecisionTreeRegressor(max_depth=10, random_state=42),
        "Random Forest Regressor": RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1),
        "Gradient Boosting Regressor": GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
    }
    
    results = []
    trained_models = {}
    
    for name, model in models.items():
        print(f"Training {name}...")
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled)
        
        # Calculate metrics
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)
        mape = calculate_mape(y_test, y_pred)
        
        results.append({
            "Model": name,
            "MAE": round(mae, 2),
            "RMSE": round(rmse, 2),
            "R2_Score": round(r2, 4),
            "MAPE (%)": round(mape, 2)
        })
        trained_models[name] = model
    
    # Summary Table
    results_df = pd.DataFrame(results).sort_values(by="RMSE").reset_index(drop=True)
    print("\n" + "=" * 70)
    print("STEP 5: MODEL EVALUATION BENCHMARK RESULTS")
    print("=" * 70)
    print(results_df.to_string(index=False))
    
    # Best Model Selection
    best_model_name = results_df.iloc[0]["Model"]
    best_model = trained_models[best_model_name]
    best_rmse = results_df.iloc[0]["RMSE"]
    best_r2 = results_df.iloc[0]["R2_Score"]
    best_mape = results_df.iloc[0]["MAPE (%)"]
    
    print(f"\n--> BEST MODEL SELECTED: {best_model_name}")
    print(f"    Test R2 Score: {best_r2}")
    print(f"    Test RMSE:     {best_rmse:,}")
    print(f"    Test MAPE:     {best_mape}%")
    
    # Save the Best Model Artifacts
    os.makedirs(models_dir, exist_ok=True)
    model_save_path = os.path.join(models_dir, "transport_demand_model.pkl")
    metadata_save_path = os.path.join(models_dir, "model_metadata.json")
    
    # Bundle model, scaler, and feature list
    artifact = {
        "model_name": best_model_name,
        "model": best_model,
        "scaler": scaler,
        "feature_cols": feature_cols,
        "target_col": target_col,
        "metrics": results_df.to_dict(orient="records")
    }
    
    joblib.dump(artifact, model_save_path)
    print(f"\nSuccessfully saved best model artifact to: {model_save_path}")
    
    # Save metadata JSON for easy inspection
    metadata = {
        "best_model": best_model_name,
        "target_variable": target_col,
        "test_r2_score": best_r2,
        "test_rmse": best_rmse,
        "test_mape": best_mape,
        "features": feature_cols,
        "comparison_results": results_df.to_dict(orient="records")
    }
    with open(metadata_save_path, "w") as f:
        json.dump(metadata, f, indent=4)
    print(f"Saved model metadata JSON to: {metadata_save_path}")
    print("=" * 70)


def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, "dataset", "historical_ridership", "historical_transit_ridership.csv")
    models_dir = os.path.join(current_dir, "models")
    
    # Execute Pipeline
    df_raw = load_and_preprocess_data(data_path)
    df_features = engineer_features(df_raw)
    train_and_evaluate(df_features, models_dir)


if __name__ == "__main__":
    main()
