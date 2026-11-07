"""
Flask API for the Air Quality module (consumed by the Node.js/React platform).

Run:   python app.py
Endpoints:
    GET  /health
    GET  /api/aqi/forecast?data=data/air_quality.csv   -> next-hour AQI from latest data
    POST /api/aqi/predict   JSON: a recent history of rows (>=25 hourly records)
"""
import os

import joblib
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

from features import REQUIRED, add_features, aqi_category, load_data

MODEL_PATH = os.environ.get("MODEL_PATH", "models/aqi_model.joblib")
DATA_PATH = os.environ.get("DATA_PATH", "data/air_quality.csv")

app = Flask(__name__)
CORS(app)
bundle = joblib.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else None


def _predict(history: pd.DataFrame):
    # horizon=0 keeps the latest row (its target is unknown, so we ignore it)
    feats = add_features(history.assign(AQI=history["AQI"]), horizon=0)
    row = feats.iloc[[-1]][bundle["features"]]
    val = float(bundle["model"].predict(row)[0])
    last_ts = feats["timestamp"].iloc[-1]
    return {
        "based_on": str(last_ts),
        "forecast_for": str(last_ts + pd.Timedelta(hours=bundle["horizon"])),
        "predicted_aqi": round(val, 1),
        "category": aqi_category(val),
        "model": bundle["name"],
    }


@app.get("/health")
def health():
    return jsonify(status="ok", model_loaded=bundle is not None)


@app.get("/api/aqi/forecast")
def forecast():
    if bundle is None:
        return jsonify(error="Model not trained. Run train.py first."), 503
    df = load_data(request.args.get("data", DATA_PATH)).tail(72)
    return jsonify(_predict(df))


@app.post("/api/aqi/predict")
def predict():
    if bundle is None:
        return jsonify(error="Model not trained. Run train.py first."), 503
    rows = request.get_json(force=True)
    df = pd.DataFrame(rows)
    missing = [c for c in REQUIRED if c not in df.columns]
    if missing:
        return jsonify(error=f"missing fields: {missing}"), 400
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    if len(df) < 25:
        return jsonify(error="need at least 25 hourly records"), 400
    return jsonify(_predict(df.sort_values("timestamp")))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5001)), debug=False)
