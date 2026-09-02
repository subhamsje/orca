import React, { useEffect, useRef } from 'react';
import {
  Anchor,
  Eye,
  Layers,
  Navigation,
  Shield,
  X,
  CheckSquare,
  Square,
} from 'lucide-react';
import { BaseMapId, LayerCategory, LayerGroupState, MapLayerConfig } from '../types/layer';
import { IconButton } from '../../ui/IconButton';

interface MapLayerControlProps {
  layerState: LayerGroupState;
  isOpen: boolean;
  onClose: () => void;
  onSelectBaseMap: (baseMapId: BaseMapId) => void;
  onToggleLayer: (layerId: string) => void;
}

const CATEGORY_META: Record<LayerCategory, { name: string; icon: React.ReactNode; description: string }> = {
  BASE_MAP: {
    name: 'Base map',
    icon: <Layers className="w-4 h-4 text-cyan-400" aria-hidden="true" />,
    description: 'Underlying cartographic canvas',
  },
  OPERATIONAL: {
    name: 'Operational contacts',
    icon: <Eye className="w-4 h-4 text-red-400" aria-hidden="true" />,
    description: 'Active vessels and incident markers',
  },
  MARINE: {
    name: 'Marine & oceanography',
    icon: <Anchor className="w-4 h-4 text-emerald-400" aria-hidden="true" />,
    description: 'Fishing grounds, environmental hazards',
  },
  BOUNDARIES: {
    name: 'Safety & boundaries',
    icon: <Shield className="w-4 h-4 text-amber-400" aria-hidden="true" />,
    description: 'IMBL, EEZ, restricted zones',
  },
  ROUTING: {
    name: 'Pathfinding & routes',
    icon: <Navigation className="w-4 h-4 text-cyan-400" aria-hidden="true" />,
    description: 'Planned routes and alternatives',
  },
  ANALYTICS: {
    name: 'Spatial analytics',
    icon: <Layers className="w-4 h-4 text-purple-400" aria-hidden="true" />,
    description: 'H3 grid and dark-fleet intelligence',
  },
};

const BASE_MAP_OPTIONS: { id: BaseMapId; label: string }[] = [
  { id: 'nautical_dark', label: 'Nautical' },
  { id: 'satellite_esri', label: 'Satellite' },
  { id: 'osm_standard', label: 'Standard' },
];

const NON_BASE_CATEGORIES: LayerCategory[] = [
  'OPERATIONAL',
  'MARINE',
  'BOUNDARIES',
  'ROUTING',
  'ANALYTICS',
];

export const MapLayerControl: React.FC<MapLayerControlProps> = ({
  layerState,
  isOpen,
  onClose,
  onSelectBaseMap,
  onToggleLayer,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const groupedLayers: Record<LayerCategory, MapLayerConfig[]> = {
    BASE_MAP: [],
    OPERATIONAL: [],
    MARINE: [],
    BOUNDARIES: [],
    ROUTING: [],
    ANALYTICS: [],
  };

  Object.values(layerState.layers).forEach((layer) => {
    groupedLayers[layer.category].push(layer);
  });

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label="Map layer control"
      tabIndex={-1}
      className="absolute top-16 left-3 right-3 sm:left-4 sm:right-auto sm:w-80 z-[1000] bg-ocean-950/95 border border-ocean-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden max-h-[80vh] flex flex-col animate-in slide-in-from-left-2 fade-in duration-200"
    >
      <div className="p-4 border-b border-ocean-800 flex items-center justify-between bg-ocean-900/80">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" aria-hidden="true" />
          Layer control
        </h3>
        <IconButton label="Close layer control" icon={<X />} variant="ghost" size="sm" onClick={onClose} />
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
        <section aria-labelledby="basemap-heading" className="space-y-2">
          <h4
            id="basemap-heading"
            className="font-bold text-slate-300 uppercase tracking-wider text-[10px]"
          >
            Base map
          </h4>
          <div role="radiogroup" aria-labelledby="basemap-heading" className="grid grid-cols-3 gap-1.5">
            {BASE_MAP_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={layerState.baseMapId === opt.id}
                onClick={() => onSelectBaseMap(opt.id)}
                className={[
                  'p-2 rounded-xl border text-center font-bold transition',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-950',
                  layerState.baseMapId === opt.id
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                    : 'bg-ocean-900 border-ocean-800 text-slate-400 hover:text-slate-200',
                ].join(' ')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {NON_BASE_CATEGORIES.map((category) => {
          const layers = groupedLayers[category];
          if (layers.length === 0) return null;
          const meta = CATEGORY_META[category];
          return (
            <section
              key={category}
              aria-labelledby={`cat-${category}`}
              className="space-y-2 pt-2 border-t border-ocean-900"
            >
              <h4
                id={`cat-${category}`}
                className="flex items-center gap-1.5 font-bold text-slate-300 uppercase tracking-wider text-[10px]"
              >
                {meta.icon}
                <span>{meta.name}</span>
              </h4>
              <p className="text-[10px] text-ink-subtle">{meta.description}</p>
              <div className="space-y-1.5">
                {layers.map((layer) => {
                  const unavailable = !layer.isAvailable;
                  return (
                    <button
                      key={layer.id}
                      type="button"
                      role="switch"
                      aria-checked={layer.enabled}
                      aria-disabled={unavailable || undefined}
                      onClick={() => !unavailable && onToggleLayer(layer.id)}
                      disabled={unavailable}
                      className={[
                        'w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-950',
                        layer.enabled
                          ? 'bg-ocean-900/90 border-cyan-800/80 text-white'
                          : 'bg-ocean-950 border-ocean-900 text-slate-400',
                        unavailable ? 'opacity-60 cursor-not-allowed' : '',
                      ].join(' ')}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {layer.enabled ? (
                          <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-xs block truncate">{layer.name}</span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {layer.description}
                          </span>
                          {layer.source && (
                            <span className="text-[9px] text-ink-subtle block truncate">
                              {layer.source}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={[
                          'text-[9px] px-1.5 py-0.5 rounded border shrink-0',
                          layer.freshnessStatus === 'LIVE'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : layer.freshnessStatus === 'RECENT'
                              ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                              : layer.freshnessStatus === 'STALE'
                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : 'bg-ocean-950 text-slate-300 border-ocean-800',
                        ].join(' ')}
                      >
                        {layer.freshnessStatus ?? 'UNKNOWN'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};