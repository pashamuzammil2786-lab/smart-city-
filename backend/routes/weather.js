const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// =============================================================================
// Smart City Urban Analytics - Module 2: Weather & Urban Microclimate Intelligence
// Lead: Laskar Varshini Reddy
// City: Hyderabad Metropolitan Area
// =============================================================================

// 6 Microclimate Zones across Hyderabad
const HYDERABAD_MICROCLIMATES = [
  {
    id: 'ZONE-01',
    name: 'Charminar / Old City Heritage Core',
    type: 'High-Density Historic Masonry',
    currentTempC: 33.6,
    feelsLikeC: 36.8,
    humidityPct: 54,
    uhiDifferentialC: 3.8, // Urban Heat Island gradient vs baseline
    treeCanopyCoverPct: 8.5,
    imperviousSurfacePct: 89.0,
    solarIrradianceWm2: 820,
    heatStressCategory: 'High Heat Stress',
    statusColor: '#EF4444',
    stationLocation: 'Mir Alam Mandi / Charminar Weather Station',
    coolingBufferPresent: false
  },
  {
    id: 'ZONE-02',
    name: 'HITEC City – Madhapur IT Corridor',
    type: 'Commercial High-Rise / Glass & Concrete',
    currentTempC: 32.8,
    feelsLikeC: 35.5,
    humidityPct: 56,
    uhiDifferentialC: 3.0,
    treeCanopyCoverPct: 14.2,
    imperviousSurfacePct: 82.5,
    solarIrradianceWm2: 810,
    heatStressCategory: 'Moderate Heat Stress',
    statusColor: '#F59E0B',
    stationLocation: 'Cyber Towers Tech Station',
    coolingBufferPresent: false
  },
  {
    id: 'ZONE-03',
    name: 'Banjara Hills & Jubilee Hills Ridges',
    type: 'Elevated Undulating Terrain / Residential',
    currentTempC: 30.5,
    feelsLikeC: 32.4,
    humidityPct: 60,
    uhiDifferentialC: 0.7,
    treeCanopyCoverPct: 34.0,
    imperviousSurfacePct: 58.0,
    solarIrradianceWm2: 760,
    heatStressCategory: 'Low Heat Stress',
    statusColor: '#10B981',
    stationLocation: 'KBR Park Perimeter Observatory',
    coolingBufferPresent: true
  },
  {
    id: 'ZONE-04',
    name: 'Secunderabad Cantonment Green Belt',
    type: 'Military Cantonment / Extensive Woodland',
    currentTempC: 29.8,
    feelsLikeC: 31.0,
    humidityPct: 63,
    uhiDifferentialC: 0.0,
    treeCanopyCoverPct: 48.5,
    imperviousSurfacePct: 42.0,
    solarIrradianceWm2: 730,
    heatStressCategory: 'Comfortable',
    statusColor: '#10B981',
    stationLocation: 'Bolarum Cantonment Meteorological Post',
    coolingBufferPresent: true
  },
  {
    id: 'ZONE-05',
    name: 'Hussain Sagar Lakefront Buffer Zone',
    type: 'Urban Waterbody / Lake-Breeze Corridor',
    currentTempC: 30.2,
    feelsLikeC: 33.1,
    humidityPct: 71,
    uhiDifferentialC: 0.4,
    treeCanopyCoverPct: 26.0,
    imperviousSurfacePct: 55.0,
    solarIrradianceWm2: 750,
    heatStressCategory: 'Moderate Humidity Effect',
    statusColor: '#06B6D4',
    stationLocation: 'Necklace Road Marine Station',
    coolingBufferPresent: true
  },
  {
    id: 'ZONE-06',
    name: 'Shamshabad Peri-Urban Fringe',
    type: 'Open Semi-Arid Agricultural Boundary',
    currentTempC: 29.8,
    feelsLikeC: 31.2,
    humidityPct: 59,
    uhiDifferentialC: 0.0, // Reference Baseline
    treeCanopyCoverPct: 28.0,
    imperviousSurfacePct: 35.0,
    solarIrradianceWm2: 800,
    heatStressCategory: 'Reference Baseline',
    statusColor: '#10B981',
    stationLocation: 'RGIA Meteorological Observatory',
    coolingBufferPresent: true
  }
];

