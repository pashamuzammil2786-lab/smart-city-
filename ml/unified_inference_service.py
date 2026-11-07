"""
=============================================================================
Smart City Urban Analytics Platform - Unified ML Inference Service
Hybrid ML + Analytical Decision-Support Architecture
=============================================================================
This service provides high-performance, validated inference for all four
trained machine learning models:
  1. Transport: Random Forest Regressor (Target: total_rides, Horizon: 7 Days)
  2. Traffic: Gradient Boosting Regressor (Target: Vehicles, Horizon: Hourly Flow)
  3. Weather: Linear Regression Pipeline (Target: tempC, Horizon: Ambient Microclimate)
  4. Air Quality: Support Vector Regressor RBF (Target: 1-Hour Ahead AQI)

Modes:
  1. HTTP Daemon: python ml/unified_inference_service.py --serve --port 5001
  2. CLI Runner:  python ml/unified_inference_service.py --module <module> --input '<json>'
=============================================================================
"""

import os
import sys
import math
import json
import argparse
from datetime import datetime, timedelta
import joblib
import numpy as np
import pandas as pd

# Base project paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ML_DIR = os.path.join(BASE_DIR, "ml")

# Global in-memory model cache
MODELS = {
    "transport": None,
    "traffic": None,
    "weather": None,
    "air_quality": None
}

METRICS = {
    "transport": {
        "model": "Random Forest Regressor",
        "target": "total_rides (Daily Transit Demand)",
        "r2_score": 0.6413,
        "mape": 14.32,
        "mae": 105570.74,
        "rmse": 135231.47,
        "horizon": "7-Day Recursive Multi-Day Forecast"
    },
    "traffic": {
        "model": "Gradient Boosting Regressor",
        "target": "Vehicles (Hourly Junction Flow)",
        "r2_score": 0.9684,
        "mape": 17.33,
        "mae": 2.93,
        "rmse": 4.84,
        "horizon": "Hourly Junction Vehicle Count"
    },
    "weather": {
        "model": "Linear Regression Pipeline",
        "target": "tempC (Ambient Dry-Bulb Temperature °C)",
        "r2_score": 0.9894,
        "mape": 1.51,
        "mae": 0.41,
        "rmse": 0.54,
        "horizon": "Hourly Ambient Temperature"
    },
    "air_quality": {
        "model": "Support Vector Regressor (SVR with RBF Kernel)",
        "target": "AQI (CPCB 0-500 Scale)",
        "r2_score": 0.7742,
        "mape": 32.13,
        "mae": 20.89,
        "rmse": 27.30,
        "horizon": "1-Hour Ahead Predictive Forecast"
    }
}


def load_all_models():
    """Load all 4 trained model artifacts into the in-memory cache once."""
    # 1. Transport
    transport_path = os.path.join(ML_DIR, "transport", "models", "transport_demand_model.pkl")
    if os.path.exists(transport_path):
        try:
            MODELS["transport"] = joblib.load(transport_path)
        except Exception as e:
            print(f"[WARN] Failed to load Transport model: {e}", file=sys.stderr)

    # 2. Traffic
    traffic_path = os.path.join(ML_DIR, "traffic", "models", "traffic_model.pkl")
    if os.path.exists(traffic_path):
        try:
            MODELS["traffic"] = joblib.load(traffic_path)
        except Exception as e:
            print(f"[WARN] Failed to load Traffic model: {e}", file=sys.stderr)

    # 3. Weather
    weather_path = os.path.join(ML_DIR, "weather", "models", "weather_model.pkl")
    if os.path.exists(weather_path):
        try:
            MODELS["weather"] = joblib.load(weather_path)
        except Exception as e:
            print(f"[WARN] Failed to load Weather model: {e}", file=sys.stderr)

    # 4. Air Quality
    aqi_candidates = [
        os.path.join(ML_DIR, "air_quality", "models", "aqi_model.joblib"),
        os.path.join(ML_DIR, "air_quality", "aqi_model.joblib")
    ]
    for p in aqi_candidates:
        if os.path.exists(p):
            try:
                MODELS["air_quality"] = joblib.load(p)
                break
            except Exception as e:
                print(f"[WARN] Failed to load AQI model: {e}", file=sys.stderr)


