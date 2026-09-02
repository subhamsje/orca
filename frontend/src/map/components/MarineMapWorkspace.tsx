import React, { useCallback, useMemo, useState } from 'react';
import { Layers, Globe as GlobeIcon, Map as MapIcon } from 'lucide-react';
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
import { Interactive3DGlobe } from '../../components/Interactive3DGlobe';

interface MarineMapWorkspaceProps {
  assessment: TripAssessmentResponse | null;
  isLoading?: boolean;
  onSelectHarbor?: (harbor: HarborLocation) => void;
  context?: AdapterContext;
}

interface ProgrammaticView {
  center: [number, number];
  zoom: number;
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

  const [mapMode, setMapMode] = useState<'2d' | '3d'>('2d');
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
      className="w-full flex flex-col rounded-2xl overflow-hidden border border-ocean-800 bg-ocean-950 shadow-2xl relative h-[600px] sm:h-[680px] md:h-[720px]"
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

      {/* Global Hotspot Chips & 2D/3D Globe View Mode Toggle */}
      <div className="px-3 py-2 border-b border-ocean-800 bg-ocean-975/60 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2 overflow-x-auto min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted shrink-0">
            Global Hotspots
          </span>
          {[
            { id: 'tokyo', label: 'Tokyo Bay', lat: 35.645, lon: 139.786 },
            { id: 'sydney', label: 'Sydney', lat: -33.8688, lon: 151.2093 },
            { id: 'reykjavik', label: 'Reykjavík', lat: 64.1505, lon: -21.9325 },
            { id: 'capetown', label: 'Cape Town', lat: -33.9036, lon: 18.4203 },
            { id: 'newyork', label: 'New York', lat: 40.8128, lon: -73.8842 },
            { id: 'riogrande', label: 'Rio Grande', lat: -32.05, lon: -52.083 },
            { id: 'mumbai', label: 'Mumbai', lat: 18.922, lon: 72.8347 },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => {
                setMapMode('2d');
                issueTarget([chip.lat, chip.lon], 9);
              }}
              className="shrink-0 inline-flex items-center gap-1 rounded-full border border-ocean-700 bg-ocean-900 hover:bg-ocean-800 hover:border-cyan-700 text-slate-100 text-[11px] font-semibold px-2.5 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" aria-hidden="true" />
              {chip.label}
            </button>
          ))}
        </div>

        {/* 2D Vector vs 3D Globe Mode Toggle */}
        <div className="flex items-center space-x-1 shrink-0 bg-ocean-900 p-1 rounded-xl border border-ocean-800">
          <button
            onClick={() => setMapMode('2d')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
              mapMode === '2d'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>2D Map</span>
          </button>
          <button
            onClick={() => setMapMode('3d')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
              mapMode === '3d'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GlobeIcon className="w-3.5 h-3.5" />
            <span>3D Globe</span>
          </button>
        </div>
      </div>

      <MapLayerControl
        layerState={layerState}
        isOpen={isLayerControlOpen}
        onClose={() => setIsLayerControlOpen(false)}
        onSelectBaseMap={handleSelectBaseMap}
        onToggleLayer={handleToggleLayer}
      />

      {mapMode === '2d' && (
        <MapFloatingControls
          onZoomIn={() => issueTarget(liveCenter, Math.min(liveZoom + 1, 18))}
          onZoomOut={() => issueTarget(liveCenter, Math.max(liveZoom - 1, 3))}
          onFitBounds={handleFitBounds}
          onRecenter={handleRecenter}
          onToggleLayerControl={() => setIsLayerControlOpen((o) => !o)}
          isLayerControlOpen={isLayerControlOpen}
        />
      )}

      {isLoading && (
        <div className="absolute inset-0 z-[1100] bg-ocean-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <LoadingState
            variant="panel"
            label="Loading geospatial data"
            description="Connecting to ORCA ocean bio-physics feeds."
          />
        </div>
      )}

      <div className="flex-1 min-h-0 relative">
        {mapMode === '2d' ? (
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
        ) : (
          <Interactive3DGlobe onSelectHarbor={handleSelectHarbor} />
        )}
      </div>

      <FeatureDetailDrawer
        feature={selectedFeature}
        onClose={handleClearSelection}
        onRecenterToFeature={handleRecenteringToFeature}
      />

      <div className="px-3 py-1.5 border-t border-ocean-800 bg-ocean-975 flex flex-wrap items-center justify-between text-[11px] text-ink-muted">
        <StatusIndicator
          state={isOffline ? 'OFFLINE' : 'NORMAL'}
          label={isOffline ? 'Offline mode' : 'ONLINE (ISRO Satellite Mesh)'}
        />
        <span className="font-mono text-[10px] text-cyan-400">Mode: {mapMode.toUpperCase()} VIEW</span>
      </div>
    </section>
  );
};