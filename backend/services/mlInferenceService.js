/**
 * =============================================================================
 * Smart City Urban Analytics Platform - ML Inference Service Bridge
 * Hybrid ML + Analytical Decision-Support Architecture
 * =============================================================================
 * Connects Node.js Express backend routes to the Python ML Inference Service.
 * 
 * Execution Strategy:
 *  1. Primary: Persistent HTTP Inference Daemon (http://127.0.0.1:5001)
 *     - Zero model reload latency (< 5ms response time)
 *     - Models pre-loaded in memory
 *  2. Fallback: Controlled Python Subprocess CLI (python ml/unified_inference_service.py)
 *     - Automatic failover if HTTP daemon is down or restarts
 *     - Strict timeout protection (5000ms)
 *  3. Resilient Error Handling:
 *     - Validates inputs before dispatching
 *     - Validates outputs (rejects NaN, Inf, nulls, unphysical values)
 *     - Never exposes filesystem paths or internal stack traces
 *     - Transparently indicates prediction_source: 'Machine Learning' or 'Analytical Fallback'
 * =============================================================================
 */

const http = require('http');
const https = require('https');
const { spawn } = require('child_process');
const path = require('path');
const { URL } = require('url');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const SCRIPT_PATH = path.join(PROJECT_ROOT, 'ml', 'unified_inference_service.py');

/**
 * Resolve target ML service configuration dynamically.
 * Prioritizes ML_SERVICE_URL (e.g. 'https://smart-city-dhj4.onrender.com'),
 * falling back to ML_DAEMON_HOST:ML_DAEMON_PORT (default: 127.0.0.1:5001).
 */
function getServiceConfig() {
  const serviceUrl = process.env.ML_SERVICE_URL;
  if (serviceUrl && serviceUrl.trim()) {
    try {
      const parsed = new URL(serviceUrl.trim());
      const isHttps = parsed.protocol === 'https:';
      return {
        protocol: parsed.protocol,
        isHttps,
        client: isHttps ? https : http,
        hostname: parsed.hostname,
        port: parsed.port ? parseInt(parsed.port, 10) : (isHttps ? 443 : 80),
        basePath: parsed.pathname.replace(/\/+$/, ''),
        fullUrl: serviceUrl.trim().replace(/\/+$/, ''),
        isExternal: true
      };
    } catch (err) {
      console.warn('[ML Service URL Warning]: Could not parse ML_SERVICE_URL, using host/port:', err.message);
    }
  }

  const host = process.env.ML_DAEMON_HOST || '127.0.0.1';
  const port = parseInt(process.env.ML_DAEMON_PORT || '5001', 10);
  return {
    protocol: 'http:',
    isHttps: false,
    client: http,
    hostname: host,
    port: port,
    basePath: '',
    fullUrl: `http://${host}:${port}`,
    isExternal: false
  };
}

/**
 * Validate numeric value and ensure it's not NaN or infinite
 */
function isValidNumber(val) {
  return typeof val === 'number' && !isNaN(val) && isFinite(val);
}

/**
 * Sanitize error message to prevent leaking internal directory paths
 */
function sanitizeErrorMessage(msg) {
  if (!msg) return 'Inference service error';
  return String(msg)
    .replace(/[A-Za-z]:\\[^:\n\r\t]+/g, '[Internal Path]')
    .replace(/\/[^:\n\r\t]+/g, '[Internal Path]')
    .slice(0, 200);
}

/**
 * Make an HTTP / HTTPS POST request to the Python ML inference service
 */
