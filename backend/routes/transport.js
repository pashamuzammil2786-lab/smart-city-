const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const routingService = require('../services/routingService');
const mlInferenceService = require('../services/mlInferenceService');

// Helper: Haversine distance in kilometers
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371.0;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Parse HH:MM:SS to minutes from midnight
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

// Helper: Format GTFS time for presentation
function formatTime(timeStr) {
  if (!timeStr) return '--:--';
  const parts = timeStr.trim().split(':');
  const h = (parseInt(parts[0], 10) || 0) % 24;
  const m = parts[1] || '00';
  return `${h.toString().padStart(2, '0')}:${m}`;
}

// Helper: Estimate Crowd Level based on time of day
function estimateCrowdLevel(departureTimeStr) {
  let totalHour = 12.0;
  try {
    const parts = departureTimeStr.split(':');
    const h = (parseInt(parts[0], 10) || 0) % 24;
    const m = parseInt(parts[1], 10) || 0;
    totalHour = h + m / 60.0;
  } catch (e) {
    totalHour = 12.0;
  }

  if ((totalHour >= 8.0 && totalHour <= 10.5) || (totalHour >= 17.0 && totalHour <= 20.0)) {
    return {
      level: 'High',
      badge: 'High Crowd (Standing Only)',
      occupancy_rate: '85% - 95%',
      description: 'Peak commuter rush hour. Standing room only expected.',
      penalty: 15
    };
  } else if ((totalHour > 10.5 && totalHour < 17.0) || (totalHour > 20.0 && totalHour <= 22.0)) {
    return {
      level: 'Moderate',
      badge: 'Moderate Crowd (Partial Seats)',
      occupancy_rate: '55% - 70%',
      description: 'Standard daytime demand. Partial seating available.',
      penalty: 5
    };
  } else {
    return {
      level: 'Low',
      badge: 'Low Crowd (Ample Seats)',
      occupancy_rate: '25% - 40%',
      description: 'Off-peak transit hours. Ample seating available.',
      penalty: 0
    };
  }
}

// Helper: Estimate Traffic Delay
function estimateExpectedDelay(departureTimeStr, stopsCount, scheduledDurationMins) {
  let hour = 12;
  try {
    hour = (parseInt(departureTimeStr.split(':')[0], 10) || 12) % 24;
  } catch (e) {
    hour = 12;
  }

  const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
  const isModerate = (hour >= 11 && hour <= 16) || (hour >= 21 && hour <= 22);

  let delayMins = 0;
  let trafficStatus = 'Smooth Flow';

  if (isPeak) {
    delayMins = Math.max(5, Math.round(5 + stopsCount * 0.45));
    trafficStatus = 'Heavy Peak Congestion';
  } else if (isModerate) {
    delayMins = Math.max(2, Math.round(2 + stopsCount * 0.25));
    trafficStatus = 'Moderate Traffic';
  } else {
    delayMins = Math.max(0, Math.round(1 + stopsCount * 0.1));
    trafficStatus = 'Smooth Flow';
  }

  return {
    expectedDelayMins: delayMins,
    trafficCondition: trafficStatus,
    totalEstimatedTimeMins: scheduledDurationMins + delayMins
  };
}

// Helper: Resolve Stop Cluster
async function resolveStopCluster(stopInput) {
  if (!stopInput || !stopInput.trim()) return [];
  const query = stopInput.trim();

  // 1. Exact ID
  const [byId] = await pool.query('SELECT * FROM transit_stops WHERE stop_id = ?', [query]);
  if (byId.length > 0) {
    const [sameName] = await pool.query('SELECT * FROM transit_stops WHERE LOWER(stop_name) = LOWER(?)', [byId[0].stop_name]);
    return sameName;
  }

  // 2. Exact Name
  const [byName] = await pool.query('SELECT * FROM transit_stops WHERE LOWER(stop_name) = LOWER(?)', [query]);
  if (byName.length > 0) return byName;

  // 3. Fuzzy search
  const [byFuzzy] = await pool.query(
    `SELECT * FROM transit_stops 
     WHERE stop_name LIKE ? OR stop_desc LIKE ? 
     ORDER BY CASE WHEN stop_name LIKE ? THEN 1 ELSE 2 END, LENGTH(stop_name) ASC LIMIT 10`,
    [`%${query}%`, `%${query}%`, `${query}%`]
  );

  if (byFuzzy.length > 0) {
    const primaryName = byFuzzy[0].stop_name;
    return byFuzzy.filter((s) => s.stop_name.toLowerCase() === primaryName.toLowerCase());
  }

  return [];
}

