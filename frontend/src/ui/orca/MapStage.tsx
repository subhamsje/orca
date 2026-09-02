import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { TripAssessmentResponse } from '../../types';
import { HarborLocation } from '../../utils/harbors';

export interface MapStageHandle {
  flyTo: (lat: number, lon: number, zoom?: number) => void;
  flyToWaypoints: (waypoints: [number, number][]) => void;
}

interface MapStageProps {
  center: [number, number];
  zoom: number;
  flyNonce: number;
  assessment: TripAssessmentResponse | null;
  harbors: HarborLocation[];
  selectedHarborId: string | null;
  onViewportChange?: (center: [number, number], zoom: number) => void;
  onSelectHarbor?: (h: HarborLocation) => void;
}

const TILE_URL =
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

// Fix Leaflet default icon URLs
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapController = forwardRef<
  MapStageHandle,
  {
    center: [number, number];
    zoom: number;
    flyNonce: number;
    onViewportChange?: (center: [number, number], zoom: number) => void;
  }
>(({ center, zoom, flyNonce, onViewportChange }, ref) => {
  const map = useMap();
  const lastNonceRef = useRef(-1);

  useImperativeHandle(ref, () => ({
    flyTo: (lat: number, lon: number, z?: number) => {
      map.flyTo([lat, lon], z ?? map.getZoom(), { duration: 1.0 });
    },
    flyToWaypoints: (waypoints: [number, number][]) => {
      if (!waypoints.length) return;
      if (waypoints.length === 1) {
        map.flyTo(waypoints[0], Math.max(map.getZoom(), 9), { duration: 1.0 });
        return;
      }
      const bounds = L.latLngBounds(waypoints.map((w) => L.latLng(w[0], w[1])));
      map.flyToBounds(bounds, { duration: 1.1, padding: [60, 60], maxZoom: 11 });
    },
  }));

  useEffect(() => {
    if (lastNonceRef.current === flyNonce) return;
    lastNonceRef.current = flyNonce;
    map.flyTo(center, zoom, { duration: 0.9 });
  }, [flyNonce, center, zoom, map]);

  useEffect(() => {
    const handler = () => {
      const c = map.getCenter();
      onViewportChange?.([c.lat, c.lng], map.getZoom());
    };
    map.on('moveend', handler);
    return () => {
      map.off('moveend', handler);
    };
  }, [map, onViewportChange]);

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);

  return null;
});
MapController.displayName = 'MapController';