# =============================================================================
# PREDICTION FUNCTIONS
# =============================================================================

def predict_transport(num_days=7, base_date=None):
    """
    Executes multi-day transit demand forecasting using Random Forest model.
    Target: total_rides (Daily Network Transit Demand).
    """
    artifact = MODELS.get("transport")
    if artifact is None:
        load_all_models()
        artifact = MODELS.get("transport")
        if artifact is None:
            raise RuntimeError("Transport model artifact not available.")

    model = artifact["model"]
    scaler = artifact["scaler"]
    feature_cols = artifact["feature_cols"]
    target_col = artifact["target_col"]

    data_path = os.path.join(ML_DIR, "transport", "dataset", "historical_ridership", "historical_transit_ridership.csv")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Historical dataset not found at {data_path}")

    df = pd.read_csv(data_path)
    df.columns = [c.strip().lower() for c in df.columns]
    date_col = 'service_date' if 'service_date' in df.columns else df.columns[0]
    df['date'] = pd.to_datetime(df[date_col], format='%m/%d/%Y', errors='coerce')
    df = df.dropna(subset=['date']).sort_values('date').reset_index(drop=True)

    if base_date:
        try:
            start_dt = pd.to_datetime(base_date)
        except Exception:
            start_dt = datetime.now()
    else:
        start_dt = datetime.now()

    history_rides = list(df[target_col].values)
    forecasts = []

    for step in range(1, num_days + 1):
        target_date = start_dt + timedelta(days=step)
        dow = target_date.weekday()

        if dow == 5:
            day_type_A, day_type_U, day_type_W = 1, 0, 0
            day_type_name = "Saturday"
        elif dow == 6:
            day_type_A, day_type_U, day_type_W = 0, 1, 0
            day_type_name = "Sunday / Holiday"
        else:
            day_type_A, day_type_U, day_type_W = 0, 0, 1
            day_type_name = "Weekday"

        lag_1 = history_rides[-1]
        lag_2 = history_rides[-2] if len(history_rides) >= 2 else lag_1
        lag_7 = history_rides[-7] if len(history_rides) >= 7 else lag_1
        lag_14 = history_rides[-14] if len(history_rides) >= 14 else lag_7
        lag_30 = history_rides[-30] if len(history_rides) >= 30 else lag_14

        recent_7 = history_rides[-7:]
        recent_14 = history_rides[-14:]
        recent_30 = history_rides[-30:]

        features_dict = {
            'year': int(target_date.year),
            'month': int(target_date.month),
            'day': int(target_date.day),
            'day_of_week': int(dow),
            'day_of_year': int(target_date.timetuple().tm_yday),
            'is_weekend': 1 if dow in [5, 6] else 0,
            'quarter': int((target_date.month - 1) // 3 + 1),
            'day_type_A': day_type_A,
            'day_type_U': day_type_U,
            'day_type_W': day_type_W,
            'lag_1': float(lag_1),
            'lag_2': float(lag_2),
            'lag_7': float(lag_7),
            'lag_14': float(lag_14),
            'lag_30': float(lag_30),
            'rolling_mean_7': float(np.mean(recent_7)),
            'rolling_std_7': float(np.std(recent_7)),
            'rolling_mean_14': float(np.mean(recent_14)),
            'rolling_mean_30': float(np.mean(recent_30)),
            'rolling_min_7': float(np.min(recent_7)),
            'rolling_max_7': float(np.max(recent_7)),
            'time_index': len(df) + step
        }

        X_input = pd.DataFrame([features_dict])[feature_cols]
        X_input_scaled = scaler.transform(X_input)
        raw_pred = float(model.predict(X_input_scaled)[0])

        if math.isnan(raw_pred) or math.isinf(raw_pred):
            raise ValueError("Transport model produced invalid numeric output.")

        predicted_rides = max(0, int(round(raw_pred)))
        history_rides.append(predicted_rides)

        forecasts.append({
            "step": step,
            "date": target_date.strftime("%Y-%m-%d"),
            "day_name": target_date.strftime("%A"),
            "day_type": day_type_name,
            "predicted_total_ridership": predicted_rides
        })

    return {
        "success": True,
        "module": "transport",
        "prediction_type": "transit_demand",
        "prediction_source": "Machine Learning",
        "model": "Random Forest Regressor",
        "prediction_horizon": f"{num_days} Days Ahead",
        "prediction": {
            "forecast_days": forecasts,
            "base_date": start_dt.strftime("%Y-%m-%d"),
            "target_variable": "total_rides (Daily Network Transit Demand)",
            "average_predicted_daily_ridership": int(round(np.mean([f["predicted_total_ridership"] for f in forecasts])))
        },
        "metrics": METRICS["transport"]
    }


def predict_traffic(junction=1, hour=18, dayofweek=2, weather="Clear", incident=0):
    """
    Executes hourly junction vehicle count prediction using Gradient Boosting model.
    Target: Vehicles (Hourly Junction Flow).
    """
    artifact = MODELS.get("traffic")
    if artifact is None:
        load_all_models()
        artifact = MODELS.get("traffic")
        if artifact is None:
            raise RuntimeError("Traffic model artifact not available.")

    model = artifact["model"]
    scaler = artifact["scaler"]
    features = artifact["features"]
    is_scaled = artifact["is_scaled"]

    junction = int(junction)
    if junction not in [1, 2, 3, 4]:
        junction = 1

    hour = max(0, min(23, int(hour)))
    dayofweek = max(0, min(6, int(dayofweek)))
    incident = 1 if incident in [1, "1", True, "Minor", "Major"] else 0

    junction_means = {1: 45.0, 2: 28.0, 3: 15.0, 4: 8.0}
    base_vehicles = junction_means.get(junction, 25.0)

    if hour in [8, 9, 10, 11]:
        hour_factor = 1.65
    elif hour in [17, 18, 19, 20]:
        hour_factor = 1.85
    elif hour in [0, 1, 2, 3, 4, 5]:
        hour_factor = 0.35
    else:
        hour_factor = 1.0

    est_lag = base_vehicles * hour_factor

    row_data = {
        'hour': hour,
        'day': 15,
        'month': 6,
        'dayofweek': dayofweek,
        'is_weekend': 1 if dayofweek in [5, 6] else 0,
        'is_rush_hour': 1 if hour in [8, 9, 10, 11, 17, 18, 19, 20] else 0,
        'hour_sin': float(np.sin(2 * np.pi * hour / 24)),
        'hour_cos': float(np.cos(2 * np.pi * hour / 24)),
        'junction_1': 1 if junction == 1 else 0,
        'junction_2': 1 if junction == 2 else 0,
        'junction_3': 1 if junction == 3 else 0,
        'junction_4': 1 if junction == 4 else 0,
        'lag_1': float(est_lag),
        'lag_2': float(est_lag * 0.95),
        'lag_24': float(est_lag),
        'rolling_mean_6': float(est_lag * 0.98),
        'rolling_mean_24': float(base_vehicles)
    }

    input_df = pd.DataFrame([row_data])[features]
    if is_scaled:
        input_scaled = scaler.transform(input_df)
        raw_pred = float(model.predict(input_scaled)[0])
    else:
        raw_pred = float(model.predict(input_df)[0])

    if math.isnan(raw_pred) or math.isinf(raw_pred):
        raise ValueError("Traffic model produced invalid numeric output.")

    weather_str = str(weather).lower()
    weather_multiplier = 1.0
    if 'heavy' in weather_str or 'storm' in weather_str:
        weather_multiplier = 1.40
    elif 'rain' in weather_str:
        weather_multiplier = 1.25
    elif 'fog' in weather_str:
        weather_multiplier = 1.15

    predicted_vehicles = max(1, int(round(raw_pred * weather_multiplier)))
    incident_delay = 12.0 if incident else 0.0

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
        "success": True,
        "module": "traffic",
        "prediction_type": "junction_vehicle_flow",
        "prediction_source": "Machine Learning",
        "model": "Gradient Boosting Regressor",
        "prediction_horizon": "Current Hour Junction Volume",
        "prediction": {
            "junction": junction,
            "hour": hour,
            "predicted_vehicles_per_hour": predicted_vehicles,
            "level_of_service": los,
            "congestion_percentage": congestion_pct,
            "estimated_delay_mins": int(round(delay_mins)),
            "travel_time_index": tti,
            "weather_impact": f"{int((weather_multiplier - 1.0)*100)}% volume impedance" if weather_multiplier > 1.0 else "Normal Dry Asphalt",
            "incident_active": bool(incident)
        },
        "metrics": METRICS["traffic"]
    }