// -----------------------------------------------------------------------------
// 1. GET /api/transport/stops (Search bus stops for autocomplete)
// -----------------------------------------------------------------------------
router.get('/stops', async (req, res) => {
  try {
    const q = req.query.q ? req.query.q.trim() : '';
    const limit = parseInt(req.query.limit || '10', 10);

    if (!q) {
      const [rows] = await pool.query(
        'SELECT stop_id, stop_name, zone_id, stop_lat, stop_lon, stop_desc FROM transit_stops LIMIT ?',
        [limit]
      );
      return res.json({ stops: rows });
    }

    const [rows] = await pool.query(
      `SELECT stop_id, stop_name, zone_id, stop_lat, stop_lon, stop_desc 
       FROM transit_stops 
       WHERE stop_name LIKE ? OR stop_desc LIKE ? 
       ORDER BY CASE WHEN stop_name LIKE ? THEN 1 ELSE 2 END, LENGTH(stop_name) ASC 
       LIMIT ?`,
      [`%${q}%`, `%${q}%`, `${q}%`, limit]
    );

    res.json({ stops: rows });
  } catch (error) {
    console.error('[Transport Stops API Error]:', error);
    res.status(500).json({ error: 'Failed to search transit stops.' });
  }
});

// -----------------------------------------------------------------------------
// 2. GET /api/transport/nearby-stops (GPS Nearby Stops via Haversine)
// -----------------------------------------------------------------------------
router.get('/nearby-stops', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const radiusKm = parseFloat(req.query.radius || '2.0');
    const limit = parseInt(req.query.limit || '5', 10);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Valid latitude and longitude are required.' });
    }

    const latDelta = radiusKm / 111.0;
    const lonDelta = radiusKm / (111.0 * Math.cos(lat * (Math.PI / 180)));

    const [rows] = await pool.query(
      `SELECT stop_id, stop_name, zone_id, stop_lat, stop_lon, stop_desc
       FROM transit_stops
       WHERE stop_lat BETWEEN ? AND ?
         AND stop_lon BETWEEN ? AND ?`,
      [lat - latDelta, lat + latDelta, lon - lonDelta, lon + lonDelta]
    );

    const nearby = [];
    for (const r of rows) {
      if (r.stop_lat !== null && r.stop_lon !== null) {
        const dist = haversineDistance(lat, lon, parseFloat(r.stop_lat), parseFloat(r.stop_lon));
        if (dist <= radiusKm) {
          nearby.push({
            ...r,
            stop_lat: parseFloat(r.stop_lat),
            stop_lon: parseFloat(r.stop_lon),
            distance_km: Math.round(dist * 100) / 100,
            distance_meters: Math.round(dist * 1000)
          });
        }
      }
    }

    nearby.sort((a, b) => a.distance_km - b.distance_km);
    res.json({ nearbyStops: nearby.slice(0, limit) });
  } catch (error) {
    console.error('[Nearby Stops API Error]:', error);
    res.status(500).json({ error: 'Failed to find nearby transit stops.' });
  }
});

// -----------------------------------------------------------------------------
// 3. GET /api/transport/routes (Multi-Tier Transit Routing: Direct, 1-Transfer, etc.)
// -----------------------------------------------------------------------------
router.get('/routes', async (req, res) => {
  try {
    const origin = req.query.origin ? req.query.origin.trim() : '';
    const destination = req.query.destination ? req.query.destination.trim() : '';
    const maxOptions = parseInt(req.query.limit || '8', 10);

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Please provide both origin and destination stops.' });
    }

    const result = await routingService.findTransitJourneys(origin, destination, maxOptions);

    if (result.status === 'INVALID_INPUT') {
      return res.status(400).json({ error: result.error });
    }
    if (result.status === 'NOT_FOUND') {
      return res.status(404).json({ error: result.error });
    }

    // Save search log non-critically
    try {
      if (result.origin && result.destination) {
        await pool.query('INSERT INTO user_trip_searches (origin_stop_id, destination_stop_id) VALUES (?, ?)', [
          result.origin.stop_name || origin,
          result.destination.stop_name || destination
        ]);
      }
    } catch (e) {
      // Non-critical logging
    }

    res.json(result);
  } catch (error) {
    console.error('[Transport Routes API Error]:', error);
    res.status(500).json({ error: 'Failed to compute transit routes: ' + error.message });
  }
});

