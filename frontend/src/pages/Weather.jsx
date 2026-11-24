import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  Sun,
  CloudRain,
  CloudLightning,
  CloudDrizzle,
  Droplets,
  Wind,
  Thermometer,
  ShieldAlert,
  TreePine,
  TrendingUp,
  Sliders,
  RefreshCw,
  Compass,
  AlertTriangle,
  Zap,
  Info,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';

export default function Weather() {
  const [overview, setOverview] = useState(null);
  const [microclimates, setMicroclimates] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);

  // Microclimate Simulator State
  const [simZoneId, setSimZoneId] = useState('ZONE-01');
  const [simCanopy, setSimCanopy] = useState(15);
  const [simAlbedo, setSimAlbedo] = useState(25);
  const [simWater, setSimWater] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // Live Machine Learning Temperature Predictor State
  const [mlHour, setMlHour] = useState(14);
  const [mlMonth, setMlMonth] = useState(5);
  const [mlHumidity, setMlHumidity] = useState(45);
  const [mlDewpoint, setMlDewpoint] = useState(18);
  const [mlWindspeed, setMlWindspeed] = useState(12);
  const [mlResult, setMlResult] = useState(null);
  const [mlPredicting, setMlPredicting] = useState(false);
  const [mlError, setMlError] = useState('');

  useEffect(() => {
    loadAllWeatherData();
  }, []);

  async function loadAllWeatherData() {
    setLoading(true);
    try {
      const [overviewData, microData, forecastData] = await Promise.all([
        api.getWeatherOverview(),
        api.getWeatherMicroclimates(),
        api.getWeatherForecast()
      ]);
      setOverview(overviewData);
      setMicroclimates(microData.zones || []);
      setForecast(forecastData);
      if (microData.zones && microData.zones.length > 0) {
        setSelectedZone(microData.zones[0]);
      }
    } catch (err) {
      console.error('Failed to load weather data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulateCooling(e) {
    if (e) e.preventDefault();
    setSimulating(true);
    try {
      const res = await api.simulateWeather({
        zoneId: simZoneId,
        addedTreeCanopyPct: parseFloat(simCanopy),
        coolRoofAlbedoIncreasePct: parseFloat(simAlbedo),
        waterFeatureBuffer: simWater
      });
      setSimResult(res);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setSimulating(false);
    }
  }

  async function handlePredictTemperature(e) {
    if (e) e.preventDefault();
    setMlPredicting(true);
    setMlError('');
    try {
      const res = await api.predictWeatherTemperature({
        hour: parseInt(mlHour, 10),
        month: parseInt(mlMonth, 10),
        humidity: parseFloat(mlHumidity),
        dewpoint: parseFloat(mlDewpoint),
        windspeed: parseFloat(mlWindspeed)
      });
      setMlResult(res);
    } catch (err) {
      setMlError('Failed to predict temperature: ' + err.message);
    } finally {
      setMlPredicting(false);
    }
  }

  const getWeatherIcon = (iconName) => {
    switch (iconName) {
      case 'sun':
        return <Sun size={24} color="#FBBF24" />;
      case 'cloud-rain':
        return <CloudRain size={24} color="#38BDF8" />;
      case 'cloud-lightning':
        return <CloudLightning size={24} color="#F59E0B" />;
      case 'cloud-drizzle':
        return <CloudDrizzle size={24} color="#60A5FA" />;
      default:
        return <CloudSun size={24} color="#C4B5FD" />;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#A855F7' }}>
        <RefreshCw size={36} className="spin" style={{ margin: '0 auto 1rem' }} />
        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading Hyderabad Meteorological & Microclimate Sensor Data...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #1E293B', paddingBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#1E293B', border: '1px solid #334155', padding: '0.2rem 0.55rem', borderRadius: '4px', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
            <CloudSun size={13} color="#A855F7" />
            <span>HYDERABAD METEOROLOGICAL & CLIMATE PLATFORM</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.02em', margin: 0 }}>
            Urban Microclimate & Weather Intelligence
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '0.35rem', maxWidth: '680px', lineHeight: 1.5 }}>
            Urban Heat Island (UHI) thermal mapping, 7-day meteorological forecasting, and environmental regression modeling.
          </p>
        </div>

        <button
          onClick={loadAllWeatherData}
          className="btn"
          style={{ background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
        >
          <RefreshCw size={14} />
          <span>Refresh Weather</span>
        </button>
      </div>

      {/* 2. Hero Current Status & Climate Metrics */}
      {overview && (
        <div style={{ background: '#111C35', border: '1px solid #1E293B', borderRadius: '8px', padding: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'center' }}>
            {/* Left: Clean Temperature Display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  minWidth: '105px',
                  padding: '1rem',
                  borderRadius: '6px',
                  background: '#0B132B',
                  border: '1px solid #334155',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: '2.4rem', fontWeight: 700, color: '#F8FAFC', lineHeight: 1 }}>
                  {overview.currentTempC}°
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', marginTop: '6px', letterSpacing: '0.04em' }}>
                  Celsius
                </span>
              </div>

              <div>
                <div style={{ display: 'inline-block', background: '#1E293B', border: '1px solid #334155', color: '#CBD5E1', fontWeight: 600, fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', marginBottom: '0.4rem' }}>
                  Feels Like {overview.feelsLikeC}°C
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.25rem 0' }}>
                  {overview.condition}
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: 0 }}>
                  High: <strong style={{ color: '#FCD34D' }}>{overview.highTempC}°C</strong> • Low: <strong style={{ color: '#38BDF8' }}>{overview.lowTempC}°C</strong> • Max UHI: <strong style={{ color: '#EF4444' }}>+{overview.maxUHIDifferentialC}°C</strong>
                </p>
                {overview.ml_temperature && (
                  <div style={{ marginTop: '0.45rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#0B132B', border: '1px solid #334155', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem' }}>
                    <span style={{ color: '#94A3B8', fontWeight: 600 }}>ML Prediction:</span>
                    <strong style={{ color: '#F8FAFC' }}>{overview.ml_temperature.predicted_temperature_c}°C</strong>
                    <span style={{ color: '#94A3B8' }}>({overview.ml_temperature.thermal_comfort_level})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Key Meteorological Parameters */}
            <div style={{ background: '#0B132B', border: '1px solid #1E293B', borderRadius: '10px', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38BDF8', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  <Droplets size={14} />
                  <span>Humidity</span>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF' }}>{overview.relativeHumidityPct}%</div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10B981', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  <Wind size={14} />
                  <span>Wind Speed</span>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF' }}>{overview.windSpeedKmH} <span style={{ fontSize: '0.72rem' }}>km/h</span></div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#F59E0B', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  <Sun size={14} />
                  <span>UV Index</span>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF' }}>{overview.uvIndex} <span style={{ fontSize: '0.72rem', color: '#F59E0B' }}>High</span></div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#60A5FA', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  <CloudRain size={14} />
                  <span>Rain Risk</span>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF' }}>{overview.rainRiskProbabilityPct}%</div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#CBD5E1', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  <Compass size={14} />
                  <span>Pressure</span>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF' }}>{overview.atmosphericPressureHpa} <span style={{ fontSize: '0.72rem' }}>hPa</span></div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#C084FC', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  <Thermometer size={14} />
                  <span>Dew Point</span>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF' }}>{overview.dewPointC}°C</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Urban Heat Island (UHI) Microclimate Zones Matrix */}
      <div style={{ background: '#111C35', border: '1px solid #1E293B', borderRadius: '8px', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
              Hyderabad Urban Heat Island (UHI) Microclimate Spatial Zones
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>
              Comparing localized thermal retention against the rural Shamshabad peri-urban baseline (0.0°C).
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Click zone card to inspect
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {microclimates.map((z) => {
            const isSelected = selectedZone && selectedZone.id === z.id;
            return (
              <div
                key={z.id}
                onClick={() => setSelectedZone(z)}
                style={{
                  background: isSelected ? 'rgba(59, 130, 246, 0.08)' : '#0F172A',
                  border: `1px solid ${isSelected ? '#3B82F6' : '#1E293B'}`,
                  borderRadius: '6px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>{z.id}</span>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1F5F9', margin: '0.2rem 0 0' }}>
                      {z.name}
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, background: z.statusColor, color: '#FFF', padding: '2px 8px', borderRadius: '3px' }}>
                    {z.heatStressCategory}
                  </span>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginBottom: '0.65rem' }}>
                  {z.type}
                </div>

                {/* Temperature & UHI */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', background: '#111C35', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid #1E293B' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Local Temp:</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFF' }}>{z.currentTempC}°C</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>UHI Differential:</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: z.uhiDifferentialC > 2.0 ? '#EF4444' : '#10B981' }}>
                      +{z.uhiDifferentialC}°C
                    </div>
                  </div>
                </div>

                {/* Canopy vs Impervious surface bars */}
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tree Canopy Cover:</span>
                    <strong style={{ color: '#34D399' }}>{z.treeCanopyCoverPct}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Impervious Surface:</span>
                    <strong style={{ color: '#F87171' }}>{z.imperviousSurfacePct}%</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. 24-Hour Diurnal Temperature & Humidity Trend Chart */}
      {forecast && forecast.hourlyProfile && (
        <div style={{ background: '#111C35', border: '1px solid #1E293B', borderRadius: '8px', padding: '1.25rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <TrendingUp size={16} color="#A855F7" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                Hyderabad 24-Hour Diurnal Temperature & Humidity Cycle
              </h2>
            </div>
            <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: 0 }}>
              Tracking inverse diurnal temperature-humidity dynamics and solar thermal heating.
            </p>
          </div>

          <div style={{ height: '320px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast.hourlyProfile} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} />
                <YAxis yAxisId="left" stroke="#F59E0B" fontSize={11} domain={[20, 40]} unit="°C" />
                <YAxis yAxisId="right" orientation="right" stroke="#38BDF8" fontSize={11} domain={[40, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#091022', borderColor: '#233554', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.82rem' }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="temp"
                  name="Temperature (°C)"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="heatIndex"
                  name="Heat Index Feels Like (°C)"
                  stroke="#EF4444"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="humidity"
                  name="Relative Humidity (%)"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 5. 7-Day Forward Weather Forecast Cards */}
      {forecast && forecast.sevenDay && (
        <div style={{ background: '#111C35', border: '1px solid #1E293B', borderRadius: '8px', padding: '1.25rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
              Hyderabad 7-Day Meteorological Outlook
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>
              Medium-range synoptic weather forecast, convective rain probabilities, and thermal comfort bands.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {forecast.sevenDay.map((d, i) => (
              <div
                key={i}
                style={{
                  background: '#0B132B',
                  border: '1px solid #1E293B',
                  borderRadius: '6px',
                  padding: '0.85rem 0.75rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F1F5F9' }}>{d.day}</span>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{d.date}</span>
                <div style={{ margin: '0.3rem 0' }}>{getWeatherIcon(d.icon)}</div>
                <div style={{ fontSize: '0.78rem', color: '#CBD5E1', fontWeight: 600 }}>{d.condition}</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFF' }}>
                  <span style={{ color: '#FCD34D' }}>{d.maxTemp}°</span> / <span style={{ color: '#38BDF8' }}>{d.minTemp}°</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <Droplets size={12} />
                  <span>{d.rainProb}% Rain</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Interactive Live ML Ambient Temperature Predictor */}
      <div style={{ background: '#111C35', border: '1px solid #1E293B', borderRadius: '8px', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Thermometer size={18} color="#A855F7" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
              Microclimate Temperature Predictor
            </h2>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, background: '#1E293B', color: '#D8B4FE', border: '1px solid #334155', padding: '2px 8px', borderRadius: '4px' }}>
              Linear Regression Pipeline (R² = 0.989)
            </span>
          </div>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Execute real-time model inference using our trained meteorological pipeline to predict dry-bulb ambient temperature and thermal stress index.
        </p>

        <form onSubmit={handlePredictTemperature}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Hour Slider */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.35rem' }}>
                Hour of Day: <strong>{mlHour}:00 hrs</strong>
              </label>
              <input
                type="range"
                min="0"
                max="23"
                value={mlHour}
                onChange={(e) => setMlHour(e.target.value)}
                style={{ width: '100%', marginTop: '0.65rem', accentColor: '#A855F7' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B' }}>
                <span>00:00 (Night)</span>
                <span>14:00 (Peak Heat)</span>
                <span>23:00</span>
              </div>
            </div>

            {/* Month Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.35rem' }}>
                Calendar Month
              </label>
              <select
                value={mlMonth}
                onChange={(e) => setMlMonth(e.target.value)}
                style={{ width: '100%', height: '44px', background: '#0B132B', border: '1px solid #233554', borderRadius: '8px', color: '#FFF', padding: '0 0.75rem', fontSize: '0.88rem', outline: 'none' }}
              >
                <option value="1">January (Winter Base ~22°C)</option>
                <option value="3">March (Pre-Summer ~31°C)</option>
                <option value="5">May (Peak Summer ~37°C)</option>
                <option value="7">July (Monsoon ~28°C)</option>
                <option value="10">October (Post-Monsoon ~27°C)</option>
                <option value="12">December (Winter ~21°C)</option>
              </select>
            </div>

            {/* Relative Humidity Slider */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.35rem' }}>
                Relative Humidity: <strong style={{ color: '#38BDF8' }}>{mlHumidity}%</strong>
              </label>
              <input
                type="range"
                min="10"
                max="95"
                value={mlHumidity}
                onChange={(e) => setMlHumidity(e.target.value)}
                style={{ width: '100%', marginTop: '0.65rem', accentColor: '#38BDF8' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B' }}>
                <span>10% (Dry Arid)</span>
                <span>50% (Standard)</span>
                <span>95% (Monsoon)</span>
              </div>
            </div>

            {/* Wind Speed Slider */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.35rem' }}>
                Wind Speed: <strong style={{ color: '#34D399' }}>{mlWindspeed} km/h</strong>
              </label>
              <input
                type="range"
                min="2"
                max="35"
                value={mlWindspeed}
                onChange={(e) => setMlWindspeed(e.target.value)}
                style={{ width: '100%', marginTop: '0.65rem', accentColor: '#34D399' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B' }}>
                <span>2 km/h (Calm)</span>
                <span>15 km/h (Breeze)</span>
                <span>35 km/h (Gusty)</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button
              type="submit"
              disabled={mlPredicting}
              className="btn btn-primary"
              style={{ background: '#2563EB', border: 'none', padding: '0.65rem 1.25rem', fontWeight: 600, fontSize: '0.88rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              <Zap size={15} />
              <span>{mlPredicting ? 'Executing ML Regression Pipeline...' : 'Predict Ambient Temperature'}</span>
            </button>
          </div>
        </form>

        {mlError && (
          <div style={{ marginTop: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '0.65rem 0.85rem', borderRadius: '4px', color: '#F87171', fontSize: '0.8rem' }}>
            {mlError}
          </div>
        )}

        {mlResult && mlResult.prediction && (
          <div style={{ marginTop: '1.25rem', background: '#0B132B', border: '1px solid #1E293B', borderRadius: '6px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>ML Inference Result</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', margin: '0.2rem 0 0' }}>
                  Predicted Ambient Temperature: {mlResult.prediction.predicted_temperature_c}°C
                </h3>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0', padding: '3px 10px', borderRadius: '4px' }}>
                {mlResult.prediction.thermal_comfort_level}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
              <div style={{ background: '#111C35', padding: '0.75rem', borderRadius: '6px', border: '1px solid #1E293B' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Predicted Dry-Bulb Temp:</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#FCD34D' }}>
                  {mlResult.prediction.predicted_temperature_c}°C
                </div>
                <span style={{ fontSize: '0.68rem', color: '#64748B' }}>Target: tempC</span>
              </div>

              <div style={{ background: '#111C35', padding: '0.75rem', borderRadius: '6px', border: '1px solid #1E293B' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Apparent Temperature:</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#F87171' }}>
                  {mlResult.prediction.feels_like_c}°C
                </div>
                <span style={{ fontSize: '0.68rem', color: '#64748B' }}>Humidity + Wind effect</span>
              </div>

              <div style={{ background: '#111C35', padding: '0.75rem', borderRadius: '6px', border: '1px solid #1E293B' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Thermal Comfort:</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38BDF8' }}>
                  {mlResult.prediction.thermal_comfort_level}
                </div>
                <span style={{ fontSize: '0.68rem', color: '#64748B' }}>Public health heat index</span>
              </div>

              <div style={{ background: '#111C35', padding: '0.75rem', borderRadius: '6px', border: '1px solid #1E293B' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>UHI Differential Capacity:</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#10B981' }}>
                  {mlResult.prediction.uhi_maximum_potential_delta}
                </div>
                <span style={{ fontSize: '0.68rem', color: '#64748B' }}>Dense core gradient</span>
              </div>
            </div>

            <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #1E293B', fontSize: '0.72rem', color: '#64748B' }}>
              <strong>Model Evaluation:</strong> Trained on 96,432 hourly observations for Hyderabad (R² = 0.989, MAE = 0.41°C). Synoptic weather systems and rain forecasts are provided by the meteorological model above.
            </div>
          </div>
        )}
      </div>

      {/* 7. Interactive Urban Heat Island Cooling Simulator */}
      <div style={{ background: '#111C35', border: '1px solid #1E293B', borderRadius: '8px', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <TreePine size={18} color="#10B981" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
            Urban Heat Island (UHI) Cooling & Policy Simulator
          </h2>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Simulate how municipal green canopy planting and high-albedo reflective roofs cool down dense concrete microclimate zones.
        </p>

        <form onSubmit={handleSimulateCooling}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            {/* Zone Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.35rem' }}>
                Select Targeted Microclimate Zone
              </label>
              <select
                value={simZoneId}
                onChange={(e) => setSimZoneId(e.target.value)}
                style={{ width: '100%', height: '44px', background: '#0B132B', border: '1px solid #233554', borderRadius: '8px', color: '#FFF', padding: '0 0.75rem', fontSize: '0.88rem', outline: 'none' }}
              >
                {microclimates.map(z => (
                  <option key={z.id} value={z.id}>{z.name} (+{z.uhiDifferentialC}°C UHI)</option>
                ))}
              </select>
            </div>

            {/* Added Canopy Slider */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.35rem' }}>
                Urban Tree Canopy Addition: <strong style={{ color: '#34D399' }}>+{simCanopy}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="40"
                value={simCanopy}
                onChange={(e) => setSimCanopy(e.target.value)}
                style={{ width: '100%', marginTop: '0.65rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B' }}>
                <span>0% (Existing)</span>
                <span>20% (Urban Greening)</span>
                <span>40% (Forest Belt)</span>
              </div>
            </div>

            {/* Cool Roof Albedo Slider */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.35rem' }}>
                Cool Roof Solar Reflectance: <strong style={{ color: '#38BDF8' }}>+{simAlbedo}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={simAlbedo}
                onChange={(e) => setSimAlbedo(e.target.value)}
                style={{ width: '100%', marginTop: '0.65rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B' }}>
                <span>0% Standard Asphalt</span>
                <span>25% White Coating</span>
                <span>50% High-Albedo SRI</span>
              </div>
            </div>

            {/* Water feature toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.5rem' }}>
                Localized Water / Mist Feature
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', color: '#E2E8F0' }}>
                <input
                  type="checkbox"
                  checked={simWater}
                  onChange={(e) => setSimWater(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>Include Fountains / Mist Cooling Buffer</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button
              type="submit"
              disabled={simulating}
              className="btn btn-primary"
              style={{ background: '#2563EB', border: 'none', padding: '0.65rem 1.25rem', fontWeight: 600, fontSize: '0.88rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              <Zap size={15} />
              <span>{simulating ? 'Simulating Thermal Dynamics...' : 'Run Cooling Simulation'}</span>
            </button>
          </div>
        </form>

        {/* Simulation Output Card */}
        {simResult && (
          <div style={{ marginTop: '1.25rem', background: '#0B132B', border: '1px solid #1E293B', borderRadius: '6px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Climate Intervention Impact</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', margin: '0.2rem 0 0' }}>
                  {simResult.zoneName}
                </h3>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, background: '#1E293B', border: '1px solid #10B981', color: '#34D399', padding: '3px 10px', borderRadius: '4px' }}>
                {simResult.comfortRecommendation}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: '#111C35', padding: '0.85rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Net Temperature Drop:</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34D399' }}>
                  -{simResult.totalTemperatureDropC}°C
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  Baseline: {simResult.baselineTempC}°C → Projected: {simResult.projectedTempC}°C
                </span>
              </div>

              <div style={{ background: '#111C35', padding: '0.85rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Mitigated UHI Differential:</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38BDF8' }}>
                  +{simResult.projectedUHIDifferentialC}°C
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  Reduced from +{simResult.baselineUHIDifferentialC}°C
                </span>
              </div>

              <div style={{ background: '#111C35', padding: '0.85rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Building AC Energy Savings:</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FCD34D' }}>
                  ~{simResult.estimatedAcEnergySavingPct}%
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  Estimated cooling load reduction
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#94A3B8', borderTop: '1px solid #1E293B', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div>• {simResult.mitigationBreakdown.treeCanopyCooling}</div>
              <div>• {simResult.mitigationBreakdown.coolRoofCooling}</div>
              <div>• {simResult.mitigationBreakdown.waterFeatureCooling}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
