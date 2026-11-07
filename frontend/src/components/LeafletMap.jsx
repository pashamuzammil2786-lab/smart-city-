import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom HTML DivIcons to prevent any 404 asset bundling bugs in Vite
const userLocationIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div style="background-color: #38BDF8; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 10px rgba(56, 189, 248, 0.9);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const originIcon = L.divIcon({
  className: 'custom-origin-marker',
  html: `<div style="background-color: #10B981; width: 24px; height: 24px; border-radius: 50%; border: 3px solid #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #fff; box-shadow: 0 0 12px rgba(16, 185, 129, 0.8);">A</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const destIcon = L.divIcon({
  className: 'custom-dest-marker',
  html: `<div style="background-color: #EF4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #fff; box-shadow: 0 0 12px rgba(239, 68, 68, 0.8);">B</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const intermediateStopIcon = L.divIcon({
  className: 'custom-stop-marker',
  html: `<div style="background-color: #3B82F6; width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid #fff;"></div>`,
  iconSize: [8, 8],
  iconAnchor: [4, 4]
});

// Dynamic map view updater
function MapBoundsUpdater({ origin, destination, intermediateStops, userLoc }) {
  const map = useMap();

  useEffect(() => {
    const points = [];
    if (origin && origin.stop_lat && origin.stop_lon) {
      points.push([origin.stop_lat, origin.stop_lon]);
    }
    if (destination && destination.stop_lat && destination.stop_lon) {
      points.push([destination.stop_lat, destination.stop_lon]);
    }
    if (intermediateStops && intermediateStops.length > 0) {
      intermediateStops.forEach((s) => {
        if (s.stop_lat && s.stop_lon) points.push([s.stop_lat, s.stop_lon]);
      });
    }
    if (userLoc && userLoc.lat && userLoc.lon && points.length === 0) {
      points.push([userLoc.lat, userLoc.lon]);
    }

    if (points.length === 1) {
      map.setView(points[0], 14, { animate: true });
    } else if (points.length >= 2) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], animate: true });
    }
  }, [origin, destination, intermediateStops, userLoc, map]);

  return null;
}

export default function LeafletMap({ origin, destination, intermediateStops = [], selectedRoute = null, userLoc }) {
  // Default Hyderabad Center (Charminar / Koti)
  const defaultCenter = [17.3850, 78.4867];
  const defaultZoom = 12;

  // Build Polyline coordinates
  let polylineCoords = [];
  if (intermediateStops && intermediateStops.length > 1) {
    polylineCoords = intermediateStops
      .filter((s) => s.stop_lat && s.stop_lon)
      .map((s) => [s.stop_lat, s.stop_lon]);
  } else if (origin && origin.stop_lat && destination && destination.stop_lat) {
    polylineCoords = [
      [origin.stop_lat, origin.stop_lon],
      [destination.stop_lat, destination.stop_lon]
    ];
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        style={{ height: '380px', width: '100%', borderRadius: '10px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsUpdater
          origin={origin}
          destination={destination}
          intermediateStops={intermediateStops}
          userLoc={userLoc}
        />

        {/* User GPS Location Marker */}
        {userLoc && userLoc.lat && (
          <Marker position={[userLoc.lat, userLoc.lon]} icon={userLocationIcon}>
            <Popup>
              <strong>Your Current GPS Position</strong>
              <br />
              {userLoc.lat.toFixed(4)}, {userLoc.lon.toFixed(4)}
            </Popup>
          </Marker>
        )}

        {/* Origin Marker */}
        {origin && origin.stop_lat && (
          <Marker position={[origin.stop_lat, origin.stop_lon]} icon={originIcon}>
            <Popup>
              <strong>Origin: {origin.stop_name}</strong>
              <br />
              Zone: {origin.zone_id || 'TSRTC Hyderabad'}
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination && destination.stop_lat && (
          <Marker position={[destination.stop_lat, destination.stop_lon]} icon={destIcon}>
            <Popup>
              <strong>Destination: {destination.stop_name}</strong>
              <br />
              Zone: {destination.zone_id || 'TSRTC Hyderabad'}
            </Popup>
          </Marker>
        )}

        {/* Intermediate Stop Markers if a specific route is expanded */}
        {intermediateStops &&
          intermediateStops.map((s, idx) => {
            if (!s.stop_lat || !s.stop_lon) return null;
            return (
              <Marker
                key={s.stop_id || idx}
                position={[s.stop_lat, s.stop_lon]}
                icon={intermediateStopIcon}
              >
                <Popup>
                  <strong>{s.stop_name}</strong>
                  <br />
                  Stop #{s.stop_sequence} • Departure: {s.departure_time || '--'}
                </Popup>
              </Marker>
            );
          })}

        {/* Route Connecting Line */}
        {polylineCoords.length >= 2 && (
          <Polyline
            positions={polylineCoords}
            color="#3B82F6"
            weight={4}
            opacity={0.85}
            dashArray={intermediateStops.length > 0 ? null : '6, 8'}
          />
        )}
      </MapContainer>

      {/* Floating Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          background: 'rgba(11, 19, 43, 0.92)',
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: '0.72rem',
          display: 'flex',
          gap: '10px',
          zIndex: 1000,
          border: '1px solid #233554',
          backdropFilter: 'blur(6px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
          <span>Origin (A)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }}></span>
          <span>Dest (B)</span>
        </div>
        {selectedRoute && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '14px', height: '3px', background: '#3B82F6', display: 'inline-block' }}></span>
            <span>Route Line</span>
          </div>
        )}
      </div>
    </div>
  );
}
