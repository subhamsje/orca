import React, { useState, useEffect } from 'react';
import { TripAssessmentResponse } from '../../types';
import { BaseMapId, LayerGroupState, DEFAULT_MAP_LAYERS } from '../types/layer';
import { MapFeature } from '../types/feature';
import { convertTripAssessmentToMapFeatures } from '../adapters/featureAdapter';
import { DEMO_SIMULATION_FEATURES } from '../fixtures/devFixtures';
import { LeafletMapContainer } from './LeafletMapContainer';
import { MapTopBar } from './MapTopBar';
import { MapLayerControl } from './MapLayerControl';
import { MapFloatingControls } from './MapFloatingControls';
import { FeatureDetailDrawer } from './FeatureDetailDrawer';
import { HarborLocation } from '../../utils/harbors';
import { LoadingState } from '../../ui/LoadingState';
import { EmptyState } from '../../ui/EmptyState';
import { Layers } from 'lucide-react';

interface MarineMapWorkspaceProps {
  assessment: TripAssessmentResponse | null;
  isLoading?: boolean;
  onSelectHarbor?: (harbor: HarborLocation) => void;
}

export const MarineMapWorkspace: React.FC<MarineMapWorkspaceProps> = ({
  assessment,
  isLoading = false,
  onSelectHarbor,
}) => {
  const initialCenter: [number, number] = assessment
    ? [assessment.coordinate.lat, assessment.coordinate.lon]
    : [15.5000, 73.8300];

  const [center, setCenter] = useState<[number, number]>(initialCenter);
  const [zoom, setZoom] = useState<number>(8);
  const [isLayerControlOpen, setIsLayerControlOpen] = useState<boolean>(false);
  const [selectedFeature, setSelectedFeature] = useState<MapFeature | null>(null);

  const [layerState, setLayerState] = useState<LayerGroupState>({
    baseMapId: 'nautical_dark',
    layers: DEFAULT_MAP_LAYERS,
  });

  useEffect(() => {
    if (assessment) {
      setCenter([assessment.coordinate.lat, assessment.coordinate.lon]);
    }
  }, [assessment]);

  // Combine live converted backend features + clearly marked development fixtures
  const liveFeatures = convertTripAssessmentToMapFeatures(assessment);
  const allFeatures: MapFeature[] = [...liveFeatures, ...DEMO_SIMULATION_FEATURES];

  const activeLayersCount = Object.values(layerState.layers).filter((l) => l.enabled).length;

  const handleSelectBaseMap = (baseMapId: BaseMapId) => {
    setLayerState((prev) => ({ ...prev, baseMapId }));
  };

  const handleToggleLayer = (layerId: string) => {
    setLayerState((prev) => {
      const current = prev.layers[layerId];
      if (!current) return prev;
      return {
        ...prev,
        layers: {
          ...prev.layers,
          [layerId]: { ...current, enabled: !current.enabled },
        },
      };
    });
  };

  const handleSearch = (query: string) => {
    // Coordinate search (e.g. "16.02, 73.48")
    const parts = query.split(',').map((p) => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      setCenter([parts[0], parts[1]]);
      setZoom(10);
      return;
    }

    // Feature name search
    const found = allFeatures.find((f) => f.name.toLowerCase().includes(query.toLowerCase()));
    if (found) {
      setSelectedFeature(found);
      setCenter(found.position);
      setZoom(10);
    }
  };

  const handleFitBounds = () => {
    if (allFeatures.length > 0) {
      setCenter(allFeatures[0].position);
      setZoom(8);
    }
  };

  return (
    <div className="w-full flex flex-col rounded-2xl overflow-hidden border border-ocean-800 bg-ocean-950 shadow-2xl relative h-[650px] md:h-[700px]">
      {/* Top Search & Status Bar */}
      <MapTopBar
        center={center}
        zoom={zoom}
        activeLayersCount={activeLayersCount}
        isOnline={navigator.onLine}
        freshness="LIVE"
        onSearch={handleSearch}
        onSelectHarbor={(h) => {
          if (onSelectHarbor) onSelectHarbor(h);
          setCenter([h.lat, h.lon]);
          setZoom(9);
        }}
        onRecenter={() => setCenter(initialCenter)}
      />

      {/* Floating Layer Controls Panel */}
      <MapLayerControl
        layerState={layerState}
        isOpen={isLayerControlOpen}
        onClose={() => setIsLayerControlOpen(false)}
        onSelectBaseMap={handleSelectBaseMap}
        onToggleLayer={handleToggleLayer}
      />

      {/* Floating Action Controls (+, -, Fit, Recenter) */}
      <MapFloatingControls
        onZoomIn={() => setZoom((z) => Math.min(z + 1, 18))}
        onZoomOut={() => setZoom((z) => Math.max(z - 1, 3))}
        onFitBounds={handleFitBounds}
        onRecenter={() => setCenter(initialCenter)}
        onToggleLayerControl={() => setIsLayerControlOpen((open) => !open)}
        isLayerControlOpen={isLayerControlOpen}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-[1100] bg-ocean-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <LoadingState
            variant="panel"
            label="Assimilating Geospatial Layers & ISRO Ocean Models…"
            description="Processing SST rasters, H3 spatial grid, and A* detour waypoints"
          />
        </div>
      )}

      {/* Empty State Overlay when all layers disabled */}
      {activeLayersCount === 0 && !isLoading && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1050] max-w-md w-full p-2">
          <EmptyState
            icon={<Layers className="w-5 h-5 text-amber-400" />}
            title="All Map Layers Disabled"
            description="Open the Layer Control panel (top-right button) to enable Operational, Marine, or Boundary layers."
            primaryAction={{
              label: 'Open Layer Control',
              onClick: () => setIsLayerControlOpen(true),
            }}
          />
        </div>
      )}

      {/* Center Leaflet Map Container */}
      <div className="flex-1 w-full h-full relative">
        <LeafletMapContainer
          center={center}
          zoom={zoom}
          baseMapId={layerState.baseMapId}
          layerState={layerState}
          features={allFeatures}
          selectedFeatureId={selectedFeature?.id ?? null}
          onSelectFeature={(feature) => setSelectedFeature(feature)}
          onViewportChange={(c, z) => {
            setCenter(c);
            setZoom(z);
          }}
        />
      </div>

      {/* Selected Feature Detail Drawer */}
      <FeatureDetailDrawer
        feature={selectedFeature}
        onClose={() => setSelectedFeature(null)}
        onRecenterToFeature={(pos) => {
          setCenter(pos);
          setZoom(11);
        }}
      />
    </div>
  );
};
