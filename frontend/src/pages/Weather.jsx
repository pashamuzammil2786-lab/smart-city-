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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '4px 12px', borderRadius: '20px', color: '#D8B4FE', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <CloudSun size={15} />
            <span>Smart City Module 2: Weather & Urban Microclimate Intelligence</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#F8FAFC', margin: '0 0 0.35rem 0' }}>
            Hyderabad Urban Microclimate & Meteorological Intelligence
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.92rem', margin: 0 }}>
            Lead: <strong>Laskar Varshini Reddy</strong> • Urban Heat Island (UHI) Thermal Mapping, 7-Day Forecasting & Environmental Mitigation
          </p>
        </div>

        <button
          onClick={loadAllWeatherData}
          className="btn"
          style={{ background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
        >
          <RefreshCw size={15} />
          <span>Refresh Weather</span>
        </button>
      </div>

      {/* 2. Hero Current Status & Climate Metrics */}
      {overview && (
        <div style={{ background: '#101B33', border: '1px solid #1E293B', borderRadius: '14px', padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
            {/* Left: Big Temperature Meter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '6px solid #A855F7',
                  background: 'rgba(168, 85, 247, 0.15)',
                  boxShadow: '0 0 25px rgba(168, 85, 247, 0.25)',
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                  {overview.currentTempC}°
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#D8B4FE', textTransform: 'uppercase', marginTop: '4px' }}>
                  Celsius
                </span>
              </div>

              <div>
                <div style={{ display: 'inline-block', background: 'rgba(168, 85, 247, 0.2)', color: '#D8B4FE', fontWeight: 800, fontSize: '0.78rem', padding: '3px 10px', borderRadius: '12px', marginBottom: '0.5rem' }}>
                  Feels Like {overview.feelsLikeC}°C
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F1F5F9', margin: '0 0 0.25rem 0' }}>
                  {overview.condition}
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0 }}>
                  High: <strong style={{ color: '#FCD34D' }}>{overview.highTempC}°C</strong> • Low: <strong style={{ color: '#38BDF8' }}>{overview.lowTempC}°C</strong> • Max UHI: <strong style={{ color: '#EF4444' }}>+{overview.maxUHIDifferentialC}°C</strong>
                </p>
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
      <div style={{ background: '#111C35', border: '1px solid #233554', borderRadius: '14px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
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
                  background: isSelected ? 'rgba(168, 85, 247, 0.12)' : '#0F1A33',
                  border: `1px solid ${isSelected ? '#A855F7' : '#233554'}`,
                  borderRadius: '10px',
                  padding: '1.1rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 0 15px rgba(168, 85, 247, 0.2)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>{z.id}</span>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#F1F5F9', margin: '0.2rem 0 0' }}>
                      {z.name}
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, background: z.statusColor, color: '#FFF', padding: '2px 8px', borderRadius: '4px' }}>
                    {z.heatStressCategory}
                  </span>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginBottom: '0.65rem' }}>
                  {z.type}
                </div>

                {/* Temperature & UHI */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', background: '#111C35', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Local Temp:</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF' }}>{z.currentTempC}°C</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>UHI Thermal Differential:</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: z.uhiDifferentialC > 2.0 ? '#EF4444' : '#10B981' }}>
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
                    <span>Impervious Concrete Surface:</span>
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
        <div style={{ background: '#111C35', border: '1px solid #233554', borderRadius: '14px', padding: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <TrendingUp size={18} color="#A855F7" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
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
        <div style={{ background: '#111C35', border: '1px solid #233554', borderRadius: '14px', padding: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
              Hyderabad 7-Day Meteorological Outlook
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>
              Medium-range synoptic weather forecast, convective rain probabilities, and thermal comfort bands.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.85rem' }}>
            {forecast.sevenDay.map((d, i) => (
              <div
                key={i}
                style={{
                  background: '#0B132B',
                  border: '1px solid #1E293B',
                  borderRadius: '10px',
                  padding: '1rem 0.85rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F1F5F9' }}>{d.day}</span>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{d.date}</span>
                <div style={{ margin: '0.4rem 0' }}>{getWeatherIcon(d.icon)}</div>
                <div style={{ fontSize: '0.78rem', color: '#CBD5E1', fontWeight: 600 }}>{d.condition}</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFF' }}>
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

      {/* 6. Interactive Urban Heat Island Cooling Simulator */}
      <div style={{ background: '#111C35', border: '1px solid #233554', borderRadius: '14px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <TreePine size={20} color="#10B981" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
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
              style={{ background: '#7C3AED', border: 'none', padding: '0.65rem 1.5rem', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              <Zap size={16} />
              <span>{simulating ? 'Simulating Thermal Dynamics...' : 'Run Cooling Simulation'}</span>
            </button>
          </div>
        </form>

        {/* Simulation Output Card */}
        {simResult && (
          <div style={{ marginTop: '1.5rem', background: '#0B132B', border: '1px solid #A855F7', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 0 20px rgba(168, 85, 247, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#D8B4FE', fontWeight: 700 }}>CLIMATE INTERVENTION IMPACT</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF', margin: '0.2rem 0 0' }}>
                  {simResult.zoneName}
                </h3>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, background: '#10B981', color: '#FFF', padding: '4px 12px', borderRadius: '6px' }}>
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
