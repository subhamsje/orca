import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BaseMapId, LayerGroupState } from '../types/layer';
import {
  MapFeature,
  VesselFeature,
  VectorZoneFeature,
  H3CellFeature,
  RouteFeature,
  IncidentFeature,
} from '../types/feature';
import { VesselLayerRenderer } from './renderers/VesselLayerRenderer';
import { VectorPolygonRenderer } from './renderers/VectorPolygonRenderer';
import { H3GridLayerRenderer } from './renderers/H3GridLayerRenderer';
import { RouteLayerRenderer } from './renderers/RouteLayerRenderer';
import { IncidentLayerRenderer } from './renderers/IncidentLayerRenderer';

// Fix Leaflet Marker Icon Asset URLs (existing project quirk; safe to keep).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletMapContainerProps {
  center: [number, number];
  zoom: number;
  /** Monotonically increasing nonce; bump to request a programmatic flyTo. */
  flyToNonce: number;
  baseMapId: BaseMapId;
  layerState: LayerGroupState;
  features: ReadonlyArray<MapFeature>;
  selectedFeatureId: string | null;
  onSelectFeature: (feature: MapFeature) => void;
  onViewportChange?: (center: [number, number], zoom: number) => void;
}

const TILE_URLS: Record<BaseMapId, string> = {
  nautical_dark:
    'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png',
  satellite_esri:
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  osm_standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
};

interface ViewportControllerProps {
  center: [number, number];
  zoom: number;
  /**
   * Increments every time the *consumer* of the map (e.g. the workspace)
   * asks the map to recenter. We use this counter as the effect
   * dependency so that user-initiated pans never cause flyTo loops.
   */
  flyToNonce: number;
  onViewportChange?: (center: [number, number], zoom: number) => void;
}

const ViewportController: React.FC<ViewportControllerProps> = ({
  center,
  zoom,
  flyToNonce,
  onViewportChange,
}) => {
  const map = useMap();
  const mountedRef = useRef(false);

  // Programmatic focus: only runs when the consumer increments the nonce.
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      map.invalidateSize();
      map.setView(center, zoom, { animate: false });
      return;
    }
    map.flyTo(center, zoom, { duration: 0.6 });
  }, [flyToNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  // User pan/zoom: report up so the top bar can render the live
  // coordinates. Do NOT trigger another flyTo — that would loop.
  useEffect(() => {
    const handler = () => {
      const c = map.getCenter();
      const z = map.getZoom();
      onViewportChange?.([c.lat, c.lng], z);
    };
    map.on('moveend', handler);
    return () => {
      map.off('moveend', handler);
    };
  }, [map, onViewportChange]);

  return null;
};

export const LeafletMapContainer: React.FC<LeafletMapContainerProps> = ({
  center,
  zoom,
  flyToNonce,
  baseMapId,
  layerState,
  features,
  selectedFeatureId,
  onSelectFeature,
  onViewportChange,
}) => {
  const layersActive = layerState.layers;
  const vesselFeatures = features.filter(
    (f): f is VesselFeature =>
      f.type === 'VESSEL' && (layersActive['active_vessels']?.enabled ?? true),
  );

  const vectorZones = features.filter((f): f is VectorZoneFeature => {
    if (f.type === 'ZONE') {
      if (f.zoneType === 'PFZ_GROUND') return layersActive['pfz_grounds']?.enabled ?? true;
      if (f.zoneType === 'NAVAL_RESTRICTED') return layersActive['naval_zones']?.enabled ?? true;
      if (f.zoneType === 'MARINE_RESERVE') return layersActive['ocean_hazards']?.enabled ?? true;
      if (f.zoneType === 'ENVIRONMENTAL_HAZARD') return layersActive['ocean_hazards']?.enabled ?? true;
      return false;
    }
    if (f.type === 'IMBL') return layersActive['imbl_boundary']?.enabled ?? true;
    return false;
  });

  const h3Cells = features.filter(
    (f): f is H3CellFeature => f.type === 'H3_CELL' && (layersActive['h3_grid']?.enabled ?? true),
  );

  const routes = features.filter(
    (f): f is RouteFeature => f.type === 'ROUTE' && (layersActive['planned_route']?.enabled ?? true),
  );

  const incidents = features.filter(
    (f): f is IncidentFeature =>
      f.type === 'INCIDENT' && (layersActive['incidents_sar']?.enabled ?? true),
  );

  return (
    <div
      className="w-full h-full relative bg-ocean-975"
      aria-label="Marine operations map"
      role="region"
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: '100%', width: '100%', minHeight: '450px', background: '#021827' }}
      >
        <ViewportController
          center={center}
          zoom={zoom}
          flyToNonce={flyToNonce}
          onViewportChange={onViewportChange}
        />
        <TileLayer
          attribution='&copy; OpenStreetMap &copy; CARTO / Esri'
          url={TILE_URLS[baseMapId]}
        />
        <VectorPolygonRenderer
          zones={vectorZones}
          selectedFeatureId={selectedFeatureId}
          onSelectFeature={onSelectFeature}
        />
        <H3GridLayerRenderer
          cells={h3Cells}
          selectedFeatureId={selectedFeatureId}
          onSelectFeature={onSelectFeature}
        />
        <RouteLayerRenderer
          routes={routes}
          selectedFeatureId={selectedFeatureId}
          onSelectFeature={onSelectFeature}
        />
        <IncidentLayerRenderer
          incidents={incidents}
          selectedFeatureId={selectedFeatureId}
          onSelectFeature={onSelectFeature}
        />
        <VesselLayerRenderer
          vessels={vesselFeatures}
          selectedFeatureId={selectedFeatureId}
          onSelectFeature={onSelectFeature}
        />
      </MapContainer>
    </div>
  );
};