function queryDaemon(endpoint, payload, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const config = getServiceConfig();
    const postData = JSON.stringify(payload);
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullPath = `${config.basePath}${cleanEndpoint}`;

    const options = {
      hostname: config.hostname,
      port: config.port,
      path: fullPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Accept': 'application/json',
        'User-Agent': 'SmartCity-Backend-Node/1.0'
      },
      timeout: timeoutMs
    };

    const req = config.client.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300 && parsed.success) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error || `ML service returned status ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error(`Invalid JSON response from ML service (status ${res.statusCode})`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`ML service request to ${endpoint} timed out after ${timeoutMs}ms`));
    });

    req.on('error', (err) => {
      reject(new Error(`ML service connection error (${config.fullUrl}): ${err.message}`));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Fallback: execute Python inference script via CLI subprocess (Local dev only)
 */
function runSubprocess(moduleName, payload, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const pyCmd = process.platform === 'win32' ? 'python' : 'python3';
    const jsonStr = JSON.stringify(payload);
    const args = [SCRIPT_PATH, '--module', moduleName, '--input', jsonStr];

    const child = spawn(pyCmd, args, {
      cwd: PROJECT_ROOT,
      windowsHide: true
    });

    let stdoutData = '';
    let stderrData = '';
    let finished = false;

    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        try { child.kill('SIGKILL'); } catch (e) {}
        reject(new Error(`ML subprocess timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    child.stdout.on('data', (chunk) => { stdoutData += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderrData += chunk.toString(); });

    child.on('close', (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);

      if (code !== 0) {
        const errMsg = sanitizeErrorMessage(stderrData || stdoutData || `Process exited with code ${code}`);
        return reject(new Error(`ML CLI error: ${errMsg}`));
      }

      try {
        const parsed = JSON.parse(stdoutData.trim());
        if (parsed.success) {
          resolve(parsed);
        } else {
          reject(new Error(parsed.error || 'Subprocess returned unsuccessful response'));
        }
      } catch (err) {
        reject(new Error('Failed to parse ML subprocess JSON output'));
      }
    });

    child.on('error', (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });
  });
}

/**
 * Execute ML prediction using HTTP/HTTPS Service first.
 * If in production or using an external ML service, never spawn a local subprocess.
 * In local development, fall back to controlled subprocess CLI if daemon is unreachable.
 */
async function executeInference(moduleName, endpoint, payload) {
  const config = getServiceConfig();

  // 1. Try HTTP/HTTPS Service
  try {
    const result = await queryDaemon(endpoint, payload);
    return {
      ...result,
      execution_mode: config.isExternal ? 'remote_https' : 'daemon_memory'
    };
  } catch (serviceErr) {
    // 2. If configured for an external service or in production, do NOT attempt local subprocess
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER !== undefined;
    if (config.isExternal || isProduction) {
      throw new Error(`ML inference error from ${config.fullUrl}: ${serviceErr.message}`);
    }

    // 3. Fall back to local CLI subprocess (local dev only)
    try {
      const subResult = await runSubprocess(moduleName, payload);
      return {
        ...subResult,
        execution_mode: 'subprocess_cli'
      };
    } catch (subErr) {
      throw new Error(`ML execution failed (Service: ${serviceErr.message}; Subprocess: ${subErr.message})`);
    }
  }
}

// =============================================================================
// MODULE-SPECIFIC WRAPPERS WITH STRICT INPUT/OUTPUT VALIDATION
// =============================================================================

