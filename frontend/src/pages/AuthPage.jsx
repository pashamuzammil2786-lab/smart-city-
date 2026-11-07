import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  Building2,
  Navigation,
  Bus,
  Wind,
  Activity,
  CloudSun,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

const SLIDES = [
  {
    id: 'transport',
    module: 'MODULE 1: PUBLIC TRANSPORTATION',
    lead: 'Multi-Leg Transit & Routing',
    icon: Bus,
    title: 'Compare Transit & Bus Routes',
    subtext: 'Find optimal TSRTC bus routes, live stop sequences, direct and multi-leg transfer connections, and passenger demand estimates across Hyderabad.',
    badge: 'Save up to 35% on daily commute times & fares',
    pills: ['₹ lowFares', '⏱ fasterRoutes', '🚍 5,028Stops', '👥 passengerDemand'],
    bgImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'air-quality',
    module: 'MODULE 4: AIR QUALITY (AQI)',
    lead: 'Continuous Sensor Telemetry',
    icon: Wind,
    title: 'Forecast City Air Quality (AQI)',
    subtext: 'Continuous CPCB sensor network monitoring PM2.5, PM10, NO2, and CO with 48-hour hourly predictive forecasts and health advisories.',
    badge: 'Real-time CPCB NAQI Health Index & Forecast',
    pills: ['🌫️ pm25Tracking', '🏥 healthAlerts', '🌿 7Stations', '📈 24hForecast'],
    bgImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'traffic',
    module: 'MODULE 3: TRAFFIC FLOW & VELOCITY',
    lead: 'Corridor Velocity & Delays',
    icon: Activity,
    title: 'Monitor Urban Traffic Flow',
    subtext: 'Corridor velocity telemetry, bottleneck detection, and speed deficit indicators across 8 major Hyderabad arterial roads.',
    badge: 'Identify bottlenecks before entering peak corridors',
    pills: ['🚦 8Corridors', '⚡ speedDeficit', '🚗 liveFlow', '⚠️ bottleneckAlerts'],
    bgImage: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'weather',
    module: 'MODULE 2: WEATHER & MICROCLIMATE',
    lead: 'Microclimate & Heat Gradients',
    icon: CloudSun,
    title: 'Track Urban Microclimates',
    subtext: 'Analyze Urban Heat Island variations across Charminar, Gachibowli, and Banjara Hills with atmospheric dispersion metrics.',
    badge: 'Microclimate temperature gradients & 7-day outlook',
    pills: ['🌦️ heatIslands', '🌡️ microclimate', '🌧️ rainRisk', '💨 dispersionIndex'],
    bgImage: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&q=80'
  }
];