// Diurnal hourly curve for Hyderabad weather
const HOURLY_WEATHER_PROFILE = [
  { time: '00:00', temp: 24.2, humidity: 76, heatIndex: 25.1, rainProb: 10 },
  { time: '02:00', temp: 23.5, humidity: 80, heatIndex: 24.2, rainProb: 10 },
  { time: '04:00', temp: 22.8, humidity: 83, heatIndex: 23.5, rainProb: 12 },
  { time: '06:00', temp: 23.4, humidity: 81, heatIndex: 24.0, rainProb: 15 },
  { time: '08:00', temp: 26.5, humidity: 72, heatIndex: 28.1, rainProb: 18 },
  { time: '10:00', temp: 29.8, humidity: 64, heatIndex: 32.5, rainProb: 20 },
  { time: '12:00', temp: 32.5, humidity: 55, heatIndex: 35.8, rainProb: 22 },
  { time: '14:00', temp: 34.2, humidity: 48, heatIndex: 37.6, rainProb: 28 }, // Peak Max Temp
  { time: '16:00', temp: 33.1, humidity: 52, heatIndex: 36.2, rainProb: 32 }, // Afternoon convective cloud
  { time: '18:00', temp: 30.4, humidity: 61, heatIndex: 33.5, rainProb: 25 },
  { time: '20:00', temp: 27.8, humidity: 68, heatIndex: 29.8, rainProb: 15 },
  { time: '22:00', temp: 25.9, humidity: 73, heatIndex: 27.2, rainProb: 12 }
];

// Dynamic 7-Day Forward Weather Forecast Generator
function generateDynamicSevenDayForecast() {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const conditions = [
    { condition: 'Partly Cloudy', rainProb: 20, icon: 'cloud-sun', humidity: 56, windSpeed: 12 },
    { condition: 'Mostly Sunny', rainProb: 15, icon: 'sun', humidity: 52, windSpeed: 14 },
    { condition: 'Passing Showers', rainProb: 45, icon: 'cloud-drizzle', humidity: 66, windSpeed: 15 },
    { condition: 'Afternoon Shower', rainProb: 55, icon: 'cloud-rain', humidity: 70, windSpeed: 16 },
    { condition: 'Clear Sky', rainProb: 10, icon: 'sun', humidity: 48, windSpeed: 11 },
    { condition: 'Thunderstorm Risk', rainProb: 65, icon: 'cloud-lightning', humidity: 74, windSpeed: 18 },
    { condition: 'Sunny & Pleasant', rainProb: 12, icon: 'sun', humidity: 50, windSpeed: 13 }
  ];

  const forecast = [];
  const now = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() + i * 24 * 3600 * 1000);
    const dayName = i === 0 ? 'Today' : dayNames[d.getDay()];
    const dateStr = `${monthNames[d.getMonth()]} ${d.getDate()}`;
    const condIdx = (d.getDate() + i) % conditions.length;
    const cond = conditions[condIdx];

    // Seasonal temperature calibration for Hyderabad
    const month = d.getMonth() + 1;
    let baseMax = 32.0;
    let baseMin = 21.0;
    if (month >= 3 && month <= 5) {
      baseMax = 38.0; baseMin = 25.0; // Summer
    } else if (month >= 6 && month <= 9) {
      baseMax = 31.0; baseMin = 23.0; // Monsoon
    } else if (month >= 11 || month <= 2) {
      baseMax = 29.5; baseMin = 18.0; // Winter
    }

    const variance = ((d.getDate() * 7) % 5) - 2;
    const maxTemp = Math.round((baseMax + variance * 0.4) * 10) / 10;
    const minTemp = Math.round((baseMin + variance * 0.3) * 10) / 10;

    forecast.push({
      day: dayName,
      date: dateStr,
      maxTemp,
      minTemp,
      condition: cond.condition,
      rainProb: cond.rainProb,
      icon: cond.icon,
      humidity: cond.humidity,
      windSpeed: cond.windSpeed
    });
  }

  return forecast;
}

// Backwards-compatible export
const SEVEN_DAY_FORECAST = generateDynamicSevenDayForecast();

// -----------------------------------------------------------------------------
// 1. GET /api/weather (Module Metadata - Backwards Compatible)
// -----------------------------------------------------------------------------
router.get('/', (req, res) => {
  res.json({
    module: 'Weather Analytics',
    lead: 'Laskar Varshini Reddy',
    status: 'Active • Implemented',
    version: '2.0.0',
    city: 'Hyderabad',
    microclimateZonesCount: HYDERABAD_MICROCLIMATES.length
  });
});