const MarkersLayer: React.FC<{
  harbors: HarborLocation[];
  selectedHarborId: string | null;
  assessment: TripAssessmentResponse | null;
  onSelectHarbor?: (h: HarborLocation) => void;
}> = ({ harbors, selectedHarborId, assessment, onSelectHarbor }) => {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    }
    const layer = layerRef.current;
    layer.clearLayers();

    harbors.forEach((h) => {
      const isSelected = h.id === selectedHarborId;
      const color = isSelected ? '#22d3ee' : '#7dd3fc';
      const html = `
        <div style="position:relative;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;">
          <div style="
            padding:3px 8px;
            background:${isSelected ? 'rgba(34,211,238,0.95)' : 'rgba(2,13,26,0.85)'};
            border:1px solid ${color};
            border-radius:6px;
            color:${isSelected ? '#020a14' : '#e2e8f0'};
            font-size:10px;
            font-weight:700;
            letter-spacing:0.04em;
            white-space:nowrap;
            backdrop-filter:blur(6px);
            box-shadow:0 0 12px -2px ${isSelected ? 'rgba(34,211,238,0.7)' : 'rgba(0,0,0,0.5)'};
          ">${h.name}</div>
          <div style="
            width:${isSelected ? '10px' : '7px'};
            height:${isSelected ? '10px' : '7px'};
            background:${color};
            border-radius:50%;
            box-shadow:0 0 ${isSelected ? '16px' : '8px'} ${color};
          "></div>
        </div>
      `;
      const marker = L.marker([h.lat, h.lon], {
        icon: L.divIcon({
          className: 'orca-marker',
          html,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
      });
      marker.on('click', () => onSelectHarbor?.(h));
      layer.addLayer(marker);
    });

    if (assessment) {
      assessment.pfz_grounds?.forEach((g) => {
        const color = g.hsi >= 75 ? '#10b981' : g.hsi >= 40 ? '#f59e0b' : '#ef4444';
        const ring = L.circle([g.coordinates[0], g.coordinates[1]], {
          radius: 4500,
          color,
          weight: 1.4,
          fillColor: color,
          fillOpacity: 0.18,
          dashArray: '3,4',
        });
        ring.bindPopup(
          `<div style="font-family:ui-sans-serif;font-size:11px;color:#020a14;line-height:1.4;">
            <strong>${g.name}</strong><br/>
            <span style="color:#0e7490">HSI ${g.hsi}</span> · ${g.distance_km.toFixed(1)} km<br/>
            ${g.likely_species.slice(0, 2).join(', ')}
          </div>`,
        );
        layer.addLayer(ring);
      });

      const wps = assessment.route?.waypoints ?? [];
      if (wps.length >= 2) {
        const glow = L.polyline(wps, {
          color: '#22d3ee',
          weight: 8,
          opacity: 0.18,
          lineCap: 'round',
        });
        layer.addLayer(glow);
        const line = L.polyline(wps, {
          color: '#22d3ee',
          weight: 3,
          opacity: 0.95,
          dashArray: '6,6',
          lineCap: 'round',
        });
        layer.addLayer(line);
      }

      const vesselIcon = L.divIcon({
        className: 'orca-marker',
        html: `
          <div style="position:relative;transform:translate(-50%,-50%);">
            <span style="
              position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
              width:34px;height:34px;border-radius:50%;
              background:rgba(34,211,238,0.18);
              animation:orca-pulse 1.8s ease-in-out infinite;
            "></span>
            <span style="
              position:relative;display:block;width:14px;height:14px;border-radius:50%;
              background:#22d3ee;border:2px solid #020a14;
              box-shadow:0 0 18px rgba(34,211,238,0.8);
            "></span>
          </div>
          <style>
            @keyframes orca-pulse {
              0%,100% { transform:translate(-50%,-50%) scale(0.6); opacity:0.2; }
              50%     { transform:translate(-50%,-50%) scale(1.3); opacity:0.65; }
            }
          </style>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      const vesselMarker = L.marker([assessment.coordinate.lat, assessment.coordinate.lon], {
        icon: vesselIcon,
        zIndexOffset: 1000,
      });
      vesselMarker.bindPopup(
        `<div style="font-family:ui-sans-serif;font-size:11px;color:#020a14;line-height:1.4;">
          <strong>${assessment.world_model?.vessel_twin.vessel_name ?? 'Active vessel'}</strong><br/>
          Risk ${assessment.risk_score}/100<br/>
          ${assessment.verdict}
        </div>`,
      );
      layer.addLayer(vesselMarker);
    }
  }, [map, harbors, selectedHarborId, assessment, onSelectHarbor]);

  return null;
};

export const MapStage = forwardRef<MapStageHandle, MapStageProps>(
  ({ center, zoom, flyNonce, assessment, harbors, selectedHarborId, onViewportChange, onSelectHarbor }, ref) => {
    return (
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        zoomControl={false}
        worldCopyJump
        style={{ height: '100%', width: '100%', background: '#020a14' }}
      >
        <MapController
          ref={ref}
          center={center}
          zoom={zoom}
          flyNonce={flyNonce}
          onViewportChange={onViewportChange}
        />
        <TileLayer attribution='&copy; OpenStreetMap &copy; CARTO' url={TILE_URL} />
        <MarkersLayer
          harbors={harbors}
          selectedHarborId={selectedHarborId}
          assessment={assessment}
          onSelectHarbor={onSelectHarbor}
        />
      </MapContainer>
    );
  },
);
MapStage.displayName = 'MapStage';