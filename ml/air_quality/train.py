"""
Train and compare AQI forecasting models (Random Forest, SVR, Linear baseline),
following Kala et al. (2020) and Cabrera et al. (2020). Saves the best model.

Usage:
    python train.py --data data/air_quality.csv --horizon 1
"""
import argparse
import json
import os

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR

from features import add_features, feature_columns, load_data


def metrics(y, p):
    return {"MAE": float(mean_absolute_error(y, p)),
            "RMSE": float(np.sqrt(mean_squared_error(y, p))),
            "R2": float(r2_score(y, p))}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default="data/air_quality.csv")
    ap.add_argument("--horizon", type=int, default=1, help="hours ahead to predict")
    ap.add_argument("--out", default="models")
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    df = add_features(load_data(args.data), args.horizon)
    cols = feature_columns(df)

    # Time-based split (no shuffling -> no leakage)
    split = int(len(df) * 0.8)
    X_tr, X_te = df[cols].iloc[:split], df[cols].iloc[split:]
    y_tr, y_te = df["target"].iloc[:split], df["target"].iloc[split:]
    print(f"Train: {len(X_tr)}  Test: {len(X_te)}  Features: {len(cols)}")

    models = {
        "LinearRegression": make_pipeline(StandardScaler(), LinearRegression()),
        "SVR": make_pipeline(StandardScaler(), SVR(C=50, epsilon=1.0)),
        "RandomForest": RandomForestRegressor(n_estimators=200, max_depth=18,
                                              n_jobs=-1, random_state=42),
    }

    results, preds = {}, {}
    for name, m in models.items():
        m.fit(X_tr, y_tr)
        preds[name] = m.predict(X_te)
        results[name] = metrics(y_te, preds[name])
        print(f"{name:18s} MAE={results[name]['MAE']:.2f} "
              f"RMSE={results[name]['RMSE']:.2f} R2={results[name]['R2']:.3f}")

    best = min(results, key=lambda k: results[k]["RMSE"])
    print(f"\nBest model: {best}")
    joblib.dump({"model": models[best], "features": cols, "horizon": args.horizon,
                 "name": best}, os.path.join(args.out, "aqi_model.joblib"))
    with open(os.path.join(args.out, "metrics.json"), "w") as f:
        json.dump({"best": best, "horizon_hours": args.horizon, "results": results}, f, indent=2)

    # Plot: actual vs predicted (last 7 days of test set)
    n = min(168, len(y_te))
    plt.figure(figsize=(11, 4))
    plt.plot(y_te.values[-n:], label="Actual", lw=1.5)
    plt.plot(preds[best][-n:], label=f"Predicted ({best})", lw=1.2)
    plt.title(f"AQI forecast ({args.horizon}h ahead) - last {n} hours of test set")
    plt.xlabel("Hour"); plt.ylabel("AQI"); plt.legend(); plt.tight_layout()
    plt.savefig(os.path.join(args.out, "forecast_plot.png"), dpi=120)

    # Feature importance (Random Forest)
    rf = models["RandomForest"]
    imp = sorted(zip(cols, rf.feature_importances_), key=lambda t: -t[1])[:12]
    plt.figure(figsize=(8, 5))
    plt.barh([k for k, _ in imp][::-1], [v for _, v in imp][::-1])
    plt.title("Top feature importances (Random Forest)"); plt.tight_layout()
    plt.savefig(os.path.join(args.out, "feature_importance.png"), dpi=120)
    print(f"Saved model, metrics and plots to {args.out}/")


if __name__ == "__main__":
    main()
