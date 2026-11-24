import React, { useState, useEffect } from 'react';
import {
  Activity,
  Clock,
  User,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sliders,
  MapPin,
  ShieldAlert,
  Car,
  Compass,
  Zap,
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

export default function Traffic() {
  const [overview, setOverview] = useState(null);
  const [corridors, setCorridors] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCorridor, setSelectedCorridor] = useState(null);

  // What-If Scenario Predictor State
  const [simCorridorId, setSimCorridorId] = useState('CORR-01');
  const [simHour, setSimHour] = useState(9);
  const [simWeather, setSimWeather] = useState('Clear');
  const [simIncident, setSimIncident] = useState('None');
  const [predictionResult, setPredictionResult] = useState(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    loadAllTrafficData();
  }, []);

  async function loadAllTrafficData() {
    setLoading(true);
    try {
      const [overviewData, corridorsData, historyData] = await Promise.all([
        api.getTrafficOverview(),
        api.getTrafficCorridors(),
        api.getTrafficHistory()
      ]);
      setOverview(overviewData);
      setCorridors(corridorsData.corridors || []);
      setHistory(historyData.history || []);
      if (corridorsData.corridors && corridorsData.corridors.length > 0) {
        setSelectedCorridor(corridorsData.corridors[0]);
      }
    } catch (err) {
      console.error('Failed to load traffic data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePredictScenario(e) {
    if (e) e.preventDefault();
    setPredicting(true);
    try {
      const res = await api.predictTraffic({
        corridorId: simCorridorId,
        hourOfDay: parseInt(simHour, 10),
        weatherCondition: simWeather,
        incidentSeverity: simIncident
      });
      setPredictionResult(res);
    } catch (err) {
      console.error('Traffic prediction failed:', err);
    } finally {
      setPredicting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#F59E0B' }}>
        <RefreshCw size={36} className="spin" style={{ margin: '0 auto 1rem' }} />
        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading Hyderabad Arterial Traffic & Velocity Telemetry...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Module Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #1E293B', paddingBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#1E293B', border: '1px solid #334155', padding: '0.2rem 0.55rem', borderRadius: '4px', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
            <Activity size={13} color="#F59E0B" />
            <span>HYDERABAD TRAFFIC VELOCITY & CONGESTION PLATFORM</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.02em', margin: 0 }}>
            Urban Traffic Velocity & Congestion Analytics
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '0.35rem', maxWidth: '680px', lineHeight: 1.5 }}>
            Arterial corridor velocities, bottleneck detection, and machine-learning traffic volume prediction across Hyderabad.
          </p>
        </div>

        <button
          onClick={loadAllTrafficData}
          className="btn"
          style={{ background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
        >
          <RefreshCw size={14} />
          <span>Refresh Traffic Data</span>
        </button>
      </div>

      {/* 2. Top 4 Summary KPI Cards */}
      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {/* Card 1: Overall Congestion */}
          <div style={{ background: '#111C35', border: '1px solid #1E293B', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                City Congestion Index
              </span>
              <Activity size={16} color="#F59E0B" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: overview.overallCongestionIndex > 65 ? '#EF4444' : '#F59E0B', lineHeight: 1, marginBottom: '0.35rem' }}>
              {overview.overallCongestionIndex}%
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
              {overview.networkStatus} • {overview.criticalBottlenecksCount} Severe Arteries
            </div>
          </div>

          {/* Card 2: Average Arterial Velocity */}
          <div style={{ background: '#111C35', border: '1px solid #1E293B', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Average Network Speed
              </span>
              <Compass size={16} color="#38BDF8" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#38BDF8', lineHeight: 1, marginBottom: '0.35rem' }}>
              {overview.averageVelocityKmH} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>km/h</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
              Free-flow target: {overview.freeFlowVelocityKmH} km/h (-{overview.speedDeficitPct}% deficit)
            </div>
          </div>

          {/* Card 3: Monitored Corridors */}
          <div style={{ background: '#111C35', border: '1px solid #1E293B', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Monitored Corridors
              </span>
              <Car size={16} color="#10B981" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10B981', lineHeight: 1, marginBottom: '0.35rem' }}>
              {overview.monitoredCorridorsCount} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>routes</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
              {overview.totalRoadNetworkKm} km arterial corridor network
            </div>
          </div>

          {/* Card 4: Active Incidents */}
          <div style={{ background: '#111C35', border: '1px solid #1E293B', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Incident Alerts
              </span>
              <ShieldAlert size={16} color="#EC4899" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#EC4899', lineHeight: 1, marginBottom: '0.35rem' }}>
              {overview.activeIncidentsCount} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>alerts</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
              Municipal traffic feeds and advisory logs
            </div>
          </div>
        </div>
      )}

      {/* 3. Active Incident Notice Banner */}
      {overview && overview.activeIncidents && overview.activeIncidents.length > 0 && (
        <div style={{ background: '#111C35', border: '1px solid #1E293B', borderRadius: '8px', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#F59E0B', fontWeight: 600, fontSize: '0.88rem' }}>
            <AlertTriangle size={16} />
            <span>Active Traffic Bottlenecks & Incident Advisories</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.75rem' }}>
            {overview.activeIncidents.map((inc) => (
              <div key={inc.id} style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '6px', padding: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#F1F5F9' }}>{inc.type}</span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 8px', borderRadius: '3px', fontWeight: 600 }}>
                    {inc.severity} Severity
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginBottom: '0.35rem' }}>
                  {inc.corridor} • <em>{inc.location}</em>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#CBD5E1', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Impact: <strong style={{ color: '#F59E0B' }}>{inc.impact}</strong></span>
                  <span style={{ color: '#64748B' }}>{inc.reportedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Eight Arterial Corridors Live Matrix */}
      <div style={{ background: '#111C35', border: '1px solid #1E293B', borderRadius: '8px', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
              Hyderabad Arterial Corridors Analytical Telemetry Matrix
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>
              Simulated corridor speed, Travel Time Index (TTI), and Level of Service (LOS) across major commuter veins.
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Click corridor row to inspect details
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {corridors.map((c) => {
            const isSelected = selectedCorridor && selectedCorridor.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCorridor(c)}
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
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>{c.id} • {c.lengthKm} km</span>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1F5F9', margin: '0.2rem 0 0' }}>
                      {c.name}
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, background: c.statusColor, color: '#FFF', padding: '2px 8px', borderRadius: '3px' }}>
                    LOS {c.levelOfService}
                  </span>
                </div>

                {/* Speed vs Free Flow */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: '#CBD5E1', marginBottom: '0.65rem' }}>
                  <div>
                    Current Speed: <strong style={{ color: '#FCD34D' }}>{c.currentSpeedKmH} km/h</strong>
                  </div>
                  <div style={{ color: '#94A3B8' }}>
                    Free-flow: {c.freeFlowSpeedKmH} km/h
                  </div>
                </div>

                {/* Progress bar for Congestion */}
                <div style={{ marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#94A3B8' }}>Congestion Index:</span>
                    <strong style={{ color: c.statusColor }}>{c.congestionIndex}% ({c.status})</strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#1E293B', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${c.congestionIndex}%`,
                        height: '100%',
                        background: c.statusColor,
                        borderRadius: '3px'
                      }}
                    />
                  </div>
                </div>

                {/* Travel Time & Delay */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94A3B8', borderTop: '1px solid #1E293B', paddingTop: '0.5rem' }}>
                  <span>Travel Time: <strong style={{ color: '#FFF' }}>{c.currentTravelTimeMin}m</strong></span>
                  <span>Delay: <strong style={{ color: '#EF4444' }}>+{c.delayMin}m</strong></span>
                  <span>TTI: <strong style={{ color: '#38BDF8' }}>{c.tti}x</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. 24-Hour Diurnal Congestion & Hourly Speed Trend Chart */}
      <div style={{ background: '#111C35', border: '1px solid #1E293B', borderRadius: '8px', padding: '1.25rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <TrendingUp size={16} color="#F59E0B" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
              Hyderabad 24-Hour Network Congestion & Velocity Diurnal Profile
            </h2>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: 0 }}>
            Visualizing systemic morning (8:30–10:30 AM) and evening (5:30–8:30 PM) rush hour congestion peaks.
          </p>
        </div>

        <div style={{ height: '320px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="hour" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#091022', borderColor: '#233554', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}
                formatter={(val, name) => [name === 'congestionIndex' ? `${val}%` : `${val} km/h`, name === 'congestionIndex' ? 'Congestion Index' : 'Avg Speed']}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.82rem' }} />
              <Area
                type="monotone"
                dataKey="congestionIndex"
                name="Congestion Index (%)"
                stroke="#F59E0B"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#trafficGradient)"
              />
              <Line
                type="monotone"
                dataKey="avgSpeed"
                name="Average Velocity (km/h)"
                stroke="#38BDF8"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. Interactive What-If Scenario Predictor */}
      <div style={{ background: '#111C35', border: '1px solid #1E293B', borderRadius: '8px', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <Sliders size={18} color="#F59E0B" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
            Interactive What-If Scenario Simulator
          </h2>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Simulate how weather conditions, road incidents, and departure time impact arterial travel delay using our Random Forest flow estimator.
        </p>

        <form onSubmit={handlePredictScenario}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Corridor selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.35rem' }}>
                Select Corridor
              </label>
              <select
                value={simCorridorId}
                onChange={(e) => setSimCorridorId(e.target.value)}
                style={{ width: '100%', height: '44px', background: '#0B132B', border: '1px solid #233554', borderRadius: '8px', color: '#FFF', padding: '0 0.75rem', fontSize: '0.88rem', outline: 'none' }}
              >
                {corridors.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Departure Hour */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.35rem' }}>
                Departure Hour: <strong>{simHour}:00 hrs</strong>
              </label>
              <input
                type="range"
                min="0"
                max="23"
                value={simHour}
                onChange={(e) => setSimHour(e.target.value)}
                style={{ width: '100%', marginTop: '0.65rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B' }}>
                <span>00:00 (Night)</span>
                <span>09:00 (AM Peak)</span>
                <span>19:00 (PM Peak)</span>
                <span>23:00</span>
              </div>
            </div>

            {/* Weather Condition */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.35rem' }}>
                Weather Condition
              </label>
              <select
                value={simWeather}
                onChange={(e) => setSimWeather(e.target.value)}
                style={{ width: '100%', height: '44px', background: '#0B132B', border: '1px solid #233554', borderRadius: '8px', color: '#FFF', padding: '0 0.75rem', fontSize: '0.88rem', outline: 'none' }}
              >
                <option value="Clear">Clear & Dry Surface</option>
                <option value="Rain">Moderate Rain (Wet Asphalt)</option>
                <option value="Heavy Rain">Heavy Downpour (Waterlogging)</option>
              </select>
            </div>

            {/* Incident Status */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.35rem' }}>
                Road Incident / Obstruction
              </label>
              <select
                value={simIncident}
                onChange={(e) => setSimIncident(e.target.value)}
                style={{ width: '100%', height: '44px', background: '#0B132B', border: '1px solid #233554', borderRadius: '8px', color: '#FFF', padding: '0 0.75rem', fontSize: '0.88rem', outline: 'none' }}
              >
                <option value="None">None (All Lanes Open)</option>
                <option value="Minor">Minor (Shoulder / Breakdown)</option>
                <option value="Major">Major (Active Lane Blockage)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button
              type="submit"
              disabled={predicting}
              className="btn btn-primary"
              style={{ background: '#2563EB', border: 'none', padding: '0.65rem 1.25rem', fontWeight: 600, fontSize: '0.88rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              <Zap size={15} />
              <span>{predicting ? 'Calculating Flow Prediction...' : 'Run Scenario Prediction'}</span>
            </button>
          </div>
        </form>

        {/* Prediction Results Banner */}
        {predictionResult && (
          <div style={{ marginTop: '1.25rem', background: '#0B132B', border: '1px solid #1E293B', borderRadius: '6px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Hybrid ML & Simulation Results</span>
                  <span style={{ fontSize: '0.68rem', background: '#1E293B', color: '#93C5FD', border: '1px solid #334155', padding: '2px 6px', borderRadius: '3px' }}>
                    Gradient Boosting (R² = 0.968)
                  </span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', margin: '0.2rem 0 0' }}>
                  {predictionResult.corridorName}
                </h3>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, background: '#1E293B', border: `1px solid ${predictionResult.predictedCongestionIndex > 65 ? '#EF4444' : '#F59E0B'}`, color: predictionResult.predictedCongestionIndex > 65 ? '#F87171' : '#FCD34D', padding: '3px 10px', borderRadius: '4px' }}>
                Level of Service: LOS {predictionResult.levelOfService}
              </span>
            </div>

            {/* Hybrid KPI Grid: ML Output + Corridor Sim */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
              {/* Card A: ML Predicted Vehicles */}
              <div style={{ background: '#111C35', padding: '0.75rem', borderRadius: '6px', border: '1px solid #1E293B' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Junction Flow:</span>
                  <span style={{ fontSize: '0.62rem', background: '#0F172A', color: '#93C5FD', padding: '1px 5px', borderRadius: '3px' }}>ML Prediction</span>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#38BDF8', marginTop: '0.2rem' }}>
                  {predictionResult.predictedVehiclesPerHour} veh/hr
                </div>
                <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                  Gradient Boosting regressor
                </span>
              </div>

              {/* Card B: Predicted Travel Time */}
              <div style={{ background: '#111C35', padding: '0.75rem', borderRadius: '6px', border: '1px solid #1E293B' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Predicted Travel Time:</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#FCD34D', marginTop: '0.2rem' }}>
                  {predictionResult.predictedTravelTimeMin} mins
                </div>
                <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                  Free-flow: {predictionResult.freeFlowTimeMin} mins
                </span>
              </div>

              {/* Card C: Predicted Delay */}
              <div style={{ background: '#111C35', padding: '0.75rem', borderRadius: '6px', border: '1px solid #1E293B' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Traffic Delay Penalty:</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#F87171', marginTop: '0.2rem' }}>
                  +{predictionResult.predictedDelayMin} mins
                </div>
                <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                  Corridor queue congestion
                </span>
              </div>

              {/* Card D: Average Velocity */}
              <div style={{ background: '#111C35', padding: '0.85rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Corridor Velocity:</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34D399' }}>
                  {predictionResult.predictedAverageSpeedKmH} km/h
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                  Over {predictionResult.corridorLengthKm} km route
                </span>
              </div>

              {/* Card E: Congestion Index */}
              <div style={{ background: '#111C35', padding: '0.85rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Congestion Index:</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981' }}>
                  {predictionResult.predictedCongestionIndex}%
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                  Capacity saturation
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#94A3B8', borderTop: '1px solid #1E293B', paddingTop: '0.75rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <span>Time Impact: <strong style={{ color: '#E2E8F0' }}>{predictionResult.impactAnalysis?.timeOfDayEffect}</strong></span>
              <span>Weather Contribution: <strong style={{ color: '#E2E8F0' }}>{predictionResult.impactAnalysis?.weatherDelayContribution}</strong></span>
              <span>Incident Factor: <strong style={{ color: '#E2E8F0' }}>{predictionResult.impactAnalysis?.incidentImpact}</strong></span>
            </div>

            <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px dashed #1E293B', fontSize: '0.72rem', color: '#64748B' }}>
              ℹ️ <strong>System Architecture:</strong> Vehicle count ({predictionResult.predictedVehiclesPerHour} veh/hr) is generated by the trained Gradient Boosting model from historical sensor data. Arterial travel times and delay minutes are calculated via the calibrated corridor simulator.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