def predict_weather(hour=14, month=5, humidity=45.0, dewpoint=18.0, pressure=1010.0, windspeed=12.0, cloudcover=20.0, sunhour=10.5):
    """
    Executes ambient temperature prediction using Linear Regression Pipeline.
    Target: tempC (Ambient Dry-Bulb Temperature °C).
    """
    artifact = MODELS.get("weather")
    if artifact is None:
        load_all_models()
        artifact = MODELS.get("weather")
        if artifact is None:
            raise RuntimeError("Weather model artifact not available.")

    model = artifact["model"]
    scaler = artifact["scaler"]
    features = artifact["features"]
    is_scaled = artifact["is_scaled"]

    hour = max(0, min(23, int(hour)))
    month = max(1, min(12, int(month)))
    humidity = max(5.0, min(100.0, float(humidity)))
    dewpoint = float(dewpoint)
    pressure = max(900.0, min(1100.0, float(pressure)))
    windspeed = max(0.0, float(windspeed))

    month_base = {
        1: 22.0, 2: 26.0, 3: 31.0, 4: 35.0, 5: 37.0, 6: 32.0,
        7: 28.0, 8: 27.0, 9: 28.0, 10: 27.0, 11: 24.0, 12: 21.0
    }
    base_t = month_base.get(month, 28.0)
    hour_adj = 5.0 * np.sin(2 * np.pi * (hour - 9) / 24)
    est_temp = base_t + hour_adj

    row_data = {
        'hour': hour,
        'month': month,
        'dayofyear': int(month * 30.4 - 15),
        'hour_sin': float(np.sin(2 * np.pi * hour / 24)),
        'hour_cos': float(np.cos(2 * np.pi * hour / 24)),
        'month_sin': float(np.sin(2 * np.pi * month / 12)),
        'month_cos': float(np.cos(2 * np.pi * month / 12)),
        'DewPointC': dewpoint,
        'humidity': humidity,
        'pressure': pressure,
        'windspeedKmph': windspeed,
        'cloudcover': float(cloudcover),
        'precipMM': 0.0,
        'sunHour': float(sunhour),
        'WindGustKmph': float(windspeed * 1.35),
        'temp_lag_1': float(est_temp - 0.4),
        'temp_lag_2': float(est_temp - 0.9),
        'temp_lag_24': float(est_temp),
        'temp_rolling_6': float(est_temp - 1.2),
        'temp_rolling_24': float(base_t),
        'humidity_lag_1': float(humidity + 1.5)
    }

    input_df = pd.DataFrame([row_data])[features]
    if is_scaled:
        input_scaled = scaler.transform(input_df)
        raw_pred = float(model.predict(input_scaled)[0])
    else:
        raw_pred = float(model.predict(input_df)[0])

    if math.isnan(raw_pred) or math.isinf(raw_pred):
        raise ValueError("Weather model produced invalid numeric output.")

    predicted_t = round(float(raw_pred), 1)

    # Steadman apparent temperature formula
    e = (humidity / 100.0) * 6.105 * np.exp((17.27 * predicted_t) / (237.7 + predicted_t))
    feels_like = round(predicted_t + 0.33 * e - 0.70 * (windspeed / 3.6) - 4.0, 1)

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
        "success": True,
        "module": "weather",
        "prediction_type": "ambient_temperature",
        "prediction_source": "Machine Learning",
        "model": "Linear Regression Pipeline",
        "prediction_horizon": "Hourly Ambient Temperature",
        "prediction": {
            "hour": hour,
            "month": month,
            "predicted_temperature_c": predicted_t,
            "feels_like_c": feels_like,
            "humidity_pct": humidity,
            "dew_point_c": dewpoint,
            "wind_speed_kmph": windspeed,
            "thermal_comfort_level": thermal_category,
            "uhi_maximum_potential_delta": "+3.4°C (High Density Urban Core vs Baseline)"
        },
        "metrics": METRICS["weather"]
    }


