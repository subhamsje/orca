import React, { useCallback, useMemo, useState } from 'react';
import { Layers } from 'lucide-react';
import { TripAssessmentResponse } from '../../types';
import { BaseMapId, DEFAULT_BASE_MAP, DEFAULT_MAP_LAYERS, LayerGroupState } from '../types/layer';
import { MapFeature } from '../types/feature';
import {
  convertTripAssessmentToMapFeatures,
  AdapterContext,
} from '../adapters/featureAdapter';
import {
  DEMO_SIMULATION_FEATURES,
  shouldRenderDemoFeatures,
} from '../fixtures/devFixtures';
import { LeafletMapContainer } from './LeafletMapContainer';
import { MapTopBar } from './MapTopBar';
import { MapLayerControl } from './MapLayerControl';
import { MapFloatingControls } from './MapFloatingControls';
import { FeatureDetailDrawer } from './FeatureDetailDrawer';
import { HarborLocation } from '../../utils/harbors';
import { LoadingState } from '../../ui/LoadingState';
import { EmptyState } from '../../ui/EmptyState';
import { StatusIndicator } from '../../ui/StatusIndicator';

interface MarineMapWorkspaceProps {
  assessment: TripAssessmentResponse | null;
  isLoading?: boolean;
  onSelectHarbor?: (harbor: HarborLocation) => void;
  context?: AdapterContext;
}

interface ProgrammaticView {
  center: [number, number];
  zoom: number;
  /** Monotonically increasing counter — bumped each time the consumer
   *  issues a "fly here" command. Used to avoid user-pan → flyTo loops. */
  nonce: number;
}

const INITIAL_CENTER: [number, number] = [15.5, 73.83];
const INITIAL_ZOOM = 6;

