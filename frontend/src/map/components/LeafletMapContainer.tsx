import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BaseMapId, LayerGroupState } from '../types/layer';
import { MapFeature, VesselFeature, VectorZoneFeature, H3CellFeature, RouteFeature, IncidentFeature } from '../types/feature';
import { VesselLayerRenderer } from './renderers/VesselLayerRenderer';
import { VectorPolygonRenderer } from './renderers/VectorPolygonRenderer';
import { H3GridLayerRenderer } from './renderers/H3GridLayerRenderer';
import { RouteLayerRenderer } from './renderers/RouteLayerRenderer';
import { IncidentLayerRenderer } from './renderers/IncidentLayerRenderer';

// Fix Leaflet Marker Icon Asset URLs
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletMapContainerProps {
  center: [number, number];
  zoom: number;
  baseMapId: BaseMapId;
  layerState: LayerGroupState;
  features: MapFeature[];
  selectedFeatureId: string | null;
  onSelectFeature: (feature: MapFeature) => void;
  onViewportChange?: (center: [number, number], zoom: number) => void;
}

// Controller for dynamic flyTo and invalidateSize lifecycle
const MapViewportController: React.FC<{
  center: [number, number];
  zoom: number;
  onViewportChange?: (center: [number, number], zoom: number) => void;
}> = ({ center, zoom, onViewportChange }) => {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);

  useEffect(() => {
    const handleMoveEnd = () => {
      const c = map.getCenter();
      const z = map.getZoom();
      if (onViewportChange) {
        onViewportChange([c.lat, c.lng], z);
      }
    };
    map.on('moveend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, onViewportChange]);

  return null;
};

export const LeafletMapContainer: React.FC<LeafletMapContainerProps> = ({
  center,
  zoom,
  baseMapId,
  layerState,
  features,
  selectedFeatureId,
  onSelectFeature,
  onViewportChange,
}) => {
  const getTileUrl = () => {
    if (baseMapId === 'satellite_esri') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
    if (baseMapId === 'osm_standard') {
      return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
    return 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png';
  };

  // Filter features based on layer toggle configuration
  const vesselFeatures = features.filter(
    (f): f is VesselFeature => f.type === 'VESSEL' && (layerState.layers['active_vessels']?.enabled ?? true)
  );

  const vectorZones = features.filter(
    (f): f is VectorZoneFeature =>
      (f.type === 'ZONE' || f.type === 'IMBL') &&
      ((f.type === 'IMBL' && (layerState.layers['imbl_boundary']?.enabled ?? true)) ||
        (f.zoneType === 'NAVAL_RESTRICTED' && (layerState.layers['naval_zones']?.enabled ?? true)) ||
        (f.zoneType === 'PFZ_GROUND' && (layerState.layers['pfz_grounds']?.enabled ?? true)) ||
        (f.zoneType === 'MARINE_RESERVE' && (layerState.layers['ocean_hazards']?.enabled ?? true)))
  );

  const h3Cells = features.filter(
    (f): f is H3CellFeature => f.type === 'H3_CELL' && (layerState.layers['h3_grid']?.enabled ?? true)
  );

  const routes = features.filter(
    (f): f is RouteFeature => f.type === 'ROUTE' && (layerState.layers['planned_route']?.enabled ?? true)
  );

  const incidents = features.filter(
    (f): f is IncidentFeature => f.type === 'INCIDENT' && (layerState.layers['incidents_sar']?.enabled ?? true)
  );

  return (
    <div className="w-full h-full relative overflow-hidden bg-ocean-950">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', minHeight: '450px', background: '#021827' }}
      >
        <MapViewportController center={center} zoom={zoom} onViewportChange={onViewportChange} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO / Esri'
          url={getTileUrl()}
        />

        {/* Layer Renderers */}
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
