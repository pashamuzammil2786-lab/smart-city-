import React, { useState } from 'react';
import Transport from './Transport';
import AirQuality from './AirQuality';
import Traffic from './Traffic';
import Weather from './Weather';
import {
  Bus,
  Wind,
  Activity,
  CloudSun,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function Dashboard({ user }) {
  const [activeModule, setActiveModule] = useState('transport'); // 'transport' | 'aqi' | 'traffic' | 'weather'

  return (
    <div className="dashboard-page" style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#F8FAFC', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
            Smart City Urban Analytics Dashboard
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.92rem', margin: 0 }}>
            {user?.name ? `Welcome back, ${user.name} • ` : ''}Hyderabad Multi-Domain Civic Telemetry & Predictive Decision Support
          </p>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '0.45rem 0.9rem',
            borderRadius: '8px',
            color: '#34D399',
            fontSize: '0.82rem',
            fontWeight: 700
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
          <span>4 Live City Modules Active • Hybrid ML Connected</span>
        </div>
      </div>

      {/* 2. Four Modules Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        {/* Module 1: Transport */}
        <div
          onClick={() => setActiveModule('transport')}
          style={{
            background: activeModule === 'transport' ? 'rgba(37, 99, 235, 0.15)' : '#111C35',
            border: `2px solid ${activeModule === 'transport' ? '#3B82F6' : '#233554'}`,
            borderRadius: '12px',
            padding: '1.15rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeModule === 'transport' ? '0 0 16px rgba(59, 130, 246, 0.25)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bus size={20} color="#fff" />
            </div>
            <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
              ● Live ML
            </span>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF', marginBottom: '0.2rem' }}>
            1. Public Transport
          </div>
          <div style={{ fontSize: '0.75rem', color: '#93C5FD', fontWeight: 600, marginBottom: '0.35rem' }}>
            GTFS Multi-Leg & 7-Day Demand ML
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            5,028 Stops • Random Forest Regressor
          </div>
        </div>

        {/* Module 2: Weather & Climate */}
        <div
          onClick={() => setActiveModule('weather')}
          style={{
            background: activeModule === 'weather' ? 'rgba(168, 85, 247, 0.15)' : '#111C35',
            border: `2px solid ${activeModule === 'weather' ? '#A855F7' : '#233554'}`,
            borderRadius: '12px',
            padding: '1.15rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeModule === 'weather' ? '0 0 16px rgba(168, 85, 247, 0.25)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CloudSun size={20} color="#fff" />
            </div>
            <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
              ● Live ML
            </span>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF', marginBottom: '0.2rem' }}>
            2. Weather & Climate
          </div>
          <div style={{ fontSize: '0.75rem', color: '#E9D5FF', fontWeight: 600, marginBottom: '0.35rem' }}>
            Microclimate & Urban Heat Index
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Linear Regression • 6 Urban Zones
          </div>
        </div>

        {/* Module 3: Traffic Flow */}
        <div
          onClick={() => setActiveModule('traffic')}
          style={{
            background: activeModule === 'traffic' ? 'rgba(245, 158, 11, 0.15)' : '#111C35',
            border: `2px solid ${activeModule === 'traffic' ? '#F59E0B' : '#233554'}`,
            borderRadius: '12px',
            padding: '1.15rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeModule === 'traffic' ? '0 0 16px rgba(245, 158, 11, 0.25)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} color="#fff" />
            </div>
            <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
              ● Live ML
            </span>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF', marginBottom: '0.2rem' }}>
            3. Traffic Flow & Congestion
          </div>
          <div style={{ fontSize: '0.75rem', color: '#FDE68A', fontWeight: 600, marginBottom: '0.35rem' }}>
            Junction Vehicles & Arterial Delays
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Gradient Boosting • 8 Corridors
          </div>
        </div>

        {/* Module 4: Air Quality AQI */}
        <div
          onClick={() => setActiveModule('aqi')}
          style={{
            background: activeModule === 'aqi' ? 'rgba(56, 189, 248, 0.15)' : '#111C35',
            border: `2px solid ${activeModule === 'aqi' ? '#38BDF8' : '#233554'}`,
            borderRadius: '12px',
            padding: '1.15rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeModule === 'aqi' ? '0 0 16px rgba(56, 189, 248, 0.25)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wind size={20} color="#fff" />
            </div>
            <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
              ● Live ML
            </span>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF', marginBottom: '0.2rem' }}>
            4. Air Quality (NAQI)
          </div>
          <div style={{ fontSize: '0.75rem', color: '#7DD3FC', fontWeight: 600, marginBottom: '0.35rem' }}>
            CPCB Statutory Index & 1-Hr Forecast
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            SVR RBF Kernel • 6 Stations
          </div>
        </div>
      </div>

      {/* 3. Segmented Navigation Bar to Switch Active View */}
      <div style={{ display: 'flex', background: '#111C35', border: '1px solid #233554', borderRadius: '10px', padding: '4px', gap: '4px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveModule('transport')}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeModule === 'transport' ? '#2563EB' : 'transparent',
            color: activeModule === 'transport' ? '#FFFFFF' : '#94A3B8',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Bus size={17} />
          <span>Public Transport</span>
        </button>

        <button
          onClick={() => setActiveModule('weather')}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeModule === 'weather' ? '#7C3AED' : 'transparent',
            color: activeModule === 'weather' ? '#FFFFFF' : '#94A3B8',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <CloudSun size={17} />
          <span>Weather & Climate</span>
        </button>

        <button
          onClick={() => setActiveModule('traffic')}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeModule === 'traffic' ? '#D97706' : 'transparent',
            color: activeModule === 'traffic' ? '#FFFFFF' : '#94A3B8',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Activity size={17} />
          <span>Traffic Flow</span>
        </button>

        <button
          onClick={() => setActiveModule('aqi')}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeModule === 'aqi' ? '#0284C7' : 'transparent',
            color: activeModule === 'aqi' ? '#FFFFFF' : '#94A3B8',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Wind size={17} />
          <span>Air Quality (AQI)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 4. ACTIVE MODULE VIEW CONTENT                            */}
      {/* ======================================================== */}

      {/* VIEW 1: TRANSPORT MODULE */}
      {activeModule === 'transport' && (
        <Transport user={user} />
      )}

      {/* VIEW 2: WEATHER & CLIMATE MODULE */}
      {activeModule === 'weather' && (
        <div style={{ background: '#101B33', border: '1px solid #1E293B', borderRadius: '14px', padding: '1rem' }}>
          <Weather />
        </div>
      )}

      {/* VIEW 3: TRAFFIC FLOW MODULE */}
      {activeModule === 'traffic' && (
        <div style={{ background: '#101B33', border: '1px solid #1E293B', borderRadius: '14px', padding: '1rem' }}>
          <Traffic />
        </div>
      )}

      {/* VIEW 4: AIR QUALITY (AQI) MODULE */}
      {activeModule === 'aqi' && (
        <div style={{ background: '#101B33', border: '1px solid #1E293B', borderRadius: '14px', padding: '1rem' }}>
          <AirQuality />
        </div>
      )}
    </div>
  );
}