def predict_air_quality(pm25=55.0, pm10=110.0, no2=45.0, co=1.2, temp=28.0,
                        humidity=55.0, wind=8.0, rainfall=0.0, traffic=0.65,
                        hour=18, dayofweek=2, month=5, current_aqi=None):
    """
    Executes 1-hour ahead AQI prediction using Support Vector Regressor (SVR).
    Target: 1-hour ahead AQI (CPCB 0-500 scale).
    """
    artifact = MODELS.get("air_quality")
    if artifact is None:
        load_all_models()
        artifact = MODELS.get("air_quality")
        if artifact is None:
            raise RuntimeError("Air Quality model artifact not available.")

    model = artifact["model"]
    feature_names = artifact["features"]

    pm25 = max(0.0, float(pm25))
    pm10 = max(0.0, float(pm10))
    no2 = max(0.0, float(no2))
    co = max(0.0, float(co))
    temp = float(temp)
    humidity = max(5.0, min(100.0, float(humidity)))
    wind = max(0.1, float(wind))
    traffic = max(0.0, min(1.0, float(traffic)))
    hour = max(0, min(23, int(hour)))
    dayofweek = max(0, min(6, int(dayofweek)))
    month = max(1, min(12, int(month)))

    if current_aqi is None:
        current_aqi = max(pm25 * 1.8, pm10 * 0.9)
    else:
        current_aqi = max(0.0, float(current_aqi))

    is_weekend = 1 if dayofweek >= 5 else 0
    hour_sin = float(np.sin(2 * np.pi * hour / 24))
    hour_cos = float(np.cos(2 * np.pi * hour / 24))

    row = {
        'PM2.5': pm25,
        'PM10': pm10,
        'NO2': no2,
        'CO': co,
        'temperature': temp,
        'humidity': humidity,
        'wind_speed': wind,
        'rainfall': float(rainfall),
        'traffic_congestion': traffic,
        'AQI': float(current_aqi),
        'hour': hour,
        'dayofweek': dayofweek,
        'month': month,
        'is_weekend': is_weekend,
        'hour_sin': hour_sin,
        'hour_cos': hour_cos,
        'AQI_lag1': float(current_aqi),
        'AQI_lag3': float(current_aqi * 0.98),
        'AQI_lag6': float(current_aqi * 0.95),
        'AQI_lag24': float(current_aqi),
        'AQI_roll6': float(current_aqi),
        'traffic_roll3': float(traffic)
    }

    df_row = pd.DataFrame([row])
    for col in feature_names:
        if col not in df_row.columns:
            df_row[col] = 0.0

    X = df_row[feature_names]
    raw_pred = float(model.predict(X)[0])

    if math.isnan(raw_pred) or math.isinf(raw_pred):
        raise ValueError("AQI model produced invalid numeric output.")

    pred_val = max(0.0, min(500.0, round(raw_pred, 1)))

    if pred_val <= 50:
        cat = "Good"
        color = "#10B981"
        health = "Air quality is satisfactory; minimal or no risk."
    elif pred_val <= 100:
        cat = "Satisfactory"
        color = "#84CC16"
        health = "Minor breathing discomfort may occur in sensitive individuals."
    elif pred_val <= 200:
        cat = "Moderate"
        color = "#F59E0B"
        health = "Breathing discomfort to individuals with respiratory ailments."
    elif pred_val <= 300:
        cat = "Poor"
        color = "#F97316"
        health = "Breathing discomfort to most people upon prolonged exposure."
    elif pred_val <= 400:
        cat = "Very Poor"
        color = "#EF4444"
        health = "Respiratory illness on prolonged exposure; avoid outdoor exertion."
    else:
        cat = "Severe"
        color = "#881337"
        health = "Emergency alert: severe health impact across entire population."

    return {
        "success": True,
        "module": "air_quality",
        "prediction_type": "next_hour_aqi",
        "prediction_source": "Machine Learning",
        "model": "Support Vector Regressor (SVR)",
        "prediction_horizon": "1 Hour Ahead",
        "prediction": {
            "predicted_aqi": pred_val,
            "category": cat,
            "color": color,
            "health_advisory": health,
            "model_architecture": "SVR with RBF Kernel (StandardScaled)"
        },
        "metrics": METRICS["air_quality"]
    }