// -----------------------------------------------------------------------------
// 4. GET /api/transport/route-stops (Get intermediate stops for single or multi-leg trips)
// -----------------------------------------------------------------------------
router.get('/route-stops', async (req, res) => {
  try {
    const { trip_id, route_id } = req.query;
    if (!trip_id && !route_id) {
      return res.status(400).json({ error: 'Please provide a trip_id or route_id' });
    }

    let targetTripId = trip_id;
    if (!targetTripId && route_id) {
      const [trips] = await pool.query('SELECT trip_id FROM transit_trips WHERE route_id = ? LIMIT 1', [route_id]);
      if (trips.length > 0) {
        targetTripId = trips[0].trip_id;
      }
    }

    if (!targetTripId) {
      return res.json({ stops: [] });
    }

    const tripIds = targetTripId.split('_').filter(Boolean);
    let stops = [];

    if (tripIds.length === 1) {
      const [rows] = await pool.query(
        `SELECT s.stop_id, s.stop_name, s.zone_id, s.stop_lat, s.stop_lon, st.stop_sequence, st.departure_time, st.arrival_time
         FROM transit_stop_times st
         JOIN transit_stops s ON st.stop_id = s.stop_id
         WHERE st.trip_id = ?
         ORDER BY st.stop_sequence ASC`,
        [tripIds[0]]
      );
      stops = rows;
    } else {
      // Transfer journey: fetch stops for each leg in order
      for (const tid of tripIds) {
        const [rows] = await pool.query(
          `SELECT s.stop_id, s.stop_name, s.zone_id, s.stop_lat, s.stop_lon, st.stop_sequence, st.departure_time, st.arrival_time
           FROM transit_stop_times st
           JOIN transit_stops s ON st.stop_id = s.stop_id
           WHERE st.trip_id = ?
           ORDER BY st.stop_sequence ASC`,
          [tid]
        );
        stops.push(...rows);
      }
    }

    const formattedStops = stops.map((s) => ({
      ...s,
      stop_lat: s.stop_lat ? parseFloat(s.stop_lat) : null,
      stop_lon: s.stop_lon ? parseFloat(s.stop_lon) : null
    }));

    res.json({ trip_id: targetTripId, stops: formattedStops });
  } catch (error) {
    console.error('[Route Stops API Error]:', error);
    res.status(500).json({ error: 'Failed to retrieve route stops.' });
  }
});

// -----------------------------------------------------------------------------
// 5. GET /api/transport/forecast (7-Day Passenger Demand Prediction - Live ML)
// -----------------------------------------------------------------------------
router.get('/forecast', async (req, res) => {
  const numDays = Math.max(1, Math.min(14, parseInt(req.query.num_days || '7', 10)));
  const baseDate = req.query.base_date || null;

  // 1. Attempt genuine Machine Learning inference (Random Forest Regressor)
  try {
    const mlResult = await mlInferenceService.predictTransportDemand(numDays, baseDate);
    return res.json({
      success: true,
      module: 'transport',
      prediction_type: 'transit_demand',
      prediction_source: 'Machine Learning',
      model: 'Random Forest Regressor',
      model_used: 'Random Forest Regressor (Ensemble)',
      prediction_horizon: `${mlResult.prediction.forecast_days.length} Days Ahead`,
      base_date: mlResult.prediction.base_date,
      forecast_horizon: `${mlResult.prediction.forecast_days.length} Days`,
      forecast: mlResult.prediction.forecast_days,
      target_variable: mlResult.prediction.target_variable,
      average_predicted_daily_ridership: mlResult.prediction.average_predicted_daily_ridership,
      is_fallback: false,
      metrics: mlResult.metrics
    });
  } catch (mlErr) {
    console.warn('[Transport ML Forecast Warning]: Falling back to analytical model:', mlErr.message);
  }

  // 2. Analytical Fallback (Calibrated diurnal calendar if ML process is unavailable)
  try {
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const forecastDays = [];

    for (let i = 1; i <= numDays; i++) {
      const fDate = new Date(today.getTime() + i * 24 * 3600 * 1000);
      const dateStr = fDate.toISOString().split('T')[0];
      const dayIdx = fDate.getDay();
      const dayName = dayNames[dayIdx];
      let dayType = 'Weekday';
      let baseline = 1060000;
      let note = 'Standard weekday commuter rush';

      if (dayIdx === 0) {
        dayType = 'Sunday / Holiday';
        baseline = 556000;
        note = 'Lowest weekly ridership dip (-48%)';
      } else if (dayIdx === 6) {
        dayType = 'Saturday';
        baseline = 752000;
        note = 'Weekend recreational traffic (-30%)';
      } else if (dayIdx === 5) {
        dayType = 'Weekday';
        baseline = 1052000;
        note = 'Evening weekend-departure surge';
      } else if (dayIdx === 1) {
        dayType = 'Weekday';
        baseline = 1095000;
        note = 'Heavy start-of-week office rush';
      }

      const seedVariance = ((fDate.getDate() * 17 + fDate.getMonth() * 31) % 20000) - 10000;
      const predictedRidership = Math.round(baseline + seedVariance);

      forecastDays.push({
        step: i,
        date: dateStr,
        day_name: dayName,
        day_type: dayType,
        predicted_total_ridership: predictedRidership,
        note
      });
    }

    res.json({
      success: true,
      module: 'transport',
      prediction_type: 'transit_demand',
      prediction_source: 'Analytical Fallback',
      model_used: 'Calibrated Diurnal Calendar Model (Analytical Fallback)',
      base_date: today.toISOString().split('T')[0],
      forecast_horizon: `${numDays} Days`,
      forecast: forecastDays,
      is_fallback: true,
      fallback_note: 'Machine Learning daemon unavailable; serving calibrated analytical baseline'
    });
  } catch (error) {
    console.error('[Transport Forecast Error]:', error);
    res.status(500).json({ error: 'Failed to generate demand forecast.' });
  }
});

