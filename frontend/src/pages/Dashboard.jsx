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
            background: activeModule === 'transport' ? '#1E293B' : '#111C35',
            border: `1px solid ${activeModule === 'transport' ? '#3B82F6' : '#1E293B'}`,
            borderRadius: '8px',
            padding: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '6px', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bus size={18} color="#fff" />
            </div>
            <span style={{ fontSize: '0.7rem', background: '#0F172A', color: '#93C5FD', border: '1px solid #334155', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>
              GTFS Schedules
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#F8FAFC', marginBottom: '0.2rem' }}>
            1. Public Transport
          </div>
          <div style={{ fontSize: '0.75rem', color: '#93C5FD', fontWeight: 500, marginBottom: '0.35rem' }}>
            Multi-Leg Transit & Demand Forecast
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            5,028 Stops • Random Forest Model
          </div>
        </div>

        {/* Module 2: Weather & Climate */}
        <div
          onClick={() => setActiveModule('weather')}
          style={{
            background: activeModule === 'weather' ? '#1E293B' : '#111C35',
            border: `1px solid ${activeModule === 'weather' ? '#3B82F6' : '#1E293B'}`,
            borderRadius: '8px',
            padding: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '6px', background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CloudSun size={18} color="#fff" />
            </div>
            <span style={{ fontSize: '0.7rem', background: '#0F172A', color: '#C084FC', border: '1px solid #334155', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>
              UHI Microclimate
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#F8FAFC', marginBottom: '0.2rem' }}>
            2. Weather & Climate
          </div>
          <div style={{ fontSize: '0.75rem', color: '#E9D5FF', fontWeight: 500, marginBottom: '0.35rem' }}>
            Thermal Gradients & 7-Day Forecast
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Linear Regression • 6 Spatial Zones
          </div>
        </div>

        {/* Module 3: Traffic Flow */}
        <div
          onClick={() => setActiveModule('traffic')}
          style={{
            background: activeModule === 'traffic' ? '#1E293B' : '#111C35',
            border: `1px solid ${activeModule === 'traffic' ? '#3B82F6' : '#1E293B'}`,
            borderRadius: '8px',
            padding: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '6px', background: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={18} color="#fff" />
            </div>
            <span style={{ fontSize: '0.7rem', background: '#0F172A', color: '#FCD34D', border: '1px solid #334155', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>
              Arterial Flow
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#F8FAFC', marginBottom: '0.2rem' }}>
            3. Traffic Flow & Congestion
          </div>
          <div style={{ fontSize: '0.75rem', color: '#FDE68A', fontWeight: 500, marginBottom: '0.35rem' }}>
            Corridor Velocity & Incident Delays
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Gradient Boosting • 8 Arteries
          </div>
        </div>

        {/* Module 4: Air Quality AQI */}
        <div
          onClick={() => setActiveModule('aqi')}
          style={{
            background: activeModule === 'aqi' ? '#1E293B' : '#111C35',
            border: `1px solid ${activeModule === 'aqi' ? '#3B82F6' : '#1E293B'}`,
            borderRadius: '8px',
            padding: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '6px', background: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wind size={18} color="#fff" />
            </div>
            <span style={{ fontSize: '0.7rem', background: '#0F172A', color: '#7DD3FC', border: '1px solid #334155', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>
              CPCB NAQI
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#F8FAFC', marginBottom: '0.2rem' }}>
            4. Air Quality (NAQI)
          </div>
          <div style={{ fontSize: '0.75rem', color: '#7DD3FC', fontWeight: 500, marginBottom: '0.35rem' }}>
            Sub-Index Breakdown & 1-Hr SVR
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Support Vector Regression • 6 Stations
          </div>
        </div>
      </div>

      {/* 3. Segmented Navigation Bar to Switch Active View */}
      <div style={{ display: 'flex', background: '#111C35', border: '1px solid #1E293B', borderRadius: '6px', padding: '3px', gap: '4px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveModule('transport')}
          style={{
            flex: 1,
            minWidth: '160px',
            padding: '0.55rem 0.85rem',
            borderRadius: '4px',
            border: 'none',
            background: activeModule === 'transport' ? '#2563EB' : 'transparent',
            color: activeModule === 'transport' ? '#FFFFFF' : '#94A3B8',
            fontWeight: 600,
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Bus size={15} />
          <span>Public Transport</span>
        </button>

        <button
          onClick={() => setActiveModule('weather')}
          style={{
            flex: 1,
            minWidth: '160px',
            padding: '0.55rem 0.85rem',
            borderRadius: '4px',
            border: 'none',
            background: activeModule === 'weather' ? '#2563EB' : 'transparent',
            color: activeModule === 'weather' ? '#FFFFFF' : '#94A3B8',
            fontWeight: 600,
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <CloudSun size={15} />
          <span>Weather & Climate</span>
        </button>

        <button
          onClick={() => setActiveModule('traffic')}
          style={{
            flex: 1,
            minWidth: '160px',
            padding: '0.55rem 0.85rem',
            borderRadius: '4px',
            border: 'none',
            background: activeModule === 'traffic' ? '#2563EB' : 'transparent',
            color: activeModule === 'traffic' ? '#FFFFFF' : '#94A3B8',
            fontWeight: 600,
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Activity size={15} />
          <span>Traffic Flow</span>
        </button>

        <button
          onClick={() => setActiveModule('aqi')}
          style={{
            flex: 1,
            minWidth: '160px',
            padding: '0.55rem 0.85rem',
            borderRadius: '4px',
            border: 'none',
            background: activeModule === 'aqi' ? '#2563EB' : 'transparent',
            color: activeModule === 'aqi' ? '#FFFFFF' : '#94A3B8',
            fontWeight: 600,
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Wind size={15} />
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
        <Weather />
      )}

      {/* VIEW 3: TRAFFIC FLOW MODULE */}
      {activeModule === 'traffic' && (
        <Traffic />
      )}

      {/* VIEW 4: AIR QUALITY (AQI) MODULE */}
      {activeModule === 'aqi' && (
        <AirQuality />
      )}
    </div>
  );
}