# =============================================================================
# FLASK HTTP SERVER & CLI INTERFACE
# =============================================================================

def create_app():
    from flask import Flask, request, jsonify
    try:
        from flask_cors import CORS
        has_cors = True
    except ImportError:
        has_cors = False

    app = Flask(__name__)
    if has_cors:
        CORS(app)
    else:
        @app.after_request
        def add_cors(resp):
            resp.headers['Access-Control-Allow-Origin'] = '*'
            resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
            return resp

    # Preload models at startup
    load_all_models()

    @app.get("/health")
    def health():
        return jsonify({
            "status": "healthy",
            "service": "Smart City Unified ML Inference Daemon",
            "timestamp": datetime.now().isoformat(),
            "models_loaded": {
                k: (v is not None) for k, v in MODELS.items()
            }
        })

    @app.post("/predict/transport")
    def api_transport():
        try:
            data = request.get_json(silent=True) or {}
            num_days = int(data.get("num_days", 7))
            base_date = data.get("base_date", None)
            res = predict_transport(num_days=num_days, base_date=base_date)
            return jsonify(res)
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 400

    @app.post("/predict/traffic")
    def api_traffic():
        try:
            data = request.get_json(silent=True) or {}
            res = predict_traffic(
                junction=data.get("junction", 1),
                hour=data.get("hour", 18),
                dayofweek=data.get("dayofweek", 2),
                weather=data.get("weather", "Clear"),
                incident=data.get("incident", 0)
            )
            return jsonify(res)
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 400

    @app.post("/predict/weather")
    def api_weather():
        try:
            data = request.get_json(silent=True) or {}
            res = predict_weather(
                hour=data.get("hour", 14),
                month=data.get("month", 5),
                humidity=data.get("humidity", 45.0),
                dewpoint=data.get("dewpoint", 18.0),
                pressure=data.get("pressure", 1010.0),
                windspeed=data.get("windspeed", 12.0)
            )
            return jsonify(res)
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 400

    @app.post("/predict/air-quality")
    def api_air_quality():
        try:
            data = request.get_json(silent=True) or {}
            res = predict_air_quality(
                pm25=data.get("pm25", 55.0),
                pm10=data.get("pm10", 110.0),
                no2=data.get("no2", 45.0),
                co=data.get("co", 1.2),
                temp=data.get("temp", 28.0),
                humidity=data.get("humidity", 55.0),
                wind=data.get("wind", 8.0),
                traffic=data.get("traffic", 0.65),
                hour=data.get("hour", 18),
                dayofweek=data.get("dayofweek", 2),
                month=data.get("month", 5),
                current_aqi=data.get("current_aqi", None)
            )
            return jsonify(res)
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 400

    return app


