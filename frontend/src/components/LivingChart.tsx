import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TripAssessmentResponse } from '../types';
import { INDIAN_HARBORS, HarborLocation } from '../utils/harbors';
import { Navigation, Anchor, Layers } from 'lucide-react';

// Fix Leaflet Default Marker Icon Asset URLs for Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LivingChartProps {
  assessment: TripAssessmentResponse | null;
  onSelectHarbor?: (harbor: HarborLocation) => void;
}

// Component to handle dynamic map resizing and re-centering
const MapController: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.flyTo(center, 8, { duration: 1.2 });
  }, [center, map]);
  return null;
};

// Custom Leaflet Icons
const vesselIcon = L.divIcon({
  className: 'custom-vessel-icon',
  html: `<div class="bg-cyan-500 text-white p-2 rounded-full shadow-xl border-2 border-white animate-bounce"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const harborIcon = L.divIcon({
  className: 'custom-harbor-icon',
  html: `<div class="bg-amber-600 text-white p-1.5 rounded-lg shadow-md border border-amber-300"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22V2m-7 8h14m-12 5h10"/></svg></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export const LivingChart: React.FC<LivingChartProps> = ({ assessment, onSelectHarbor }) => {
  const [mapLayer, setMapLayer] = useState<'dark' | 'osm' | 'satellite'>('dark');

  const centerLat = assessment?.coordinate.lat || 15.5000;
  const centerLon = assessment?.coordinate.lon || 73.8300;

  const waypoints = assessment?.route.waypoints || [
    [centerLat, centerLon],
    [centerLat + 0.02, centerLon - 0.03],
    [centerLat + 0.05, centerLon - 0.07],
    [centerLat + 0.08, centerLon - 0.12],
  ];

  const getTileUrl = () => {
    if (mapLayer === 'satellite') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
    if (mapLayer === 'osm') {
      return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
    return 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png';
  };

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto">
      {/* Map Control Header */}
      <div className="bg-ocean-900 border border-ocean-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Navigation className="w-5 h-5 text-cyan-400" />
            <span>Nautical Living Canvas (12 Major Harbors & EEZ)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time ISRO Ocean Model Assimilation • H3 Hex Grid • Naval Range B-4 Buffer
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-ocean-950 p-1 rounded-xl border border-ocean-800 flex items-center space-x-1 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <button
              onClick={() => setMapLayer('dark')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                mapLayer === 'dark' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Nautical Dark
            </button>
            <button
              onClick={() => setMapLayer('satellite')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                mapLayer === 'satellite' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapLayer('osm')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                mapLayer === 'osm' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              OSM Standard
            </button>
          </div>
        </div>
      </div>

      {/* Main Leaflet Map Container */}
      <div className="bg-ocean-950 border border-ocean-800 rounded-2xl overflow-hidden shadow-2xl h-[550px] relative z-10">
        <MapContainer
          center={[centerLat, centerLon]}
          zoom={8}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', minHeight: '550px', background: '#021827' }}
        >
          <MapController center={[centerLat, centerLon]} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO / Esri'
            url={getTileUrl()}
          />

          {/* Render All 12 Major Indian Harbors */}
          {INDIAN_HARBORS.map((harbor) => (
            <Marker
              key={harbor.id}
              position={[harbor.lat, harbor.lon]}
              icon={harborIcon}
              eventHandlers={{
                click: () => onSelectHarbor && onSelectHarbor(harbor),
              }}
            >
              <Tooltip permanent={false} direction="top">
                <span className="font-bold text-xs">{harbor.name} ({harbor.state})</span>
              </Tooltip>
              <Popup>
                <div className="p-2 space-y-1">
                  <h4 className="font-bold text-sm text-amber-400">{harbor.name}</h4>
                  <p className="text-xs text-slate-300">{harbor.description}</p>
                  <p className="text-[11px] text-cyan-400 font-medium">State: {harbor.state} ({harbor.coast} Coast)</p>
                  <button
                    onClick={() => onSelectHarbor && onSelectHarbor(harbor)}
                    className="w-full mt-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-1.5 px-2 rounded-lg"
                  >
                    Select & Assess Trip
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Active Vessel Position Marker */}
          <Marker position={[centerLat, centerLon]} icon={vesselIcon}>
            <Popup>
              <div className="p-2">
                <h4 className="font-bold text-sm text-cyan-400">Active Vessel Location</h4>
                <p className="text-xs text-slate-300">Lat: {centerLat.toFixed(4)}, Lon: {centerLon.toFixed(4)}</p>
                <p className="text-xs font-semibold text-emerald-400 mt-1">
                  Verdict: {assessment?.verdict || 'MODERATE RISK'}
                </p>
              </div>
            </Popup>
          </Marker>

          {/* Ranked PFZ Fishing Grounds Circles */}
          {assessment?.pfz_grounds.map((ground, idx) => (
            <React.Fragment key={idx}>
              <Circle
                center={[ground.coordinates[0], ground.coordinates[1]]}
                radius={4500}
                pathOptions={{
                  color: idx === 0 ? '#10b981' : '#3b82f6',
                  fillColor: idx === 0 ? '#10b981' : '#3b82f6',
                  fillOpacity: 0.3,
                  weight: 2.5,
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-bold text-sm text-emerald-400">{ground.name}</h4>
                    <p className="text-xs text-slate-300">HSI Score: <strong>{ground.hsi}/100</strong></p>
                    <p className="text-xs text-slate-300">Target Species: {ground.likely_species.join(', ')}</p>
                    <p className="text-xs text-slate-400">Distance: {ground.distance_km} km</p>
                  </div>
                </Popup>
              </Circle>
            </React.Fragment>
          ))}

          {/* A* Detour Waypoints Route Line */}
          <Polyline
            positions={waypoints as [number, number][]}
            pathOptions={{ color: '#06b6d4', weight: 4, dashArray: '8, 8' }}
          />

          {/* Restricted Naval Range Area B-4 Zone */}
          <Circle
            center={[15.05, 73.35]}
            radius={8500}
            pathOptions={{
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: 0.2,
              weight: 2,
              dashArray: '6, 6',
            }}
          >
            <Tooltip permanent direction="center">
              <span className="text-[10px] font-bold text-red-400 uppercase">RESTRICTED NAVAL ZONE B-4</span>
            </Tooltip>
          </Circle>
        </MapContainer>
      </div>

      {/* Harbor Selector Bar */}
      <div className="bg-ocean-900 border border-ocean-800 rounded-2xl p-4 shadow-lg space-y-2">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
          <Anchor className="w-4 h-4 text-cyan-400" />
          <span>Quick Select Harbor Location:</span>
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {INDIAN_HARBORS.map((h) => (
            <button
              key={h.id}
              onClick={() => onSelectHarbor && onSelectHarbor(h)}
              className="bg-ocean-800 hover:bg-ocean-700 text-slate-200 border border-ocean-700 text-xs px-2.5 py-1 rounded-lg font-medium transition"
            >
              📍 {h.name.split(' ')[0]} ({h.state})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
