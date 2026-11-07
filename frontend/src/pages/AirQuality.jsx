import React, { useState, useEffect } from 'react';
import {
  Wind,
  Activity,
  Gauge,
  Thermometer,
  Droplets,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sliders,
  MapPin,
  ShieldAlert,
  Info
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
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { api } from '../services/api';

export default function AirQuality() {
  const [current, setCurrent] = useState(null);
  const [stations, setStations] = useState([]);
  const [history, setHistory] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('forecast'); // 'forecast' | 'history'

  // Interactive Predictor state
  const [simPm25, setSimPm25] = useState(65);
  const [simPm10, setSimPm10] = useState(120);
  const [simNo2, setSimNo2] = useState(50);
  const [simTraffic, setSimTraffic] = useState(0.7);
  const [simTemp, setSimTemp] = useState(30);
  const [simWind, setSimWind] = useState(9);
  const [predictionResult, setPredictionResult] = useState(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [currData, statData, histData, foreData] = await Promise.all([
        api.getAQICurrent(),
        api.getAQIStations(),
        api.getAQIHistory(),
        api.getAQIForecast()
      ]);
      setCurrent(currData);
      setStations(statData.stations || []);
      setHistory(histData.history || []);
      setForecast(foreData.forecast || []);
    } catch (err) {
      console.error('Failed to load AQI data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePredictScenario(e) {
    if (e) e.preventDefault();
    setPredicting(true);
    try {
      const res = await api.predictAQI({
        pm25: simPm25,
        pm10: simPm10,
        no2: simNo2,
        traffic_congestion: simTraffic,
        temperature: simTemp,
        wind_speed: simWind
      });
      setPredictionResult(res);
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setPredicting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#38BDF8' }}>
        <RefreshCw size={36} className="spin" style={{ margin: '0 auto 1rem' }} />
        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading Hyderabad Air Quality & ML Forecast Data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page" style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* 1. Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '4px 12px', borderRadius: '20px', color: '#38BDF8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <Wind size={15} />
            <span>Smart City Module 4: Air Quality Analytics & Multi-Source ML Forecasting</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#F8FAFC', margin: '0 0 0.35rem 0' }}>
            Hyderabad Air Quality Index (AQI) & Predictive Support
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.92rem', margin: 0 }}>
            Lead: <strong>Mohith Madarapu</strong> • Multi-Source Environmental, Traffic & Meteorological Fusion (CPCB Standards)
          </p>
        </div>

        <button
          onClick={loadAllData}
          className="btn"
          style={{ background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
        >
          <RefreshCw size={15} />
          <span>Refresh Sensors</span>
        </button>
      </div>

      {/* 2. Hero Current Status Card */}
      {current && (
        <div style={{ background: '#101B33', border: '1px solid #1E293B', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
            {/* Left: Overall AQI Meter */}
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
                  border: `6px solid ${current.color}`,
                  background: current.bg,
                  boxShadow: `0 0 25px ${current.color}33`,
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                  {current.aqi}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginTop: '4px' }}>
                  NAQI Score
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ background: current.color, color: '#0F172A', fontWeight: 800, fontSize: '0.78rem', padding: '3px 10px', borderRadius: '12px' }}>
                    {current.category} Air Quality
                  </div>
                  <span style={{ fontSize: '0.70rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    ● Analytical CPCB Formula
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F1F5F9', margin: '0 0 0.35rem 0' }}>
                  Hyderabad City Average
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0 }}>
                  Dominant Pollutant: <strong style={{ color: '#E2E8F0' }}>{current.dominantPollutant}</strong> • Active Stations: <strong style={{ color: '#38BDF8' }}>{current.activeStationsCount} CPCB / TSPCB</strong>
                </p>
              </div>
            </div>

            {/* Middle: Meteorology & Congestion */}
            <div style={{ background: '#0B132B', border: '1px solid #1E293B', borderRadius: '10px', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Thermometer size={18} color="#F59E0B" />
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Ambient Temp</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F1F5F9' }}>{current.weather.temperature}°C</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Droplets size={18} color="#38BDF8" />
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Relative Humidity</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F1F5F9' }}>{current.weather.humidity}%</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Wind size={18} color="#10B981" />
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Wind & Direction</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F1F5F9' }}>{current.weather.windSpeed} km/h ({current.weather.windDirection.split(' ')[0]})</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Activity size={18} color="#8B5CF6" />
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Traffic Congestion</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F1F5F9' }}>{Math.round(current.weather.trafficCongestionIndex * 100)}% Index</div>
                </div>
              </div>
            </div>

            {/* Right: Health Advisory */}
            <div style={{ background: '#0F172A', border: `1px solid ${current.color}44`, borderRadius: '10px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', color: current.color }}>
                <ShieldAlert size={18} />
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>CPCB Health Recommendation</span>
              </div>
              <p style={{ color: '#CBD5E1', fontSize: '0.82rem', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                {current.healthAdvisory}
              </p>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8', fontStyle: 'italic' }}>
                Action: {current.action}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Six Pollutant Breakdown Cards */}
      {current && current.pollutants && (
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="#38BDF8" />
            <span>Pollutant Sub-Index Breakdown (National Ambient Air Quality Standards)</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {[
              { key: 'pm25', name: 'PM2.5 (Fine)', info: current.pollutants.pm25, desc: 'Combustion, vehicle exhaust' },
              { key: 'pm10', name: 'PM10 (Coarse)', info: current.pollutants.pm10, desc: 'Road dust, construction' },
              { key: 'no2', name: 'NO2 (Dioxide)', info: current.pollutants.no2, desc: 'Diesel engines, industry' },
              { key: 'co', name: 'CO (Carbon Monoxide)', info: current.pollutants.co, desc: 'Incomplete combustion' },
              { key: 'so2', name: 'SO2 (Sulfur)', info: current.pollutants.so2, desc: 'Industrial emissions' },
              { key: 'o3', name: 'O3 (Ozone)', info: current.pollutants.o3, desc: 'Photochemical reaction' }
            ].map((p) => {
              const ratio = Math.min(100, Math.round((p.info.value / p.info.standard) * 100));
              const isOver = p.info.value > p.info.standard;
              return (
                <div key={p.key} style={{ background: '#101B33', border: '1px solid #1E293B', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#F8FAFC' }}>{p.name}</span>
                    <span style={{ fontSize: '0.72rem', color: isOver ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                      Sub-Idx: {p.info.subIndex}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: isOver ? '#F59E0B' : '#FFFFFF' }}>{p.info.value}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{p.info.unit}</span>
                  </div>
                  {/* Progress vs standard */}
                  <div style={{ background: '#1E293B', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.4rem' }}>
                    <div style={{ width: `${ratio}%`, height: '100%', background: isOver ? '#EF4444' : '#38BDF8', borderRadius: '3px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94A3B8' }}>
                    <span>Standard: {p.info.standard} {p.info.unit}</span>
                    <span style={{ color: isOver ? '#EF4444' : '#64748B' }}>{ratio}% limit</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Interactive Trend & Forecast Visualization */}
      <div style={{ background: '#101B33', border: '1px solid #1E293B', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F1F5F9', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <TrendingUp size={20} color="#38BDF8" />
              <span>Multi-Source ML Air Quality Forecasting & Hourly Patterns</span>
              <span style={{ fontSize: '0.70rem', background: 'rgba(168, 85, 247, 0.15)', color: '#C084FC', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                ● SVR ML Model (1h Horizon)
              </span>
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0 }}>
              Comparing historical rush-hour diurnal curves with 24-hour predictive SVR regression outputs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', background: '#0B132B', padding: '4px', borderRadius: '8px', border: '1px solid #1E293B' }}>
            <button
              onClick={() => setActiveTab('forecast')}
              style={{
                background: activeTab === 'forecast' ? '#2563EB' : 'transparent',
                color: activeTab === 'forecast' ? '#FFF' : '#94A3B8',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              24-Hour ML Forecast
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                background: activeTab === 'history' ? '#2563EB' : 'transparent',
                color: activeTab === 'history' ? '#FFF' : '#94A3B8',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              24-Hour Sensor History
            </button>
          </div>
        </div>

        <div style={{ height: '320px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'forecast' ? (
              <AreaChart data={forecast} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="timeLabel" stroke="#64748B" fontSize={11} />
                <YAxis yAxisId="left" stroke="#38BDF8" fontSize={11} domain={[0, 250]} />
                <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={11} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#F8FAFC' }}
                  labelStyle={{ fontWeight: 700, color: '#38BDF8' }}
                />
                <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                <Area yAxisId="left" type="monotone" dataKey="predictedAqi" name="Forecasted AQI (SVR)" stroke="#38BDF8" strokeWidth={2.5} fillOpacity={1} fill="url(#aqiGrad)" />
                <Line yAxisId="right" type="monotone" dataKey="expectedTraffic" name="Expected Traffic Density (%)" stroke="#F59E0B" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              </AreaChart>
            ) : (
              <LineChart data={history} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="timeLabel" stroke="#64748B" fontSize={11} />
                <YAxis yAxisId="left" stroke="#38BDF8" fontSize={11} domain={[0, 250]} />
                <YAxis yAxisId="right" orientation="right" stroke="#10B981" fontSize={11} domain={[0, 150]} unit=" µg" />
                <Tooltip
                  contentStyle={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#F8FAFC' }}
                  labelStyle={{ fontWeight: 700, color: '#38BDF8' }}
                />
                <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                <Line yAxisId="left" type="monotone" dataKey="aqi" name="Measured AQI" stroke="#38BDF8" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="pm25" name="PM2.5 (µg/m³)" stroke="#F59E0B" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="no2" name="NO2 (µg/m³)" stroke="#10B981" strokeWidth={1.5} dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Two-Column: Hyderabad Monitoring Stations Table + Live Scenario Predictor */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.75rem', marginBottom: '1.75rem' }}>
        {/* Left: Continuous Air Quality Monitoring Stations in Hyderabad */}
        <div style={{ background: '#101B33', border: '1px solid #1E293B', borderRadius: '14px', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F1F5F9', margin: '0 0 0.35rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={18} color="#38BDF8" />
            <span>Hyderabad Sensor Stations (Continuous Monitoring)</span>
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: '0 0 1rem 0' }}>
            TSPCB / CPCB Ambient Air Quality Stations across major city zones.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
            {stations.map((s) => (
              <div
                key={s.id}
                style={{
                  background: '#0B132B',
                  border: '1px solid #1E293B',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.9rem' }}>{s.name}</span>
                    <span style={{ fontSize: '0.68rem', background: '#1E293B', color: '#94A3B8', padding: '2px 6px', borderRadius: '4px' }}>
                      {s.id}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.35rem' }}>
                    {s.area}
                  </div>
                  <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.72rem', color: '#64748B' }}>
                    <span>PM2.5: <strong style={{ color: '#CBD5E1' }}>{s.pm25}</strong></span>
                    <span>PM10: <strong style={{ color: '#CBD5E1' }}>{s.pm10}</strong></span>
                    <span>Traffic: <strong style={{ color: '#CBD5E1' }}>{Math.round(s.trafficIndex * 100)}%</strong></span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>
                    {s.aqi}
                  </div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: s.color, textTransform: 'uppercase', marginTop: '3px' }}>
                    {s.category}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Interactive Scenario Simulator & Real-Time Predictor */}
        <div style={{ background: '#101B33', border: '1px solid #1E293B', borderRadius: '14px', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F1F5F9', margin: '0 0 0.35rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={18} color="#38BDF8" />
            <span>Interactive AQI Scenario Simulator</span>
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: '0 0 1.25rem 0' }}>
            Adjust pollution, traffic and weather parameters to simulate and predict the next-hour AQI in real time.
          </p>

          <form onSubmit={handlePredictScenario} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* PM2.5 Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                <span style={{ color: '#CBD5E1' }}>PM2.5 Concentration:</span>
                <strong style={{ color: '#38BDF8' }}>{simPm25} µg/m³</strong>
              </div>
              <input
                type="range"
                min="10"
                max="250"
                value={simPm25}
                onChange={(e) => setSimPm25(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38BDF8' }}
              />
            </div>

            {/* Traffic Congestion Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                <span style={{ color: '#CBD5E1' }}>Traffic Congestion Density:</span>
                <strong style={{ color: '#F59E0B' }}>{Math.round(simTraffic * 100)}% ({simTraffic >= 0.7 ? 'Rush Hour' : simTraffic >= 0.4 ? 'Moderate' : 'Smooth'})</strong>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={simTraffic}
                onChange={(e) => setSimTraffic(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#F59E0B' }}
              />
            </div>

            {/* Ambient Temperature Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                <span style={{ color: '#CBD5E1' }}>Ambient Temperature:</span>
                <strong style={{ color: '#10B981' }}>{simTemp} °C</strong>
              </div>
              <input
                type="range"
                min="15"
                max="45"
                value={simTemp}
                onChange={(e) => setSimTemp(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#10B981' }}
              />
            </div>

            {/* Wind Speed Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                <span style={{ color: '#CBD5E1' }}>Wind Speed (Atmospheric Dispersion):</span>
                <strong style={{ color: '#8B5CF6' }}>{simWind} km/h</strong>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={simWind}
                onChange={(e) => setSimWind(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#8B5CF6' }}
              />
            </div>

            <button
              type="submit"
              disabled={predicting}
              className="btn btn-primary"
              style={{
                background: '#2563EB',
                color: '#FFF',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem'
              }}
            >
              <Zap size={16} />
              <span>{predicting ? 'Computing ML Regression...' : 'Simulate & Predict Future AQI'}</span>
            </button>
          </form>

          {/* Simulator Prediction Output */}
          {predictionResult && (
            <div
              style={{
                marginTop: '1.25rem',
                background: '#0B132B',
                border: `1px solid ${predictionResult.color}`,
                borderRadius: '10px',
                padding: '1rem',
                boxShadow: `0 0 15px ${predictionResult.color}22`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 600 }}>Simulated Next-Hour AQI:</span>
                <span style={{ background: predictionResult.color, color: '#0F172A', fontWeight: 800, fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px' }}>
                  {predictionResult.category}
                </span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: predictionResult.color, lineHeight: 1, marginBottom: '0.4rem' }}>
                {predictionResult.predictedAQI}
              </div>
              <p style={{ color: '#CBD5E1', fontSize: '0.8rem', margin: '0 0 0.5rem 0' }}>
                {predictionResult.healthAdvisory}
              </p>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', borderTop: '1px solid #1E293B', paddingTop: '0.4rem' }}>
                {predictionResult.driverAnalysis?.trafficContribution} • {predictionResult.driverAnalysis?.windDispersionEffect}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