def run_cli(module, input_json_str):
    load_all_models()
    try:
        payload = json.loads(input_json_str) if input_json_str else {}
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Invalid input JSON: {e}"}))
        sys.exit(1)

    try:
        if module == "transport":
            res = predict_transport(
                num_days=payload.get("num_days", 7),
                base_date=payload.get("base_date", None)
            )
        elif module == "traffic":
            res = predict_traffic(
                junction=payload.get("junction", 1),
                hour=payload.get("hour", 18),
                dayofweek=payload.get("dayofweek", 2),
                weather=payload.get("weather", "Clear"),
                incident=payload.get("incident", 0)
            )
        elif module == "weather":
            res = predict_weather(
                hour=payload.get("hour", 14),
                month=payload.get("month", 5),
                humidity=payload.get("humidity", 45.0),
                dewpoint=payload.get("dewpoint", 18.0),
                pressure=payload.get("pressure", 1010.0),
                windspeed=payload.get("windspeed", 12.0)
            )
        elif module == "air_quality" or module == "air-quality":
            res = predict_air_quality(
                pm25=payload.get("pm25", 55.0),
                pm10=payload.get("pm10", 110.0),
                no2=payload.get("no2", 45.0),
                co=payload.get("co", 1.2),
                temp=payload.get("temp", 28.0),
                humidity=payload.get("humidity", 55.0),
                wind=payload.get("wind", 8.0),
                traffic=payload.get("traffic", 0.65),
                hour=payload.get("hour", 18),
                dayofweek=payload.get("dayofweek", 2),
                month=payload.get("month", 5),
                current_aqi=payload.get("current_aqi", None)
            )
        else:
            print(json.dumps({"success": False, "error": f"Unknown module '{module}'"}))
            sys.exit(1)

        print(json.dumps(res))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Smart City Unified ML Inference Service")
    parser.add_argument("--serve", action="store_true", help="Start persistent HTTP inference daemon")
    parser.add_argument("--port", type=int, default=5001, help="Port for HTTP daemon (default: 5001)")
    parser.add_argument("--module", type=str, choices=["transport", "traffic", "weather", "air_quality", "air-quality"], help="Module for CLI execution")
    parser.add_argument("--input", type=str, default="{}", help="Input parameters in JSON format")

    args = parser.parse_args()

    if args.serve:
        app = create_app()
        print(f"Starting Smart City Unified ML Inference Daemon on http://127.0.0.1:{args.port}...")
        app.run(host="127.0.0.1", port=args.port, debug=False)
    elif args.module:
        run_cli(args.module, args.input)
    else:
        # Default behavior: test all 4 models
        print("Testing all 4 models in Unified ML Inference Service...")
        load_all_models()
        for mod in ["transport", "traffic", "weather", "air_quality"]:
            print(f"\n--- Testing {mod.upper()} ---")
            if mod == "transport":
                res = predict_transport(num_days=3)
            elif mod == "traffic":
                res = predict_traffic(junction=1, hour=18)
            elif mod == "weather":
                res = predict_weather(hour=14, month=5)
            elif mod == "air_quality":
                res = predict_air_quality(pm25=55.0, hour=18)
            print(f"Success: {res.get('success')} | Model: {res.get('model')} | Output: {res.get('prediction_type')}")


if __name__ == "__main__":
    main()
