# Air Quality Module — Urban Analytics & Predictive Decision Support Platform

Module 4 of 4 (Transport, Traffic, Weather, **Air Quality**). Forecasts the Air Quality
Index (AQI) for Hyderabad a few hours ahead using pollutants, weather and traffic
congestion — the multi-source fusion approach from Zheng et al. (2015), Cabrera et al.
(2020) and Kala et al. (2020).

## Structure
```
generate_data.py   synthetic hourly dataset (use until real data is ready)
features.py        loading, cleaning, feature engineering, AQI categories
train.py           trains Linear / SVR / Random Forest, saves best model + plots
app.py             Flask REST API for the Node.js / React app
```

## Quick start
```bash
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

python generate_data.py --days 1095 --out data/air_quality.csv
python train.py --data data/air_quality.csv --horizon 1
python app.py
```
Then open `http://localhost:5001/api/aqi/forecast`.

## Using real data
Provide `data/air_quality.csv` with these columns (hourly):
`timestamp, PM2.5, PM10, NO2, CO, temperature, humidity, wind_speed, rainfall, traffic_congestion, AQI`

Sources: CPCB / OpenAQ (Hyderabad stations), OpenWeatherMap or Open-Meteo for weather,
and the Traffic module's congestion index for `traffic_congestion`.

## API
- `GET /health`
- `GET /api/aqi/forecast` → `{predicted_aqi, category, forecast_for, model}`
- `POST /api/aqi/predict` with a JSON list of ≥25 recent hourly rows

## Outputs (`models/`)
`metrics.json`, `forecast_plot.png`, `feature_importance.png`, `aqi_model.joblib`

> Note: the bundled dataset is synthetic, so reported metrics only demonstrate the
> pipeline. Retrain on real data before drawing conclusions.
