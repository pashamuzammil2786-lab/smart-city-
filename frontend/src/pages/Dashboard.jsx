import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import LeafletMap from '../components/LeafletMap';
import AirQuality from './AirQuality';
import Traffic from './Traffic';
import Weather from './Weather';
import {
  Bus,
  Wind,
  Activity,
  CloudSun,
  MapPin,
  Navigation,
  Clock,
  AlertTriangle,
  Users,
  Search,
  ArrowRight,
  ArrowLeftRight,
  Sparkles,
  Layers,
  CheckCircle2,
  TrendingUp,
  User,
  ShieldCheck
} from 'lucide-react';

export default function Dashboard({ user }) {
  const [activeModule, setActiveModule] = useState('transport'); // 'transport' | 'aqi' | 'traffic' | 'weather'

  // ==========================================
  // TRANSPORT MODULE STATE & LOGIC
  // ==========================================
  const [origin, setOrigin] = useState('Charminar');
  const [destination, setDestination] = useState('Afzalgunj');
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showOriginSugg, setShowOriginSugg] = useState(false);
  const [showDestSugg, setShowDestSugg] = useState(false);

  const [userLoc, setUserLoc] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMessage, setGeoMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  const [selectedRoute, setSelectedRoute] = useState(null);
  const [intermediateStops, setIntermediateStops] = useState([]);
  const [stopsLoading, setStopsLoading] = useState(false);

  // Auto-search default corridor on initial mount
  useEffect(() => {
    executeSearch('Charminar', 'Afzalgunj');
  }, []);

  // Origin stop search autocomplete
  const handleOriginChange = async (val) => {
    setOrigin(val);
    if (val.trim().length >= 2) {
      try {
        const data = await api.getStops(val);
        setOriginSuggestions(data.stops || []);
        setShowOriginSugg(true);
      } catch (e) {
        setOriginSuggestions([]);
      }
    } else {
      setOriginSuggestions([]);
      setShowOriginSugg(false);
    }
  };

  // Destination stop search autocomplete
  const handleDestChange = async (val) => {
    setDestination(val);
    if (val.trim().length >= 2) {
      try {
        const data = await api.getStops(val);
        setDestSuggestions(data.stops || []);
        setShowDestSugg(true);
      } catch (e) {
        setDestSuggestions([]);
      }
    } else {
      setDestSuggestions([]);
      setShowDestSugg(false);
    }
  };

  // Swap Origin and Destination
  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    executeSearch(destination, temp);
  };

  // Browser GPS Geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoMessage('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setGeoMessage('Detecting GPS location...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserLoc({ lat, lon });

        try {
          const data = await api.getNearbyStops(lat, lon, 5.0, 3);
          if (data.nearbyStops && data.nearbyStops.length > 0) {
            const closest = data.nearbyStops[0];
            setOrigin(closest.stop_name);
            setGeoMessage(`Located closest stop: ${closest.stop_name} (${closest.distance_meters}m)`);
          } else {
            setGeoMessage(`GPS (${lat.toFixed(3)}, ${lon.toFixed(3)}) acquired. No bus stop found within 5km.`);
          }
        } catch (err) {
          setGeoMessage('Could not query nearby stops.');
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        setGeoMessage('Location access denied. Please enter origin stop manually.');
      },
      { timeout: 10000 }
    );
  };

  // Execute Route Search
  const executeSearch = async (origToUse = origin, destToUse = destination) => {
    if (!origToUse || !destToUse) {
      setError('Please specify both origin and destination stops.');
      return;
    }

    setError('');
    setLoading(true);
    setShowOriginSugg(false);
    setShowDestSugg(false);

    try {
      const data = await api.getRoutes(origToUse, destToUse);
      setSearchResult(data);

      if (data.options && data.options.length > 0) {
        const topRoute = data.options[0];
        setSelectedRoute(topRoute);
        fetchIntermediateStops(topRoute.trip_id, topRoute.route_id);
      } else {
        setSelectedRoute(null);
        setIntermediateStops([]);
      }
    } catch (err) {
      setError(err.message || 'No direct transit routes found between these stops.');
      setSearchResult(null);
      setSelectedRoute(null);
      setIntermediateStops([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Intermediate Stops for Map Plotting
  const fetchIntermediateStops = async (tripId, routeId) => {
    setStopsLoading(true);
    try {
      const res = await api.getRouteStops(tripId, routeId);
      setIntermediateStops(res.stops || []);
    } catch (e) {
      setIntermediateStops([]);
    } finally {
      setStopsLoading(false);
    }
  };

  const handleSelectRoute = (route) => {
    setSelectedRoute(route);
    fetchIntermediateStops(route.trip_id, route.route_id);
  };

  // Active route metrics for summary cards
  const activeRoute = selectedRoute || (searchResult?.options?.[0] || null);

  // Safe helper extractors for route properties (supporting all backend response formats)
  const getDuration = (r) => r?.scheduled_duration_mins ?? r?.duration_minutes ?? '--';
  const getDelay = (r) => r?.expected_delay_mins ?? r?.expected_delay?.expectedDelayMins ?? 0;
  const getTrafficCondition = (r) => r?.traffic_condition ?? r?.expected_delay?.trafficCondition ?? 'Normal Traffic';
  const getCrowdLevel = (r) => (typeof r?.crowd_level === 'object' ? r?.crowd_level?.level : r?.crowd_level) || 'Normal';
  const getCrowdBadge = (r) => r?.crowd_badge ?? (typeof r?.crowd_level === 'object' ? r?.crowd_level?.badge : `${r?.crowd_level || 'Normal'} Demand`);
  const getRouteShort = (r) => r?.route_id ?? r?.route_name ?? r?.route_short_name ?? 'BUS';
  const getRouteLong = (r) => r?.route_name ?? r?.trip_title ?? r?.route_long_name ?? 'Hyderabad TSRTC Route';
  const getDeparture = (r) => r?.departure_time ?? r?.next_departure_time ?? r?.formatted_departure ?? r?.raw_departure_time ?? '--';
  const getArrival = (r) => r?.arrival_time ?? r?.scheduled_arrival_time ?? r?.formatted_arrival ?? r?.raw_arrival_time ?? '--';

  return (
    <div className="dashboard-page" style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#F8FAFC', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
            Smart City Urban Analytics Dashboard
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.92rem', margin: 0 }}>
            Welcome back • Hyderabad Public Transit & Urban Services Platform
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
          <span>4 Live City Modules Active</span>
        </div>
      </div>

      {/* 2. Four Modules Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        {/* Module 1: Transport (Active) */}
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
              ● Active
            </span>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF', marginBottom: '0.2rem' }}>
            1. Public Transport
          </div>
          <div style={{ fontSize: '0.75rem', color: '#93C5FD', fontWeight: 600, marginBottom: '0.35rem' }}>
            Multi-Leg Routing & Schedules
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            5,028 Stops • GTFS Direct & Transfer
          </div>
        </div>

        {/* Module 4: Air Quality AQI (Active) */}
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
              ● Active
            </span>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF', marginBottom: '0.2rem' }}>
            4. Air Quality (AQI)
          </div>
          <div style={{ fontSize: '0.75rem', color: '#7DD3FC', fontWeight: 600, marginBottom: '0.35rem' }}>
            CPCB Sensor Telemetry & Health
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Real-Time Stations & 48h Forecast
          </div>
        </div>

        {/* Module 3: Traffic (Active) */}
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
              ● Active
            </span>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF', marginBottom: '0.2rem' }}>
            3. Traffic Flow
          </div>
          <div style={{ fontSize: '0.75rem', color: '#FDE68A', fontWeight: 600, marginBottom: '0.35rem' }}>
            Live Corridor Speed & Congestion
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            8 Key Corridors & Delay Simulator
          </div>
        </div>

        {/* Module 2: Weather (Active) */}
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
              ● Active
            </span>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF', marginBottom: '0.2rem' }}>
            2. Weather & Climate
          </div>
          <div style={{ fontSize: '0.75rem', color: '#E9D5FF', fontWeight: 600, marginBottom: '0.35rem' }}>
            Microclimate & Urban Heat Index
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            6 Microclimate Zones & 7-Day Forecast
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
      </div>

      {/* ======================================================== */}
      {/* 4. ACTIVE MODULE VIEW CONTENT                            */}
      {/* ======================================================== */}

      {/* VIEW A: TRANSPORT MODULE (WORKING & TESTED) */}
      {activeModule === 'transport' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Prominent Route Search */}
          <div style={{ background: '#111C35', border: '1px solid #233554', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeSearch();
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: '0.75rem', alignItems: 'flex-end' }} className="route-search-grid">
                {/* Origin Input */}
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.35rem' }}>
                    Origin Stop (Hyderabad TSRTC)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Charminar, Mehdipatnam"
                      value={origin}
                      onChange={(e) => handleOriginChange(e.target.value)}
                      onFocus={() => originSuggestions.length > 0 && setShowOriginSugg(true)}
                      style={{ paddingLeft: '2.4rem', height: '46px', fontSize: '0.92rem' }}
                    />
                    <MapPin size={17} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#10B981' }} />
                  </div>

                  {showOriginSugg && originSuggestions.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#0B132B',
                        border: '1px solid #233554',
                        borderRadius: '8px',
                        marginTop: '4px',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        zIndex: 200,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.6)'
                      }}
                    >
                      {originSuggestions.map((s) => (
                        <div
                          key={s.stop_id}
                          onClick={() => {
                            setOrigin(s.stop_name);
                            setShowOriginSugg(false);
                          }}
                          style={{
                            padding: '0.65rem 0.95rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid #162544',
                            fontSize: '0.85rem',
                            color: '#E2E8F0',
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#162544')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <span>{s.stop_name}</span>
                          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{s.zone_id || 'TSRTC'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Swap Button */}
                <div style={{ paddingBottom: '2px' }}>
                  <button
                    type="button"
                    onClick={handleSwap}
                    style={{
                      height: '46px',
                      width: '46px',
                      borderRadius: '10px',
                      background: '#1A294A',
                      border: '1px solid #2B426E',
                      color: '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Swap Origin and Destination"
                  >
                    <ArrowLeftRight size={17} />
                  </button>
                </div>

                {/* Destination Input */}
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.35rem' }}>
                    Destination Stop (Hyderabad TSRTC)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Secunderabad, Afzalgunj"
                      value={destination}
                      onChange={(e) => handleDestChange(e.target.value)}
                      onFocus={() => destSuggestions.length > 0 && setShowDestSugg(true)}
                      style={{ paddingLeft: '2.4rem', height: '46px', fontSize: '0.92rem' }}
                    />
                    <Navigation size={17} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#EF4444' }} />
                  </div>

                  {showDestSugg && destSuggestions.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#0B132B',
                        border: '1px solid #233554',
                        borderRadius: '8px',
                        marginTop: '4px',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        zIndex: 200,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.6)'
                      }}
                    >
                      {destSuggestions.map((s) => (
                        <div
                          key={s.stop_id}
                          onClick={() => {
                            setDestination(s.stop_name);
                            setShowDestSugg(false);
                          }}
                          style={{
                            padding: '0.65rem 0.95rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid #162544',
                            fontSize: '0.85rem',
                            color: '#E2E8F0',
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#162544')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <span>{s.stop_name}</span>
                          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{s.zone_id || 'TSRTC'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Find Routes Button */}
                <div style={{ paddingBottom: '2px' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{
                      height: '46px',
                      padding: '0 1.5rem',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Search size={17} />
                    <span>{loading ? 'Searching...' : 'Find Routes'}</span>
                  </button>
                </div>
              </div>

              {/* GPS & Corridor helpers */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={geoLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38BDF8',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: 0
                  }}
                >
                  <Navigation size={13} />
                  <span>{geoLoading ? 'Detecting GPS...' : 'Use My Current Location'}</span>
                </button>

                {geoMessage && (
                  <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>{geoMessage}</span>
                )}

                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.78rem', color: '#64748B', flexWrap: 'wrap' }}>
                  <span>Popular:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOrigin('Mehdipatnam');
                      setDestination('Dondanpally');
                      executeSearch('Mehdipatnam', 'Dondanpally');
                    }}
                    style={{ background: 'none', border: 'none', color: '#38BDF8', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontWeight: 600 }}
                  >
                    Mehdipatnam → Dondanpally
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOrigin('Shaikpet');
                      setDestination('Indian Business School ( Ibs )');
                      executeSearch('Shaikpet', 'Indian Business School ( Ibs )');
                    }}
                    style={{ background: 'none', border: 'none', color: '#38BDF8', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontWeight: 600 }}
                  >
                    Shaikpet → IBS (Transfer)
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOrigin('Mehdipatnam');
                      setDestination('Secunderabad');
                      executeSearch('Mehdipatnam', 'Secunderabad');
                    }}
                    style={{ background: 'none', border: 'none', color: '#93C5FD', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    Mehdipatnam → Secunderabad
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOrigin('Koti');
                      setDestination('Dilsukhnagar');
                      executeSearch('Koti', 'Dilsukhnagar');
                    }}
                    style={{ background: 'none', border: 'none', color: '#93C5FD', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    Koti → Dilsukhnagar
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '0.85rem 1.25rem', color: '#FCA5A5', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* 4 Summary KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div style={{ background: '#111C35', border: '1px solid #233554', borderRadius: '12px', padding: '1.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Available Routes
                </span>
                <Bus size={17} color="#3B82F6" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1, marginBottom: '0.25rem' }}>
                {searchResult ? `${searchResult.total_routes_found} ${searchResult.transfer_routes_count > 0 ? 'Options (Direct/Transfer)' : 'Direct Options'}` : '--'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                {searchResult ? `Covering ${origin} → ${destination}` : 'Enter origin & destination above'}
              </div>
            </div>

            <div style={{ background: '#111C35', border: '1px solid #233554', borderRadius: '12px', padding: '1.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Journey Duration
                </span>
                <Clock size={17} color="#10B981" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', lineHeight: 1, marginBottom: '0.25rem' }}>
                {activeRoute ? `${getDuration(activeRoute)} mins` : '--'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                {activeRoute ? `${activeRoute.duration_source || 'Scheduled Timetable'} • ${activeRoute.stops_count || 0} stops` : 'Scheduled transit timetable duration'}
              </div>
            </div>

            <div style={{ background: '#111C35', border: '1px solid #233554', borderRadius: '12px', padding: '1.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Predicted Delay
                </span>
                <AlertTriangle size={17} color="#F59E0B" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F59E0B', lineHeight: 1, marginBottom: '0.25rem' }}>
                {activeRoute ? `+${getDelay(activeRoute)} mins` : '--'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                {activeRoute ? getTrafficCondition(activeRoute) : 'Corridor peak delay heuristic'}
              </div>
            </div>

            <div style={{ background: '#111C35', border: '1px solid #233554', borderRadius: '12px', padding: '1.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Passenger Demand
                </span>
                <Users size={17} color="#38BDF8" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38BDF8', lineHeight: 1, marginBottom: '0.25rem' }}>
                {activeRoute ? `${getCrowdLevel(activeRoute)} Demand` : '--'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                {activeRoute ? getCrowdBadge(activeRoute) : 'Estimated passenger occupancy'}
              </div>
            </div>
          </div>

          {/* Interactive Map & Route Cards Split View */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: '1.5rem' }} className="map-results-grid">
            {/* Leaflet Map */}
            <div style={{ background: '#111C35', border: '1px solid #233554', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #233554', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0F182E' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={17} color="#38BDF8" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#F1F5F9' }}>
                    Hyderabad Transit Route Map
                  </span>
                </div>
                {selectedRoute && (
                  <span style={{ fontSize: '0.75rem', color: '#93C5FD', background: 'rgba(59, 130, 246, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                    Viewing Route: {getRouteShort(selectedRoute)}
                  </span>
                )}
              </div>

              <div style={{ height: '480px', width: '100%', position: 'relative' }}>
                <LeafletMap
                  origin={searchResult?.origin}
                  destination={searchResult?.destination}
                  userLocation={userLoc}
                  intermediateStops={intermediateStops}
                  loadingStops={stopsLoading}
                />
              </div>

              <div style={{ padding: '0.65rem 1rem', background: '#0B132B', borderTop: '1px solid #233554', fontSize: '0.75rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                <span>Green Pin: Origin (A) • Red Pin: Destination (B)</span>
                <span>Blue Dots: Intermediate Stops</span>
              </div>
            </div>

            {/* Route Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F1F5F9', margin: 0 }}>
                  Available Bus Routes ({searchResult?.options?.length || 0})
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Ranked by duration & transfer efficiency
                </span>
              </div>

              {searchResult && searchResult.options && searchResult.options.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '490px', overflowY: 'auto', paddingRight: '4px' }}>
                  {searchResult.options.map((route, idx) => {
                    const isSelected = selectedRoute && selectedRoute.trip_id === route.trip_id;
                    const isTransfer = route.transfers_count > 0 || route.journey_type === 'transfer';
                    return (
                      <div
                        key={`${route.trip_id}-${idx}`}
                        onClick={() => handleSelectRoute(route)}
                        style={{
                          background: isSelected ? 'rgba(59, 130, 246, 0.12)' : '#111C35',
                          border: `1px solid ${isSelected ? '#3B82F6' : '#233554'}`,
                          borderRadius: '12px',
                          padding: '1.1rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 0 15px rgba(59, 130, 246, 0.2)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <div style={{ background: isTransfer ? '#4338CA' : '#2563EB', color: '#FFF', fontWeight: 800, fontSize: '0.88rem', padding: '3px 9px', borderRadius: '6px' }}>
                              {getRouteShort(route)}
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#F8FAFC' }}>
                              {getRouteLong(route)}
                            </span>
                            {isTransfer ? (
                              <span style={{ fontSize: '0.72rem', background: '#312E81', color: '#A5B4FC', border: '1px solid #4338CA', padding: '2px 7px', borderRadius: '4px', fontWeight: 700 }}>
                                {route.num_transfers === 2 ? '2 Transfers' : '1 Transfer'} ({route.transfers?.map(t => t.transfer_stop_name).join(' → ') || 'Interchange'})
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 7px', borderRadius: '4px', fontWeight: 700 }}>
                                Direct Bus
                              </span>
                            )}
                            <span style={{
                              fontSize: '0.70rem',
                              background: route.duration_source === 'Scheduled Timetable' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                              color: route.duration_source === 'Scheduled Timetable' ? '#60A5FA' : '#C084FC',
                              border: `1px solid ${route.duration_source === 'Scheduled Timetable' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(168, 85, 247, 0.3)'}`,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontWeight: 600
                            }}>
                              {route.duration_source === 'Scheduled Timetable' ? '● Timetable' : '● Calibrated Transit Model'}
                            </span>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>
                              {getDuration(route)} min
                            </div>
                            {isTransfer && route.transfer_waiting_mins > 0 && (
                              <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                                (Wait: {route.transfer_waiting_mins}m)
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.65rem' }}>
                          <div>
                            Departure: <strong style={{ color: '#E2E8F0' }}>{getDeparture(route)}</strong> → Arrival: <strong style={{ color: '#E2E8F0' }}>{getArrival(route)}</strong>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            {route.stops_count || 0} stops
                          </span>
                        </div>

                        {/* Ordered Leg Breakdown for Multi-Leg Journeys */}
                        {route.legs && route.legs.length > 1 && (
                          <div style={{ margin: '0.75rem 0', padding: '0.65rem', background: '#0B132B', borderRadius: '8px', border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            {route.legs.map((leg, legIdx) => (
                              <div key={legIdx} style={{ fontSize: '0.76rem', color: '#CBD5E1' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontWeight: 700, color: '#38BDF8' }}>
                                    Leg {leg.leg_number}: Route {leg.route_id}
                                  </span>
                                  <span style={{ color: '#94A3B8' }}>
                                    {leg.duration_mins}m ride ({leg.stops_count} stops)
                                  </span>
                                </div>
                                <div style={{ color: '#94A3B8', marginTop: '2px' }}>
                                  Board: <strong style={{ color: '#E2E8F0' }}>{leg.boarding_stop?.stop_name}</strong> ({leg.departure_time}) ➔ Alight: <strong style={{ color: '#E2E8F0' }}>{leg.alighting_stop?.stop_name}</strong> ({leg.arrival_time})
                                </div>
                                {route.transfers?.[legIdx] && (
                                  <div style={{ marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px dashed #233554', color: '#F59E0B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <span>🚶 Interchange: {route.transfers[legIdx].transfer_stop_name} • Wait {route.transfers[legIdx].waiting_time_mins} mins</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Crowd and Delay badges */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', background: '#0F1A33', border: '1px solid #233554', color: '#38BDF8', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            {getCrowdBadge(route)}
                          </span>
                          <span style={{ fontSize: '0.72rem', background: '#0F1A33', border: '1px solid #233554', color: '#F59E0B', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            +{getDelay(route)} min traffic delay
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ background: '#111C35', border: '1px dashed #233554', borderRadius: '12px', padding: '3rem 1.5rem', textAlign: 'center', color: '#94A3B8' }}>
                  <Bus size={36} style={{ margin: '0 auto 1rem auto', color: '#64748B' }} />
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#E2E8F0', marginBottom: '0.35rem' }}>
                    {searchResult ? 'No Direct or Transfer Routes Found' : 'No Routes Loaded'}
                  </div>
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>
                    {searchResult?.message || 'Enter origin and destination stops above and click "Find Routes".'}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* VIEW B: AIR QUALITY (AQI) MODULE (WORKING & TESTED) */}
      {activeModule === 'aqi' && (
        <div style={{ background: '#101B33', border: '1px solid #1E293B', borderRadius: '14px', padding: '1rem' }}>
          <AirQuality />
        </div>
      )}

      {/* VIEW C: TRAFFIC FLOW MODULE (ACTIVE & TESTED) */}
      {activeModule === 'traffic' && (
        <div style={{ background: '#101B33', border: '1px solid #1E293B', borderRadius: '14px', padding: '1rem' }}>
          <Traffic />
        </div>
      )}

      {/* VIEW D: WEATHER MODULE (ACTIVE & TESTED) */}
      {activeModule === 'weather' && (
        <div style={{ background: '#101B33', border: '1px solid #1E293B', borderRadius: '14px', padding: '1rem' }}>
          <Weather />
        </div>
      )}
    </div>
  );
}