export const MarineMapWorkspace: React.FC<MarineMapWorkspaceProps> = ({
  assessment,
  isLoading = false,
  onSelectHarbor,
  context,
}) => {
  const initialView = useMemo<ProgrammaticView>(() => {
    if (assessment) {
      return {
        center: [assessment.coordinate.lat, assessment.coordinate.lon],
        zoom: 8,
        nonce: 0,
      };
    }
    return { center: INITIAL_CENTER, zoom: INITIAL_ZOOM, nonce: 0 };
  }, [assessment]);

  const [target, setTarget] = useState<ProgrammaticView>(initialView);
  const [liveCenter, setLiveCenter] = useState<[number, number]>(initialView.center);
  const [liveZoom, setLiveZoom] = useState<number>(initialView.zoom);
  const [layerState, setLayerState] = useState<LayerGroupState>({
    baseMapId: DEFAULT_BASE_MAP,
    layers: DEFAULT_MAP_LAYERS,
  });
  const [selectedFeature, setSelectedFeature] = useState<MapFeature | null>(null);
  const [isLayerControlOpen, setIsLayerControlOpen] = useState(false);
  const [isOffline, setIsOffline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );

  // Combine live (backend) features with clearly-labeled fixtures when
  // the developer opts in via the ?demoFixtures=1 flag or DEV mode.
  const features = useMemo<ReadonlyArray<MapFeature>>(() => {
    const live = convertTripAssessmentToMapFeatures(assessment, context);
    return shouldRenderDemoFeatures() ? [...live, ...DEMO_SIMULATION_FEATURES] : live;
  }, [assessment, context]);

  const activeLayersCount = useMemo(
    () => Object.values(layerState.layers).filter((l) => l.enabled).length,
    [layerState.layers],
  );

  const issueTarget = useCallback(
    (center: [number, number], zoom: number) => {
      setTarget((prev) => ({ center, zoom, nonce: prev.nonce + 1 }));
    },
    [],
  );

  const handleSelectBaseMap = useCallback((baseMapId: BaseMapId) => {
    setLayerState((prev) => ({ ...prev, baseMapId }));
  }, []);

  const handleToggleLayer = useCallback((layerId: string) => {
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
  }, []);

  const handleSearch = useCallback(
    (query: string) => {
      const parts = query.split(',').map((p) => parseFloat(p.trim()));
      if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
        issueTarget([parts[0], parts[1]], 10);
        return;
      }
      const found = features.find((f) =>
        f.name.toLowerCase().includes(query.toLowerCase()),
      );
      if (found) {
        setSelectedFeature(found);
        issueTarget(found.position, 10);
      }
    },
    [features, issueTarget],
  );

  const handleFitBounds = useCallback(() => {
    if (features.length > 0) {
      issueTarget(features[0].position, 8);
    }
  }, [features, issueTarget]);

  const handleRecenter = useCallback(() => {
    issueTarget(initialView.center, initialView.zoom);
  }, [initialView, issueTarget]);

  const handleSelectHarbor = useCallback(
    (harbor: HarborLocation) => {
      onSelectHarbor?.(harbor);
      issueTarget([harbor.lat, harbor.lon], 9);
    },
    [issueTarget, onSelectHarbor],
  );

  // The user pan/zoom path: only updates the live coordinate/zoom used
  // by the top bar — does NOT touch `target`, so the map does not try
  // to flyTo on every move.
  const handleViewportChange = useCallback((center: [number, number], zoom: number) => {
    setLiveCenter(center);
    setLiveZoom(zoom);
  }, []);

  const handleRecenteringToFeature = useCallback(
    (position: [number, number]) => {
      issueTarget(position, 11);
    },
    [issueTarget],
  );

  const handleClearSelection = useCallback(() => setSelectedFeature(null), []);

  // Online/offline indicator (read once at mount; an event listener would
  // be added in a future iteration).
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <section
      aria-label="Marine operations map workspace"
      className="w-full flex flex-col rounded-2xl overflow-hidden border border-ocean-800 bg-ocean-950 shadow-2xl relative h-[560px] sm:h-[640px] md:h-[680px]"
    >
      <MapTopBar
        center={liveCenter}
        zoom={liveZoom}
        activeLayersCount={activeLayersCount}
        isOffline={isOffline}
        connectivity={isOffline ? 'OFFLINE' : 'NORMAL'}
        onSearch={handleSearch}
        onSelectHarbor={handleSelectHarbor}
        onRecenter={handleRecenter}
      />

      <MapLayerControl
        layerState={layerState}
        isOpen={isLayerControlOpen}
        onClose={() => setIsLayerControlOpen(false)}
        onSelectBaseMap={handleSelectBaseMap}
        onToggleLayer={handleToggleLayer}
      />

      <MapFloatingControls
        onZoomIn={() => issueTarget(liveCenter, Math.min(liveZoom + 1, 18))}
        onZoomOut={() => issueTarget(liveCenter, Math.max(liveZoom - 1, 3))}
        onFitBounds={handleFitBounds}
        onRecenter={handleRecenter}
        onToggleLayerControl={() => setIsLayerControlOpen((o) => !o)}
        isLayerControlOpen={isLayerControlOpen}
      />

      {isLoading && (
        <div className="absolute inset-0 z-[1100] bg-ocean-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <LoadingState
            variant="panel"
            label="Loading geospatial data"
            description="Connecting to ORCA ocean bio-physics feeds."
          />
        </div>
      )}

      {activeLayersCount === 0 && !isLoading && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1050] max-w-md w-full p-2">
          <EmptyState
            icon={<Layers className="w-5 h-5 text-amber-400" />}
            title="All map layers disabled"
            description="Open the layer control panel to enable operational, marine, or boundary layers."
            primaryAction={{
              label: 'Open layer control',
              onClick: () => setIsLayerControlOpen(true),
            }}
          />
        </div>
      )}

      <div className="flex-1 min-h-0 relative">
        <LeafletMapContainer
          center={target.center}
          zoom={target.zoom}
          flyToNonce={target.nonce}
          baseMapId={layerState.baseMapId}
          layerState={layerState}
          features={features}
          selectedFeatureId={selectedFeature?.id ?? null}
          onSelectFeature={setSelectedFeature}
          onViewportChange={handleViewportChange}
        />
      </div>

      <FeatureDetailDrawer
        feature={selectedFeature}
        onClose={handleClearSelection}
        onRecenterToFeature={handleRecenteringToFeature}
      />

      <div className="px-3 py-1.5 border-t border-ocean-800 bg-ocean-975 flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
        <StatusIndicator
          state={isOffline ? 'OFFLINE' : 'NORMAL'}
          label={isOffline ? 'Offline mode' : 'Online'}
        />
      </div>
    </section>
  );
};