export default function AuthPage({ defaultTab = 'login', onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'login' | 'signup'
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lang, setLang] = useState('EN'); // 'EN' | 'HI' | 'TE'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();

  // Auto-advance slides every 4.5 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      if (activeTab === 'login') {
        const data = await api.login(email, password);
        localStorage.setItem('smart_city_token', data.token);
        if (onLoginSuccess) onLoginSuccess(data.user);
        navigate('/');
      } else {
        const data = await api.signup(name || 'Student Commuter', email, password);
        localStorage.setItem('smart_city_token', data.token);
        if (onLoginSuccess) onLoginSuccess(data.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexWrap: 'wrap',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
      }}
    >
      {/* ------------------------------------------------------------- */}
      {/* LEFT SECTION: Animated 4-Slide Smart City Carousel (Image 2) */}
      {/* ------------------------------------------------------------- */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          flex: '1 1 50%',
          minWidth: '340px',
          minHeight: '560px',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#0A1815',
          color: '#FFFFFF',
          padding: '2.5rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        {/* Background Images Crossfade */}
        {SLIDES.map((s, idx) => (
          <div
            key={s.id}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `linear-gradient(180deg, rgba(10, 24, 21, 0.72) 0%, rgba(6, 14, 12, 0.94) 100%), url('${s.bgImage}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: currentSlide === idx ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out',
              zIndex: 1
            }}
          />
        ))}

        {/* Top-Left Logo & Slide Navigation Arrows */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
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

          {/* Previous / Next Slide Controls */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={handlePrevSlide}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFF',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Previous Slide"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextSlide}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFF',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Next Slide"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Center Carousel Track: Moving from Right to Left! */}
        <div style={{ position: 'relative', zIndex: 10, width: '100%', overflow: 'hidden', margin: '2rem 0' }}>
          <div
            style={{
              display: 'flex',
              width: `${SLIDES.length * 100}%`,
              transform: `translateX(-${currentSlide * (100 / SLIDES.length)}%)`,
              transition: 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)'
            }}
          >
            {SLIDES.map((slide) => {
              const IconComp = slide.icon;
              return (
                <div
                  key={slide.id}
                  style={{
                    width: `${100 / SLIDES.length}%`,
                    flexShrink: 0,
                    paddingRight: '1rem',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Module Badge & Lead */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.12)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <IconComp size={22} color="#34D399" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#34D399', letterSpacing: '0.06em' }}>
                        {slide.module}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>
                        Lead: <strong>{slide.lead}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Slide Title */}
                  <h1
                    style={{
                      fontSize: 'clamp(1.9rem, 3.4vw, 2.7rem)',
                      fontWeight: 800,
                      lineHeight: 1.15,
                      color: '#FFFFFF',
                      letterSpacing: '-0.025em',
                      marginBottom: '0.85rem'
                    }}
                  >
                    {slide.title}
                  </h1>

                  {/* Slide Subtext */}
                  <p
                    style={{
                      color: '#C2D4CD',
                      fontSize: '0.96rem',
                      lineHeight: 1.55,
                      marginBottom: '1.25rem',
                      maxWidth: '480px'
                    }}
                  >
                    {slide.subtext}
                  </p>

                  {/* Green Pill Tag */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'rgba(16, 185, 129, 0.18)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: '20px',
                      padding: '0.38rem 0.95rem',
                      color: '#34D399',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      marginBottom: '1.5rem'
                    }}
                  >
                    <span>↗</span>
                    <span>{slide.badge}</span>
                  </div>

                  {/* Interactive Indicator Dots for 4 Slides */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    {SLIDES.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        onClick={() => setCurrentSlide(dotIdx)}
                        style={{
                          width: currentSlide === dotIdx ? '22px' : '7px',
                          height: '7px',
                          borderRadius: '4px',
                          background: currentSlide === dotIdx ? '#34D399' : 'rgba(255, 255, 255, 0.35)',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        aria-label={`Go to slide ${dotIdx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Feature Pills Row for the Current Slide */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          {SLIDES[currentSlide].pills.map((pill) => (
            <div
              key={pill}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                backdropFilter: 'blur(6px)',
                borderRadius: '24px',
                padding: '0.35rem 0.85rem',
                fontSize: '0.78rem',
                color: '#E2E8F0',
                fontWeight: 600
              }}
            >
              {pill}
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* RIGHT SECTION: Soft Light Background + Floating Card (Image 2) */}
      {/* ------------------------------------------------------------- */}
      <div
        style={{
          flex: '1 1 50%',
          minWidth: '340px',
          backgroundColor: '#F5F7F4',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '2.5rem',
          position: 'relative'
        }}
      >
        {/* Top-Right Language Switcher */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#EAEFE9',
              borderRadius: '20px',
              padding: '3px 4px',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
          >
            {['EN', 'हिन्दी', 'తెలుగు'].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                style={{
                  background: lang === l ? '#FFFFFF' : 'transparent',
                  color: lang === l ? '#1C2921' : '#64748B',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '3px 9px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: lang === l ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Center Floating White Card */}
        <div
          style={{
            maxWidth: '430px',
            width: '100%',
            margin: 'auto',
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '2.25rem 2.5rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E2E8F0'
          }}
        >
          {/* Segmented Control Pill: [ Login | Signup ] */}
          <div
            style={{
              display: 'flex',
              background: '#EDF2EC',
              borderRadius: '10px',
              padding: '4px',
              marginBottom: '1.75rem'
            }}
          >
            <button
              type="button"
              onClick={() => handleTabSwitch('login')}
              style={{
                flex: 1,
                background: activeTab === 'login' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'login' ? '#1E2923' : '#64748B',
                border: 'none',
                borderRadius: '8px',
                padding: '0.55rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: activeTab === 'login' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('signup')}
              style={{
                flex: 1,
                background: activeTab === 'signup' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'signup' ? '#1E2923' : '#64748B',
                border: 'none',
                borderRadius: '8px',
                padding: '0.55rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: activeTab === 'signup' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Signup
            </button>
          </div>

          {/* Heading */}
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#1E2923',
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em'
            }}
          >
            {activeTab === 'login' ? 'Welcome back' : 'Create an account'}
          </h2>

          {/* Error Message */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                color: '#B91C1C',
                fontSize: '0.82rem',
                marginBottom: '1.25rem'
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* If Signup: Full Name field */}
            {activeTab === 'signup' && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: '0.35rem'
                  }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Mohammed Muzammil"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '0.35rem'
                }}
              >
                Email
              </label>
              <input
                type="email"
                placeholder="abcd@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#475569'
                  }}
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            {/* Big Charcoal Pill Button: [ ⟳ Continue ] */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: '#45524A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem',
                boxShadow: '0 4px 12px rgba(69, 82, 74, 0.25)',
                transition: 'background 0.2s'
              }}
            >
              <RotateCw size={15} className={loading ? 'spin' : ''} />
              <span>{loading ? 'Authenticating...' : 'Continue'}</span>
            </button>
          </form>

          {/* Back to Home Link */}
          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <Link
              to="/"
              style={{
                color: '#1E2923',
                fontSize: '0.88rem',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              Back to home
            </Link>
          </div>
        </div>

        {/* Bottom copyright placeholder */}
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94A3B8' }}>
          Smart City Urban Analytics • Student Academic Project
        </div>
      </div>
    </div>
  );
}
