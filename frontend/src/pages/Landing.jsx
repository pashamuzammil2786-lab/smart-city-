import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowRight,
  Bus,
  Wind,
  Activity,
  CloudSun,
  ShieldCheck,
  Zap,
  Star,
  CheckCircle2,
  TrendingUp,
  Cpu
} from 'lucide-react';

export default function Landing() {
  const [lang, setLang] = useState('EN'); // 'EN' | 'HI' | 'TE'
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0B1A17',
        color: '#FFFFFF',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        overflowX: 'hidden'
      }}
    >
      {/* 1. Top Navigation Bar */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 2.5rem',
          maxWidth: '1360px',
          margin: '0 auto'
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            textDecoration: 'none',
            color: '#FFFFFF'
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
            }}
          >
            <Building2 size={18} color="#0B1A17" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            SmartCity
          </span>
        </Link>

        {/* Center Navigation Links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            fontSize: '0.9rem',
            color: '#A7BDB6',
            fontWeight: 500
          }}
          className="desktop-only-nav"
        >
          <a href="#features" style={{ color: '#A7BDB6', textDecoration: 'none', transition: 'color 0.2s' }}>
            Features
          </a>
          <Link to="/login" style={{ color: '#A7BDB6', textDecoration: 'none', transition: 'color 0.2s' }}>
            Try Simulator
          </Link>
          <a href="#team" style={{ color: '#A7BDB6', textDecoration: 'none', transition: 'color 0.2s' }}>
            Research Team
          </a>
        </div>

        {/* Right Controls: Language Selector + Auth Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Language Switcher Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              padding: '3px 4px',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
          >
            {['EN', 'हिन्दी', 'తెలుగు'].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  background: lang === l ? '#FFFFFF' : 'transparent',
                  color: lang === l ? '#0B1A17' : '#94A3B8',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '3px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Login Button (White Pill) */}
          <Link
            to="/login"
            style={{
              background: '#FFFFFF',
              color: '#0B1A17',
              padding: '0.45rem 1.25rem',
              borderRadius: '24px',
              fontSize: '0.88rem',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'transform 0.15s ease'
            }}
          >
            Login
          </Link>

          {/* Signup Button (Dark Pill) */}
          <Link
            to="/signup"
            style={{
              background: '#162C26',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '0.45rem 1.25rem',
              borderRadius: '24px',
              fontSize: '0.88rem',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Signup
          </Link>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '3.5rem 2.5rem 4rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '3.5rem',
          alignItems: 'center'
        }}
      >
        {/* Left Column: Big Bold Typography & CTA */}
        <div>
          {/* Tag Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              padding: '0.35rem 0.95rem',
              borderRadius: '24px',
              color: '#34D399',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '1.5rem'
            }}
          >
            <span>✦</span>
            <span>Four-In-One Smart City Platform</span>
          </div>

          {/* Giant Hero Headline */}
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5.2vw, 4.2rem)',
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: '-0.035em',
              color: '#FFFFFF',
              marginBottom: '1.5rem'
            }}
          >
            Compare transit, air quality, traffic, and weather in one smart app.
          </h1>

          {/* Subtitle */}
          <p
            style={{
              color: '#9EBAAF',
              fontSize: '1.05rem',
              lineHeight: 1.6,
              maxWidth: '560px',
              marginBottom: '2.25rem'
            }}
          >
            Check live bus routes across TSRTC, forecast CPCB air quality, detect corridor traffic congestion, and track microclimates across Hyderabad. Save time, money, and emissions with one search.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              to="/signup"
              style={{
                background: '#132822',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '0.85rem 1.75rem',
                borderRadius: '12px',
                fontSize: '0.98rem',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                transition: 'all 0.2s'
              }}
            >
              <span>Get started</span>
              <ArrowRight size={17} />
            </Link>

            <Link
              to="/login"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#E2E8F0',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '0.85rem 1.75rem',
                borderRadius: '12px',
                fontSize: '0.98rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
            >
              Try Simulator
            </Link>
          </div>
        </div>

        {/* Right Column: Stacked Clean White Cards (Exact Style of Screenshot!) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '520px', width: '100%', justifySelf: 'center' }}>
          {/* Card 1: Public Transit */}
          <div
            style={{
              background: '#FFFFFF',
              color: '#0F172A',
              borderRadius: '16px',
              padding: '1.5rem 1.75rem',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.35)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#059669',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase'
                }}
              >
                RIDE COMPARE
              </span>
              <span
                style={{
                  background: '#10B981',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 10px',
                  borderRadius: '12px'
                }}
              >
                Cheapest
              </span>
            </div>
            <div style={{ fontSize: '1.95rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
              Rs 15 - Rs 45
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
              TSRTC Hyderabad • 1,031 routes & 5,028 stops with ML delay prediction
            </div>
          </div>

          {/* Card 2: Air Quality (AQI) */}
          <div
            style={{
              background: '#FFFFFF',
              color: '#0F172A',
              borderRadius: '16px',
              padding: '1.5rem 1.75rem',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.35)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span
                style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: '#0284C7',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase'
                }}
              >
                AIR QUALITY (AQI)
              </span>
              <span
                style={{
                  background: '#10B981',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 10px',
                  borderRadius: '12px'
                }}
              >
                Cleanest
              </span>
            </div>
            <div style={{ fontSize: '1.95rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
              AQI 106 • Moderate
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
              CPCB Standards • 7 Continuous sensor stations across Hyderabad
            </div>
          </div>

          {/* Card 3: Traffic & Weather Multi-Source */}
          <div
            style={{
              background: '#FFFFFF',
              color: '#0F172A',
              borderRadius: '16px',
              padding: '1.5rem 1.75rem',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.35)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#D97706',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase'
                }}
              >
                URBAN VELOCITY & CLIMATE
              </span>
              <span
                style={{
                  color: '#EAB308',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <Star size={13} fill="#EAB308" />
                <span>4.4</span>
              </span>
            </div>
            <div style={{ fontSize: '1.95rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
              68% Traffic • 28.6°C
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
              8 Monitored Corridors (Hitec City, Punjagutta) • Microclimate heat island tracking
            </div>
          </div>
        </div>
      </section>

      {/* 3. Four Research Pillars Grid */}
      <section
        id="features"
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '2rem 2.5rem 4rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
            Four Integrated Smart City Modules
          </h2>
          <p style={{ color: '#9EBAAF', fontSize: '0.95rem', margin: 0 }}>
            Comprehensive municipal platform combining GTFS public transit routing, traffic speeds, weather, and air quality telemetry.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* Module 1 */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ background: '#2563EB', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Bus size={20} color="#FFF" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFF', marginBottom: '0.35rem' }}>Public Transportation</h3>
            <div style={{ fontSize: '0.8rem', color: '#93C5FD', fontWeight: 600, marginBottom: '0.75rem' }}>Multi-Leg Transit & Routing</div>
            <p style={{ fontSize: '0.85rem', color: '#9EBAAF', lineHeight: 1.5, margin: 0 }}>
              1,031 bus routes, 5,028 stops autocomplete, Leaflet route maps, direct and multi-leg transfer journey discovery with estimated passenger demand.
            </p>
          </div>

          {/* Module 2 */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ background: '#059669', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Wind size={20} color="#FFF" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFF', marginBottom: '0.35rem' }}>Air Quality (AQI)</h3>
            <div style={{ fontSize: '0.8rem', color: '#6EE7B7', fontWeight: 600, marginBottom: '0.75rem' }}>Real-Time Sensor Telemetry</div>
            <p style={{ fontSize: '0.85rem', color: '#9EBAAF', lineHeight: 1.5, margin: 0 }}>
              7 CPCB monitoring stations, piecewise linear NAQI calculation for PM2.5, PM10, NO2, CO, 48-hr hourly forecasts, and scenario simulator.
            </p>
          </div>

          {/* Module 3 */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ background: '#D97706', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Activity size={20} color="#FFF" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFF', marginBottom: '0.35rem' }}>Traffic Congestion</h3>
            <div style={{ fontSize: '0.8rem', color: '#FCD34D', fontWeight: 600, marginBottom: '0.75rem' }}>Corridor Velocity & Delays</div>
            <p style={{ fontSize: '0.85rem', color: '#9EBAAF', lineHeight: 1.5, margin: 0 }}>
              8 key road corridors across Hyderabad, corridor velocity tracking, speed deficit index, peak delay estimation, and corridor delay simulator.
            </p>
          </div>

          {/* Module 4 */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ background: '#7C3AED', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <CloudSun size={20} color="#FFF" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFF', marginBottom: '0.35rem' }}>Weather & Microclimate</h3>
            <div style={{ fontSize: '0.8rem', color: '#C4B5FD', fontWeight: 600, marginBottom: '0.75rem' }}>Microclimate & Urban Heat</div>
            <p style={{ fontSize: '0.85rem', color: '#9EBAAF', lineHeight: 1.5, margin: 0 }}>
              Urban Heat Island variations across Charminar, Banjara Hills, Gachibowli, atmospheric pollutant clearing index, and 7-day weather outlook.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer
        id="team"
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '2rem 2.5rem',
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.82rem',
          color: '#6E8B81'
        }}
      >
        <div>
          © 2026 SmartCity Urban Analytics • B.Tech Special Academic Project • Hyderabad, Telangana
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link to="/login" style={{ color: '#A7BDB6', textDecoration: 'none' }}>
            Sign In
          </Link>
          <Link to="/signup" style={{ color: '#A7BDB6', textDecoration: 'none' }}>
            Register
          </Link>
        </div>
      </footer>
    </div>
  );
}
