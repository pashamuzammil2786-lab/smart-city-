import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import LeafletMap from '../components/LeafletMap';
import {
  Bus,
  MapPin,
  Navigation,
  Clock,
  AlertTriangle,
  Users,
  Search,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ArrowLeftRight,
  Sparkles,
  ShieldCheck,
  Layers,
  Info
} from 'lucide-react';

export default function Transport({ user }) {
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

  // Live Machine Learning Demand Forecast State
  const [demandForecast, setDemandForecast] = useState(null);
  const [demandLoading, setDemandLoading] = useState(false);
  const [demandError, setDemandError] = useState('');

  // Auto-search default corridor on initial mount and load ML demand
  useEffect(() => {
    executeSearch('Charminar', 'Afzalgunj');
    loadDemandForecast();
  }, []);

  async function loadDemandForecast(days = 7) {
    setDemandLoading(true);
    setDemandError('');
    try {
      const data = await api.getForecast(days);
      setDemandForecast(data);
    } catch (err) {
      setDemandError('Could not load live transit demand forecast: ' + err.message);
    } finally {
      setDemandLoading(false);
    }
  }

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
    setSelectedRoute(null);
    setIntermediateStops([]);

    try {
      const data = await api.getRoutes(origToUse, destToUse);
      setSearchResult(data);

      // Auto-select recommended route if available
      if (data.options && data.options.length > 0) {
        const best = data.options[0];
        setSelectedRoute(best);
        fetchRouteStops(best.trip_id, best.route_id);
      }
    } catch (err) {
      setError(err.message || 'Failed to query bus routes.');
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch intermediate stops for a selected route to plot on map
  const fetchRouteStops = async (trip_id, route_id) => {
    try {
      setStopsLoading(true);
      const data = await api.getRouteStops(trip_id, route_id);
      setIntermediateStops(data.stops || []);
    } catch (e) {
      setIntermediateStops([]);
    } finally {
      setStopsLoading(false);
    }
  };

  const handleSelectRoute = (route) => {
    setSelectedRoute(route);
    fetchRouteStops(route.trip_id, route.route_id);
  };

  const handleCorridorClick = (orig, dest) => {
    setOrigin(orig);
    setDestination(dest);
    executeSearch(orig, dest);
  };

  // Summary Metrics calculations
  const recommendedRoute = searchResult?.options?.[0] || null;
  const activeRoute = selectedRoute || recommendedRoute;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* ========================================================================= */}
      {/* SECTION A: WELCOME HEADER                                                 */}
      {/* ========================================================================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #1E293B', paddingBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#1E293B', border: '1px solid #334155', padding: '0.2rem 0.55rem', borderRadius: '4px', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
            <Bus size={13} color="#3B82F6" />
            <span>HYDERABAD PUBLIC TRANSIT PLATFORM</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.02em', margin: 0 }}>
            Public Transit & Route Analytics
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '0.35rem', maxWidth: '680px', lineHeight: 1.5 }}>
            GTFS-based timetable route planning with multi-leg transfer calculation and machine-learning passenger demand forecasting.
          </p>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#1E293B',
            border: '1px solid #334155',
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            color: '#E2E8F0',
            fontSize: '0.8rem',
            fontWeight: 600
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
          <span>GTFS Schedule & Transfer Engine Active</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION B & D: ROUTE SEARCH FORM (LEFT) & INTERACTIVE MAP (RIGHT)         */}
      {/* ========================================================================= */}
      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left Column: Search Form */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
              <Navigation size={18} color="#3B82F6" />
              <span>Route Search</span>
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>5,028 Verified Stops</span>
          </div>

          {/* Origin Input */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>
                Origin Bus Stop
              </label>
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={geoLoading}
                style={{ background: 'none', border: 'none', color: '#38BDF8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <MapPin size={12} />
                <span>{geoLoading ? 'Detecting...' : 'Use My GPS Location'}</span>
              </button>
            </div>

            <input
              type="text"
              className="form-input"
              placeholder="e.g. Charminar, Secunderabad, Koti..."
              value={origin}
              onChange={(e) => handleOriginChange(e.target.value)}
              onFocus={() => origin.length >= 2 && setShowOriginSugg(true)}
            />

            {/* Origin Dropdown Autocomplete */}
            {showOriginSugg && originSuggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#0F1A33',
                  border: '1px solid #233554',
                  borderRadius: '8px',
                  marginTop: '4px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  zIndex: 2000,
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
                    style={{ padding: '0.55rem 0.85rem', borderBottom: '1px solid #1E2E4A', cursor: 'pointer', fontSize: '0.85rem', color: '#E2E8F0' }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1C2E52')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <strong>{s.stop_name}</strong>
                    {s.zone_id && <span style={{ color: '#94A3B8', fontSize: '0.75rem', marginLeft: '6px' }}>({s.zone_id})</span>}
                  </div>
                ))}
              </div>
            )}

            {geoMessage && (
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                {geoMessage}
              </p>
            )}
          </div>

          {/* Swap Button */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0' }}>
            <button
              type="button"
              onClick={handleSwap}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem', borderRadius: '6px', background: '#1E293B', border: '1px solid #334155', color: '#CBD5E1' }}
              title="Swap Origin and Destination"
            >
              <ArrowLeftRight size={13} />
              <span>Swap Origin & Destination</span>
            </button>
          </div>

          {/* Destination Input */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem', color: '#CBD5E1' }}>
              Destination Bus Stop
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Afzalgunj, Mehdipatnam, Dilsukhnagar..."
              value={destination}
              onChange={(e) => handleDestChange(e.target.value)}
              onFocus={() => destination.length >= 2 && setShowDestSugg(true)}
            />

            {/* Destination Dropdown Autocomplete */}
            {showDestSugg && destSuggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#0F1A33',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  marginTop: '4px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  zIndex: 2000,
                  boxShadow: '0 8px 20px rgba(0,0,0,0.4)'
                }}
              >
                {destSuggestions.map((s) => (
                  <div
                    key={s.stop_id}
                    onClick={() => {
                      setDestination(s.stop_name);
                      setShowDestSugg(false);
                    }}
                    style={{ padding: '0.55rem 0.85rem', borderBottom: '1px solid #1E293B', cursor: 'pointer', fontSize: '0.85rem', color: '#E2E8F0' }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <strong>{s.stop_name}</strong>
                    {s.zone_id && <span style={{ color: '#94A3B8', fontSize: '0.75rem', marginLeft: '6px' }}>({s.zone_id})</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Search Button */}
          <button
            type="button"
            onClick={() => executeSearch(origin, destination)}
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.2rem', borderRadius: '6px', fontWeight: 600 }}
          >
            {loading ? 'Searching Timetable Network...' : 'Find Transit Routes'}
            <Search size={16} />
          </button>

          {/* Popular Corridors Chips */}
          <div style={{ paddingTop: '0.65rem', borderTop: '1px solid #1E293B' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '0.45rem', fontWeight: 600 }}>
              Quick Corridor Tests:
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleCorridorClick('Charminar', 'Afzalgunj')}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', background: '#1E293B', border: '1px solid #334155', color: '#CBD5E1' }}
              >
                Charminar → Afzalgunj
              </button>
              <button
                type="button"
                onClick={() => handleCorridorClick('Mehdipatnam', 'Dondanpally')}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', background: '#1E293B', border: '1px solid #334155', color: '#CBD5E1' }}
              >
                Mehdipatnam → Dondanpally
              </button>
              <button
                type="button"
                onClick={() => handleCorridorClick('Shaikpet', 'ISB')}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', background: '#1E293B', border: '1px solid #334155', color: '#CBD5E1' }}
              >
                Shaikpet → ISB
              </button>
              <button
                type="button"
                onClick={() => handleCorridorClick('Secunderabad', 'Mehdipatnam')}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', background: '#1E293B', border: '1px solid #334155', color: '#CBD5E1' }}
              >
                Secunderabad → Mehdipatnam
              </button>
              <button
                type="button"
                onClick={() => handleCorridorClick('Koti', 'Dilsukhnagar')}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', background: '#1E293B', border: '1px solid #334155', color: '#CBD5E1' }}
              >
                Koti → Dilsukhnagar
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Map */}
        <div className="card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fff' }}>
              <MapPin size={16} color="#10B981" />
              <span>Hyderabad Transit Map</span>
            </h2>

            {searchResult?.direct_distance_km && (
              <span className="badge badge-teal">
                ~{searchResult.direct_distance_km} km distance
              </span>
            )}
          </div>

          <LeafletMap
            origin={searchResult?.origin}
            destination={searchResult?.destination}
            intermediateStops={intermediateStops}
            selectedRoute={activeRoute}
            userLoc={userLoc}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION C: 4 TRANSPORT SUMMARY CARDS                                      */}
      {/* ========================================================================= */}
      <div>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', color: '#F8FAFC' }}>
          Transit Journey & Prediction Summary
        </h2>
        <div className="grid-4">
          {/* Card 1: Available Routes */}
          <div className="card" style={{ background: '#111C35', border: '1px solid #1E293B', padding: '1rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Direct Routes Available
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: searchResult ? '#38BDF8' : '#64748B' }}>
              {searchResult ? `${searchResult.total_routes_found} Line${searchResult.total_routes_found === 1 ? '' : 's'}` : '--'}
            </div>
            <p style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.25rem', margin: 0 }}>
              {searchResult ? `Filtered top ${searchResult.displayed_options_count} scheduled options` : 'Search for a route to view options'}
            </p>
          </div>

          {/* Card 2: Estimated Duration */}
          <div className="card" style={{ background: '#111C35', border: '1px solid #1E293B', padding: '1rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Estimated Duration
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: activeRoute ? '#34D399' : '#64748B' }}>
              {activeRoute ? `${activeRoute.total_estimated_travel_time_mins} mins` : '--'}
            </div>
            <p style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.25rem', margin: 0 }}>
              {activeRoute ? `${activeRoute.duration_source || 'Scheduled Timetable'} • ${activeRoute.stops_count || 0} stops` : 'Select a route to view duration'}
            </p>
          </div>

          {/* Card 3: Predicted Delay */}
          <div className="card" style={{ background: '#111C35', border: '1px solid #1E293B', padding: '1rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Traffic Delay Adjustment
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: activeRoute ? (activeRoute.expected_delay_mins > 3 ? '#FBBF24' : '#34D399') : '#64748B' }}>
              {activeRoute ? `+${activeRoute.expected_delay_mins} mins` : '--'}
            </div>
            <p style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.25rem', margin: 0 }}>
              {activeRoute ? activeRoute.traffic_condition : 'Traffic friction heuristic based on hour'}
            </p>
          </div>

          {/* Card 4: Bus Crowding Level */}
          <div className="card" style={{ background: '#111C35', border: '1px solid #1E293B', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Occupancy Heuristic
              </span>
              <span style={{ fontSize: '0.65rem', background: '#1E293B', color: '#94A3B8', padding: '1px 6px', borderRadius: '3px' }}>
                Hourly
              </span>
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: activeRoute ? '#93C5FD' : '#64748B' }}>
              {activeRoute ? activeRoute.crowd_level : '--'}
            </div>
            <p style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.25rem', margin: 0 }}>
              {activeRoute ? activeRoute.crowd_badge : 'Departure-hour occupancy heuristic'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION D: MACHINE LEARNING TRANSIT DEMAND FORECAST (RANDOM FOREST)       */}
      {/* ========================================================================= */}
      <div style={{ background: '#111C35', border: '1px solid #1E293B', borderRadius: '8px', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <TrendingUp size={16} color="#38BDF8" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                Metropolitan Transit Passenger Demand Forecast
              </h3>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, background: '#1E293B', color: '#38BDF8', border: '1px solid #334155', padding: '2px 8px', borderRadius: '4px' }}>
                Random Forest Regressor • R² = 0.641
              </span>
            </div>
            <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: '0.25rem 0 0 0' }}>
              Multi-day recursive lag forecast predicting total daily network ridership across TSRTC routes.
            </p>
          </div>

          <button
            onClick={() => loadDemandForecast(7)}
            disabled={demandLoading}
            style={{
              background: '#0B132B',
              border: '1px solid #334155',
              color: '#38BDF8',
              padding: '0.35rem 0.75rem',
              borderRadius: '4px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Sparkles size={13} />
            <span>{demandLoading ? 'Predicting...' : 'Refresh ML Forecast'}</span>
          </button>
        </div>

        {demandLoading && (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94A3B8', fontSize: '0.85rem' }}>
            <span className="spin" style={{ display: 'inline-block', marginRight: '0.5rem' }}>⏳</span>
            Executing Random Forest Regressor multi-day recursive forecast...
          </div>
        )}

        {demandError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '0.65rem 0.85rem', borderRadius: '6px', color: '#F87171', fontSize: '0.8rem' }}>
            {demandError}
          </div>
        )}

        {demandForecast && demandForecast.forecast && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '0.75rem', marginBottom: '0.85rem' }}>
              {demandForecast.forecast.map((day, idx) => {
                const isWeekend = day.day_type !== 'Weekday';
                return (
                  <div
                    key={idx}
                    style={{
                      background: '#0B132B',
                      border: '1px solid #1E293B',
                      borderRadius: '6px',
                      padding: '0.75rem 0.65rem',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', fontWeight: 600 }}>
                      {day.day_name}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block', marginBottom: '0.35rem' }}>
                      {day.date}
                    </span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: isWeekend ? '#FBBF24' : '#34D399' }}>
                      {day.predicted_total_ridership?.toLocaleString()}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#94A3B8', display: 'block', marginTop: '0.15rem' }}>
                      rides / day
                    </span>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '0.35rem',
                        fontSize: '0.62rem',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        background: isWeekend ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        color: isWeekend ? '#FCD34D' : '#6EE7B7'
                      }}
                    >
                      {day.day_type}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid #1E293B', paddingTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: '#64748B' }}>
              <span>
                Target: <strong>total_rides</strong> • Horizon: <strong>{demandForecast.prediction_horizon || demandForecast.forecast_horizon}</strong> • Split: <strong>80/20 Chronological</strong>
              </span>
              <span style={{ color: '#94A3B8' }}>
                Note: Travel durations are calculated from GTFS timetables independently of network ridership volume.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.85rem 1rem', borderRadius: '8px', color: '#F87171', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <AlertTriangle size={18} />
          <span style={{ fontSize: '0.88rem' }}>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION E: ROUTE RESULTS CARDS & SELECTION                                */}
      {/* ========================================================================= */}
      {searchResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                Available Transit Routes ({searchResult.total_routes_found})
              </h2>
              <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                Public transit itineraries connecting <strong>{searchResult.origin?.stop_name}</strong> → <strong>{searchResult.destination?.stop_name}</strong>
              </p>
            </div>
          </div>

          {searchResult.total_routes_found === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <AlertTriangle size={36} color="#F59E0B" style={{ margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem', color: '#fff' }}>No Routes Found</h3>
              <p style={{ color: '#94A3B8', maxWidth: '520px', margin: '0 auto', fontSize: '0.88rem' }}>
                {searchResult.message || 'No direct or single-transfer bus line connects these two stops in the current schedule.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {searchResult.options.map((opt) => {
                const isSelected = selectedRoute?.trip_id === opt.trip_id;
                const isRecommended = opt.is_recommended;
                const isTransfer = opt.transfers_count > 0 || opt.journey_type === 'transfer';

                return (
                  <div
                    key={opt.trip_id || opt.route_id}
                    className="card"
                    style={{
                      borderColor: isSelected ? '#3B82F6' : '#1E293B',
                      background: '#111C35',
                      borderRadius: '8px',
                      padding: '1.25rem',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F8FAFC' }}>
                            {opt.route_name}
                          </span>
                          {isRecommended && (
                            <span style={{ fontSize: '0.72rem', background: 'rgba(37, 99, 235, 0.15)', border: '1px solid #2563EB', color: '#93C5FD', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              Recommended Option
                            </span>
                          )}
                          <span className="badge badge-info" style={{ borderRadius: '4px', fontSize: '0.72rem' }}>
                            {isTransfer ? (opt.num_transfers === 2 ? '2 Transfers' : '1 Transfer') : `ID: ${opt.route_id}`}
                          </span>
                          {isTransfer && (
                            <span style={{ fontSize: '0.72rem', background: '#1E293B', color: '#CBD5E1', border: '1px solid #334155', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              via {opt.transfers?.map(t => t.transfer_stop_name).join(' → ') || 'Interchange'}
                            </span>
                          )}
                          <span style={{
                            fontSize: '0.70rem',
                            background: '#1E293B',
                            color: '#94A3B8',
                            border: '1px solid #334155',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontWeight: 600
                          }}>
                            {opt.duration_source === 'Scheduled Timetable' ? 'Timetable Schedule' : 'Calibrated Transit Model'}
                          </span>
                        </div>
                        {opt.trip_title && (
                          <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: 0 }}>
                            {opt.trip_title}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span
                          className={`badge ${
                            opt.crowd_level === 'High'
                              ? 'badge-danger'
                              : opt.crowd_level === 'Moderate'
                              ? 'badge-warning'
                              : 'badge-success'
                          }`}
                          style={{ borderRadius: '4px' }}
                        >
                          <Users size={12} />
                          <span>{opt.crowd_badge}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleSelectRoute(opt)}
                          className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem', borderRadius: '4px', fontWeight: 600 }}
                        >
                          {isSelected ? 'Selected on Map' : 'Select Route'}
                        </button>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid-4" style={{ marginBottom: '1rem', gap: '0.75rem' }}>
                      <div style={{ background: '#0F172A', padding: '0.75rem', borderRadius: '6px', border: '1px solid #1E293B' }}>
                        <span style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Departure → Arrival
                        </span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC' }}>
                          {opt.departure_time || opt.next_departure_time} → {opt.arrival_time || opt.scheduled_arrival_time}
                        </span>
                      </div>

                      <div style={{ background: '#0F172A', padding: '0.75rem', borderRadius: '6px', border: '1px solid #1E293B' }}>
                        <span style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Scheduled Duration
                        </span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC' }}>
                          {opt.scheduled_duration_mins} mins
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block', marginTop: '2px' }}>
                          {isTransfer ? `(${opt.in_vehicle_duration_mins}m ride + ${opt.transfer_waiting_mins}m wait)` : `(${opt.stops_count} intermediate stops)`}
                        </span>
                      </div>

                      <div style={{ background: '#0F172A', padding: '0.75rem', borderRadius: '6px', border: '1px solid #1E293B' }}>
                        <span style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Predicted Delay
                        </span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: opt.expected_delay_mins > 3 ? '#FBBF24' : '#34D399' }}>
                          +{opt.expected_delay_mins} mins
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block', marginTop: '2px' }}>
                          {opt.traffic_condition}
                        </span>
                      </div>

                      <div style={{ background: '#0F172A', padding: '0.75rem', borderRadius: '6px', border: '1px solid #334155' }}>
                        <span style={{ fontSize: '0.7rem', color: '#38BDF8', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Total Estimated Time
                        </span>
                        <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC' }}>
                          {opt.total_estimated_travel_time_mins} mins
                        </span>
                      </div>
                    </div>

                    {/* Ordered Leg Breakdown for Multi-Leg Journeys */}
                    {opt.legs && opt.legs.length > 1 && (
                      <div style={{ margin: '0.75rem 0', padding: '0.75rem', background: '#0F172A', borderRadius: '6px', border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Transit Itinerary Legs
                        </span>
                        {opt.legs.map((leg, legIdx) => (
                          <div key={legIdx} style={{ fontSize: '0.8rem', color: '#CBD5E1', borderLeft: '2px solid #3B82F6', paddingLeft: '0.65rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: 700, color: '#F8FAFC' }}>
                                Leg {leg.leg_number}: Line {leg.route_id}
                              </span>
                              <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                                {leg.duration_mins}m ride ({leg.stops_count} stops)
                              </span>
                            </div>
                            <div style={{ color: '#94A3B8', marginTop: '2px', fontSize: '0.75rem' }}>
                              Board: <strong style={{ color: '#E2E8F0' }}>{leg.boarding_stop?.stop_name}</strong> ({leg.departure_time}) ➔ Alight: <strong style={{ color: '#E2E8F0' }}>{leg.alighting_stop?.stop_name}</strong> ({leg.arrival_time})
                            </div>
                            {opt.transfers?.[legIdx] && (
                              <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid #1E293B', color: '#FCD34D', fontWeight: 600, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span>Interchange: {opt.transfers[legIdx].transfer_stop_name} • Transfer Wait {opt.transfers[legIdx].waiting_time_mins} mins</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upcoming Timetables */}
                    {opt.upcoming_timings && opt.upcoming_timings.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', fontSize: '0.75rem', color: '#94A3B8', borderTop: '1px solid #1E293B', paddingTop: '0.65rem' }}>
                        <Clock size={12} />
                        <span>Upcoming departures:</span>
                        {opt.upcoming_timings.map((t, tidx) => (
                          <span
                            key={tidx}
                            style={{ background: '#0F172A', padding: '0.15rem 0.45rem', borderRadius: '3px', color: '#CBD5E1', fontSize: '0.72rem', border: '1px solid #1E293B' }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