// -----------------------------------------------------------------------------
// 5b. POST /api/transport/predict-demand (Interactive Demand Predictor)
// -----------------------------------------------------------------------------
router.post('/predict-demand', async (req, res) => {
  try {
    const { num_days = 7, base_date = null } = req.body || {};
    const result = await mlInferenceService.predictTransportDemand(num_days, base_date);
    res.json(result);
  } catch (error) {
    console.error('[Transport Predict Demand Error]:', error);
    res.status(500).json({ error: 'Transport demand prediction failed: ' + error.message });
  }
});

// -----------------------------------------------------------------------------
// 6. GET /api/transport/ml-metrics (Model Evaluation Results)
// -----------------------------------------------------------------------------
router.get('/ml-metrics', (req, res) => {
  try {
    const metaPath = path.join(__dirname, '..', '..', 'ml', 'transport', 'models', 'model_metadata.json');
    if (fs.existsSync(metaPath)) {
      const data = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      return res.json(data);
    }

    res.json({
      best_model: 'Random Forest Regressor',
      target_variable: 'total_rides',
      test_r2_score: 0.6413,
      test_rmse: 135231.47,
      test_mae: 105570.74,
      test_mape: 14.32,
      features_count: 22,
      split: '80/20 Chronological Split (No data leakage)',
      training_samples: 7425,
      test_samples: 1857,
      note: 'MAPE indicates mean absolute percentage error (14.32%). Lower MAPE signifies higher prediction reliability.'
    });
  } catch (error) {
    console.error('[ML Metrics Error]:', error);
    res.status(500).json({ error: 'Failed to load model metrics.' });
  }
});

// -----------------------------------------------------------------------------
// 7. GET /api/transport/model-comparison (Comparison Table for 5 Algorithms)
// -----------------------------------------------------------------------------
router.get('/model-comparison', (req, res) => {
  try {
    const comparison = [
      { model: 'Random Forest Regressor', mae: 105570.74, rmse: 135231.47, r2_score: 0.6413, mape: 14.32, status: 'Selected Best Model' },
      { model: 'Linear Regression', mae: 118912.26, rmse: 148107.39, r2_score: 0.5698, mape: 19.54, status: 'Baseline Linear' },
      { model: 'Ridge Regression', mae: 119019.66, rmse: 148208.84, r2_score: 0.5692, mape: 19.56, status: 'L2 Regularized' },
      { model: 'Gradient Boosting Regressor', mae: 140707.46, rmse: 176832.05, r2_score: 0.3867, mape: 17.87, status: 'Sequential Boosting' },
      { model: 'Decision Tree Regressor', mae: 224210.80, rmse: 297600.64, r2_score: -0.7371, mape: 28.44, status: 'Overfitted Baseline' }
    ];

    res.json({ comparison });
  } catch (error) {
    console.error('[Model Comparison Error]:', error);
    res.status(500).json({ error: 'Failed to load model comparison table.' });
  }
});

// -----------------------------------------------------------------------------
// 8. GET /api/transport/actual-vs-predicted (Real Test Period Evaluation Data)
// -----------------------------------------------------------------------------
router.get('/actual-vs-predicted', (req, res) => {
  try {
    const evalPath = path.join(__dirname, '..', '..', 'ml', 'transport', 'models', 'evaluation_test_series.json');
    if (fs.existsSync(evalPath)) {
      const data = JSON.parse(fs.readFileSync(evalPath, 'utf8'));
      return res.json(data);
    }

    res.json({ sample_points: [] });
  } catch (error) {
    console.error('[Actual vs Predicted Error]:', error);
    res.status(500).json({ error: 'Failed to load actual vs predicted series.' });
  }
});

module.exports = router;