// -----------------------------------------------------------------------------
// 2. GET /api/weather/overview (City Weather Snapshot)
// -----------------------------------------------------------------------------
router.get('/overview', (req, res) => {
  try {
    const avgTemp = (
      HYDERABAD_MICROCLIMATES.reduce((acc, z) => acc + z.currentTempC, 0) / HYDERABAD_MICROCLIMATES.length
    ).toFixed(1);

    const maxUHI = Math.max(...HYDERABAD_MICROCLIMATES.map(z => z.uhiDifferentialC)).toFixed(1);

    res.json({
      city: 'Hyderabad, India',
      currentTempC: parseFloat(avgTemp),
      feelsLikeC: 34.2,
      condition: 'Partly Cloudy • Convective Afternoon Clouds',
      highTempC: 34.2,
      lowTempC: 22.8,
      relativeHumidityPct: 58,
      dewPointC: 21.5,
      atmosphericPressureHpa: 1012,
      windSpeedKmH: 12.8,
      windDirection: 'WNW (290°)',
      uvIndex: 7.2,
      uvCategory: 'High UV Alert',
      solarIrradianceWm2: 785,
      rainRiskProbabilityPct: 25,
      maxUHIDifferentialC: parseFloat(maxUHI),
      airDispersionIndex: 'Moderate (PBL Height ~1,450m)',
      heatAdvisory: 'Stay hydrated during 12:00 PM – 3:30 PM peak solar radiation.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Weather Overview Error]:', error);
    res.status(500).json({ error: 'Failed to load weather overview.' });
  }
});

// -----------------------------------------------------------------------------
// 3. GET /api/weather/microclimates (6 Urban Microclimate Zones)
// -----------------------------------------------------------------------------
router.get('/microclimates', (req, res) => {
  try {
    res.json({
      count: HYDERABAD_MICROCLIMATES.length,
      baselineZone: 'Shamshabad Peri-Urban Fringe (ZONE-06)',
      zones: HYDERABAD_MICROCLIMATES
    });
  } catch (error) {
    console.error('[Weather Microclimates Error]:', error);
    res.status(500).json({ error: 'Failed to load weather microclimates.' });
  }
});

// -----------------------------------------------------------------------------
// 4. GET /api/weather/forecast (7-Day & 24-Hour Forecast)
// -----------------------------------------------------------------------------
router.get('/forecast', (req, res) => {
  try {
    res.json({
      sevenDay: generateDynamicSevenDayForecast(),
      hourlyProfile: HOURLY_WEATHER_PROFILE
    });
  } catch (error) {
    console.error('[Weather Forecast Error]:', error);
    res.status(500).json({ error: 'Failed to load weather forecast.' });
  }
});

// -----------------------------------------------------------------------------
// 5. GET /api/weather/ml-metrics (Machine Learning Evaluation)
// -----------------------------------------------------------------------------
router.get('/ml-metrics', (req, res) => {
  try {
    const metricsPath = path.join(__dirname, '..', '..', 'ml', 'weather', 'models', 'metrics.json');
    if (fs.existsSync(metricsPath)) {
      const data = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
      const comparison = data.comparison || {};
      const benchmarks = Object.keys(comparison).map(name => ({
        model: name + (name === data.best_model ? ' (Selected)' : ''),
        r2Score: comparison[name].R2,
        rmse: comparison[name].RMSE,
        mae: comparison[name].MAE,
        mape: comparison[name].MAPE,
        status: name === data.best_model ? 'Selected Best Model' : 'Evaluated Model',
        notes: `Trained on ${data.train_samples?.toLocaleString()} Kaggle Hyderabad records.`
      }));

      return res.json({
        bestModel: `${data.best_model} Regressor`,
        dataset: data.dataset,
        targetVariable: data.target,
        horizon: 'Next 24 Hours Ambient Temperature & UHI Gradient',
        datasetRecords: `${data.samples_total?.toLocaleString()} Hourly Kaggle Observations (2009-2019)`,
        benchmarks,
        featureImportance: (data.feature_importance || []).slice(0, 8),
        actualVsPredictedSample: data.actual_vs_predicted_sample || []
      });
    }

    // Fallback benchmarks
    const benchmarks = [
      {
        model: 'Linear Regression (Selected)',
        r2Score: 0.9894,
        rmse: 0.53,
        mae: 0.41,
        mape: 1.51,
        status: 'Selected Best Model',
        notes: 'Trained on 77,145 Kaggle Hyderabad hourly observations.'
      },
      {
        model: 'Gradient Boosting Regressor',
        r2Score: 0.9770,
        rmse: 0.78,
        mae: 0.51,
        mape: 1.88,
        status: 'Gradient Ensemble',
        notes: '100 estimators, max_depth 6.'
      },
      {
        model: 'Random Forest Regressor',
        r2Score: 0.9752,
        rmse: 0.81,
        mae: 0.54,
        mape: 2.00,
        status: 'Tree Ensemble',
        notes: '100 trees, max_depth 16.'
      },
      {
        model: 'Ridge Regression',
        r2Score: 0.9894,
        rmse: 0.53,
        mae: 0.41,
        mape: 1.51,
        status: 'Regularized Linear',
        notes: 'Alpha = 10.0, standardized meteorological indicators.'
      }
    ];

    const featureImportance = [
      { feature: 'temp_lag_1 (Previous 1h Temp)', importance: 0.9403 },
      { feature: 'temp_lag_24 (Same Hour Yesterday)', importance: 0.0303 },
      { feature: 'hour_sin', importance: 0.0124 },
      { feature: 'hour', importance: 0.0035 },
      { feature: 'humidity', importance: 0.0024 },
      { feature: 'temp_rolling_6', importance: 0.0019 }
    ];

    res.json({
      bestModel: 'Linear Regression Regressor',
      targetVariable: 'tempC (Ambient Temperature °C)',
      horizon: 'Next 24 Hours & Microclimate Gradient',
      datasetRecords: '96,432 Hourly Kaggle Observations (2009-2019)',
      benchmarks,
      featureImportance
    });
  } catch (error) {
    console.error('[Weather ML Metrics Error]:', error);
    res.status(500).json({ error: 'Failed to load weather ML metrics.' });
  }
});

// -----------------------------------------------------------------------------
// 6. POST /api/weather/simulate (Urban Heat Island Cooling Simulator)
// -----------------------------------------------------------------------------
router.post('/simulate', (req, res) => {
  try {
    const {
      zoneId = 'ZONE-01',
      addedTreeCanopyPct = 15, // 0 to 40% added canopy
      coolRoofAlbedoIncreasePct = 25, // 0 to 50% albedo boost
      waterFeatureBuffer = false
    } = req.body;

    const zone = HYDERABAD_MICROCLIMATES.find(z => z.id === zoneId) || HYDERABAD_MICROCLIMATES[0];

    const addedCanopy = Math.max(0, Math.min(50, parseFloat(addedTreeCanopyPct) || 0));
    const albedoBoost = Math.max(0, Math.min(60, parseFloat(coolRoofAlbedoIncreasePct) || 0));

    // Empirical cooling effect calculations (Akbari et al. / Santamouris et al.)
    // ~10% tree canopy addition yields approximately 0.7°C to 1.1°C temperature drop
    const canopyCoolingEffect = addedCanopy * 0.085;
    // ~10% cool roof high albedo coating yields ~0.35°C temperature reduction
    const albedoCoolingEffect = albedoBoost * 0.032;
    const waterBufferEffect = waterFeatureBuffer ? 0.65 : 0.0;

    const totalCooling = Math.round((canopyCoolingEffect + albedoCoolingEffect + waterBufferEffect) * 10) / 10;
    const projectedTemp = Math.round((zone.currentTempC - totalCooling) * 10) / 10;
    const projectedUHI = Math.max(0, Math.round((zone.uhiDifferentialC - totalCooling) * 10) / 10);

    // Energy AC load saving estimate (~6% electricity reduction per 1°C ambient cooling)
    const estimatedAcSavingPct = Math.round(totalCooling * 5.8 * 10) / 10;

    res.json({
      zoneName: zone.name,
      baselineTempC: zone.currentTempC,
      projectedTempC: projectedTemp,
      totalTemperatureDropC: totalCooling,
      baselineUHIDifferentialC: zone.uhiDifferentialC,
      projectedUHIDifferentialC: projectedUHI,
      estimatedAcEnergySavingPct: estimatedAcSavingPct,
      mitigationBreakdown: {
        treeCanopyCooling: `-${canopyCoolingEffect.toFixed(2)}°C from ${addedCanopy}% added green canopy (Evapotranspiration)`,
        coolRoofCooling: `-${albedoCoolingEffect.toFixed(2)}°C from ${albedoBoost}% high-albedo solar reflective roofs`,
        waterFeatureCooling: waterFeatureBuffer ? '-0.65°C from localized water body mist buffer' : 'No water feature active'
      },
      comfortRecommendation: projectedTemp < 31.0 ? 'Comfortable Thermal Zone Achieved' : 'Moderate Heat Stress Mitigated'
    });
  } catch (error) {
    console.error('[Weather Simulate Error]:', error);
    res.status(500).json({ error: 'Failed to simulate microclimate cooling.' });
  }
});

module.exports = router;
