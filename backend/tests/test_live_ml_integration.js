/**
 * =============================================================================
 * Smart City Urban Analytics Platform - Live ML Integration Test Suite
 * Hybrid ML + Analytical Decision-Support Architecture
 * =============================================================================
 * Tests the live invocation of all 4 trained machine learning models through
 * the Express backend API and verifies mathematical consistency, input/output
 * validation, and complete separation from GTFS routing.
 * =============================================================================
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const postData = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      },
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request to ${path} timed out`));
    });

    if (postData) req.write(postData);
    req.end();
  });
}

async function runLiveMLTestSuite() {
  console.log('='.repeat(75));
  console.log('🧪 RUNNING SMART CITY LIVE ML INTEGRATION TEST SUITE');
  console.log('='.repeat(75));

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`  ✔ [PASS] ${message} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`  ✖ [FAIL] ${message} ${details ? ': ' + details : ''}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: ML Inference Engine Health Endpoint
    // -------------------------------------------------------------------------
    console.log('\n[1/6] Testing ML Engine Health & Daemon API (/api/ml/health)...');
    const healthRes = await makeRequest('GET', '/ml/health');
    assert(healthRes.status === 200, 'ML health endpoint returns HTTP 200');
    assert(healthRes.data.success === true, 'ML health endpoint returns success: true');
    assert(healthRes.data.daemon_status !== undefined, 'Daemon status reported', healthRes.data.daemon_status);

    // -------------------------------------------------------------------------
    // TEST 2: Transport Demand ML Forecasting (Random Forest)
    // -------------------------------------------------------------------------
    console.log('\n[2/6] Testing Transport Module Live ML Prediction (/api/transport/forecast)...');
    const transRes = await makeRequest('GET', '/transport/forecast?num_days=7');
    assert(transRes.status === 200, 'Transport forecast returns HTTP 200');
    assert(transRes.data.model === 'Random Forest Regressor' || transRes.data.model_used.includes('Random Forest'), 'Invoked Random Forest model', transRes.data.model || transRes.data.model_used);
    assert(Array.isArray(transRes.data.forecast) && transRes.data.forecast.length === 7, 'Forecast contains 7 recursive daily predictions');
    const f1 = transRes.data.forecast[0];
    assert(typeof f1.predicted_total_ridership === 'number' && f1.predicted_total_ridership > 100000, 'First day ridership is valid non-zero count', `${f1.predicted_total_ridership.toLocaleString()} rides on ${f1.date}`);
    assert(transRes.data.target_variable?.includes('total_rides') || transRes.data.metrics?.target?.includes('total_rides'), 'Target variable is strictly total_rides');

    // -------------------------------------------------------------------------
    // TEST 3: Traffic Junction Flow ML Prediction (Gradient Boosting)
    // -------------------------------------------------------------------------
    console.log('\n[3/6] Testing Traffic Module Live ML Prediction (/api/traffic/predict)...');
    const trafRes = await makeRequest('POST', '/traffic/predict', {
      corridorId: 'CORR-01',
      junctionId: 1,
      hourOfDay: 18,
      weatherCondition: 'Clear',
      incidentSeverity: 'None'
    });
    assert(trafRes.status === 200, 'Traffic predict returns HTTP 200');
    assert(trafRes.data.ml_junction_prediction !== null, 'ML junction prediction object present');
    assert(typeof trafRes.data.predictedVehiclesPerHour === 'number' && trafRes.data.predictedVehiclesPerHour > 0, 'Predicted vehicles/hr is positive number', `${trafRes.data.predictedVehiclesPerHour} veh/hr`);
    assert(trafRes.data.ml_junction_prediction?.model === 'Gradient Boosting Regressor', 'Identified Gradient Boosting model architecture');
    assert(typeof trafRes.data.predictedTravelTimeMin === 'number', 'Retained analytical corridor travel time', `${trafRes.data.predictedTravelTimeMin} mins`);
    assert(trafRes.data.prediction_source.includes('Hybrid'), 'Transparently labeled as Hybrid ML + Analytical');

    // -------------------------------------------------------------------------
    // TEST 4: Weather Ambient Temperature ML Prediction (Linear Regression Pipeline)
    // -------------------------------------------------------------------------
    console.log('\n[4/6] Testing Weather Module Live ML Prediction (/api/weather/predict-temperature)...');
    const weathRes = await makeRequest('POST', '/weather/predict-temperature', {
      hour: 14,
      month: 5,
      humidity: 45.0,
      dewpoint: 18.0,
      pressure: 1010.0,
      windspeed: 12.0
    });
    assert(weathRes.status === 200, 'Weather predict returns HTTP 200');
    assert(weathRes.data.model === 'Linear Regression Pipeline', 'Invoked Linear Regression pipeline');
    assert(typeof weathRes.data.prediction?.predicted_temperature_c === 'number', 'Predicted ambient temperature is valid number', `${weathRes.data.prediction.predicted_temperature_c}°C`);
    assert(typeof weathRes.data.prediction?.feels_like_c === 'number', 'Calculated apparent feels-like temperature', `${weathRes.data.prediction.feels_like_c}°C`);
    assert(weathRes.data.prediction?.thermal_comfort_level !== undefined, 'Assigned thermal comfort category', weathRes.data.prediction.thermal_comfort_level);

    // -------------------------------------------------------------------------
    // TEST 5: Air Quality 1-Hour Ahead NAQI Forecasting (Support Vector Regressor)
    // -------------------------------------------------------------------------
    console.log('\n[5/6] Testing Air Quality Module Live ML Prediction (/api/air-quality/predict)...');
    const aqiRes = await makeRequest('POST', '/air-quality/predict', {
      pm25: 65,
      pm10: 125,
      no2: 48,
      co: 1.3,
      temperature: 30,
      humidity: 55,
      wind_speed: 8,
      traffic_congestion: 0.7,
      hour: 18
    });
    assert(aqiRes.status === 200, 'AQI predict returns HTTP 200');
    assert(aqiRes.data.model === 'Support Vector Regressor (SVR)' || aqiRes.data.modelUsed?.includes('SVR'), 'Invoked SVR ML model', aqiRes.data.model || aqiRes.data.modelUsed);
    assert(typeof aqiRes.data.predictedAQI === 'number' && aqiRes.data.predictedAQI >= 0 && aqiRes.data.predictedAQI <= 500, 'Predicted AQI is valid CPCB score [0-500]', `AQI: ${aqiRes.data.predictedAQI}`);
    assert(aqiRes.data.category !== undefined, 'Assigned CPCB NAQI category', aqiRes.data.category);
    assert(aqiRes.data.prediction_source === 'Machine Learning', 'Explicitly tagged prediction_source: Machine Learning');

    // -------------------------------------------------------------------------
    // TEST 6: Transport Routing Protection & Durations Invariance
    // -------------------------------------------------------------------------
    console.log('\n[6/6] Verifying Transport Routing Protection (ML Demand decoupled from routing)...');
    const routeRes = await makeRequest('GET', '/transport/routes?origin=Mehdipatnam&destination=Dondanpally');
    assert(routeRes.status === 200, 'Mehdipatnam -> Dondanpally returns HTTP 200');
    const bestRoute = routeRes.data.options[0];
    assert(bestRoute.total_estimated_travel_time_mins === 89, 'Mehdipatnam -> Dondanpally total duration preserved at 89 mins', `Scheduled: ${bestRoute.scheduled_duration_mins}m + Delay: ${bestRoute.expected_delay_mins}m = ${bestRoute.total_estimated_travel_time_mins}m`);
    assert(bestRoute.total_estimated_travel_time_mins < 120, 'Duration remains strictly free of former 1000+ min bug');

  } catch (error) {
    console.error('Fatal error during test suite execution:', error);
    failed++;
  }

  console.log('\n' + '='.repeat(75));
  console.log(`TEST SUITE RESULTS: ${passed} Passed, ${failed} Failed (Total: ${passed + failed})`);
  console.log('='.repeat(75));

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runLiveMLTestSuite();