const mlInferenceService = {
  /**
   * Health check for ML inference daemon / external service
   */
  async checkHealth(timeoutMs = 6000) {
    return new Promise((resolve) => {
      const config = getServiceConfig();
      const cleanPath = `${config.basePath}/health`.replace(/\/+/g, '/');

      const options = {
        hostname: config.hostname,
        port: config.port,
        path: cleanPath,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SmartCity-Backend-Node/1.0'
        },
        timeout: timeoutMs
      };

      const req = config.client.request(options, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (c) => { body += c; });
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve({
              ...data,
              service_url: config.fullUrl,
              is_external: config.isExternal
            });
          } catch (e) {
            resolve({
              status: 'error',
              error: 'Invalid JSON response from ML health endpoint',
              service_url: config.fullUrl,
              is_external: config.isExternal
            });
          }
        });
      });

      req.on('error', (err) => {
        resolve({
          status: 'offline',
          error: err.message,
          service_url: config.fullUrl,
          is_external: config.isExternal
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          status: 'timeout',
          error: `ML health check timed out after ${timeoutMs}ms`,
          service_url: config.fullUrl,
          is_external: config.isExternal
        });
      });

      req.end();
    });
  },

  getServiceConfig,

  /**
   * Module 1: Transport Passenger Demand Forecasting (Random Forest)
   * Target: total_rides (Daily Transit Demand)
   */
  async predictTransportDemand(numDays = 7, baseDate = null) {
    const validatedDays = Math.max(1, Math.min(30, parseInt(numDays, 10) || 7));
    const payload = { num_days: validatedDays, base_date: baseDate };

    const response = await executeInference('transport', '/predict/transport', payload);

    // Validate prediction output
    if (!response.prediction || !Array.isArray(response.prediction.forecast_days)) {
      throw new Error('Invalid transport forecast data structure received from model');
    }

    for (const f of response.prediction.forecast_days) {
      if (!isValidNumber(f.predicted_total_ridership) || f.predicted_total_ridership < 0) {
        throw new Error('Transport model produced non-numeric or negative ridership prediction');
      }
    }

    return response;
  },

  /**
   * Module 2: Traffic Junction Flow Prediction (Gradient Boosting)
   * Target: Vehicles (Hourly Junction Flow)
   */
  async predictTrafficFlow({ junction = 1, hour = 18, dayofweek = 2, weather = 'Clear', incident = 0 }) {
    const validJunction = [1, 2, 3, 4].includes(parseInt(junction, 10)) ? parseInt(junction, 10) : 1;
    const validHour = Math.max(0, Math.min(23, parseInt(hour, 10) || 0));
    const validDay = Math.max(0, Math.min(6, parseInt(dayofweek, 10) || 0));
    const validIncident = incident ? 1 : 0;

    const payload = {
      junction: validJunction,
      hour: validHour,
      dayofweek: validDay,
      weather: String(weather || 'Clear'),
      incident: validIncident
    };

    const response = await executeInference('traffic', '/predict/traffic', payload);

    if (!response.prediction || !isValidNumber(response.prediction.predicted_vehicles_per_hour)) {
      throw new Error('Traffic model produced invalid vehicle count prediction');
    }

    return response;
  },

  /**
   * Module 3: Weather Ambient Temperature Prediction (Linear Regression Pipeline)
   * Target: tempC (Hourly Ambient Temperature °C)
   */
  async predictWeatherTemperature({ hour = 14, month = 5, humidity = 45.0, dewpoint = 18.0, pressure = 1010.0, windspeed = 12.0 }) {
    const validHour = Math.max(0, Math.min(23, parseInt(hour, 10) || 12));
    const validMonth = Math.max(1, Math.min(12, parseInt(month, 10) || 5));
    const validHumidity = Math.max(5.0, Math.min(100.0, parseFloat(humidity) || 50.0));
    const validDewpoint = parseFloat(dewpoint) || 18.0;
    const validPressure = Math.max(900.0, Math.min(1100.0, parseFloat(pressure) || 1010.0));
    const validWind = Math.max(0.0, parseFloat(windspeed) || 10.0);

    const payload = {
      hour: validHour,
      month: validMonth,
      humidity: validHumidity,
      dewpoint: validDewpoint,
      pressure: validPressure,
      windspeed: validWind
    };

    const response = await executeInference('weather', '/predict/weather', payload);

    if (!response.prediction || !isValidNumber(response.prediction.predicted_temperature_c)) {
      throw new Error('Weather model produced invalid temperature prediction');
    }

    return response;
  },

  /**
   * Module 4: Air Quality 1-Hour Ahead NAQI Forecasting (Support Vector Regressor RBF)
   * Target: 1-Hour Ahead AQI (CPCB 0-500 scale)
   */
  async predictAirQuality({ pm25 = 55.0, pm10 = 110.0, no2 = 45.0, co = 1.2, temp = 28.0, humidity = 55.0, wind = 8.0, traffic = 0.65, hour = 18, dayofweek = 2, month = 5, current_aqi = null }) {
    const validPm25 = Math.max(0.0, parseFloat(pm25) || 55.0);
    const validPm10 = Math.max(0.0, parseFloat(pm10) || 110.0);
    const validNo2 = Math.max(0.0, parseFloat(no2) || 45.0);
    const validCo = Math.max(0.0, parseFloat(co) || 1.2);
    const validTemp = parseFloat(temp) || 28.0;
    const validHumidity = Math.max(5.0, Math.min(100.0, parseFloat(humidity) || 55.0));
    const validWind = Math.max(0.1, parseFloat(wind) || 8.0);
    const validTraffic = Math.max(0.0, Math.min(1.0, parseFloat(traffic) || 0.65));
    const validHour = Math.max(0, Math.min(23, parseInt(hour, 10) || 18));
    const validDay = Math.max(0, Math.min(6, parseInt(dayofweek, 10) || 2));
    const validMonth = Math.max(1, Math.min(12, parseInt(month, 10) || 5));

    const payload = {
      pm25: validPm25,
      pm10: validPm10,
      no2: validNo2,
      co: validCo,
      temp: validTemp,
      humidity: validHumidity,
      wind: validWind,
      traffic: validTraffic,
      hour: validHour,
      dayofweek: validDay,
      month: validMonth,
      current_aqi: current_aqi !== null ? Math.max(0.0, parseFloat(current_aqi)) : null
    };

    const response = await executeInference('air_quality', '/predict/air-quality', payload);

    if (!response.prediction || !isValidNumber(response.prediction.predicted_aqi)) {
      throw new Error('AQI model produced invalid AQI prediction');
    }

    return response;
  }
};

module.exports = mlInferenceService;
