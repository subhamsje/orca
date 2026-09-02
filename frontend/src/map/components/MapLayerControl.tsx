import React from 'react';
import { BaseMapId, LayerGroupState, LayerCategory, MapLayerConfig } from '../types/layer';
import { Layers, Shield, Anchor, Navigation, Eye, CheckSquare, Square, X } from 'lucide-react';

interface MapLayerControlProps {
  layerState: LayerGroupState;
  isOpen: boolean;
  onClose: () => void;
  onSelectBaseMap: (baseMapId: BaseMapId) => void;
  onToggleLayer: (layerId: string) => void;
}

const CATEGORY_META: Record<LayerCategory, { name: string; icon: React.ReactNode }> = {
  BASE_MAP: { name: 'Base Map Canvas', icon: <Layers className="w-4 h-4 text-cyan-400" /> },
  OPERATIONAL: { name: 'Operational Contacts', icon: <Eye className="w-4 h-4 text-red-400" /> },
  MARINE: { name: 'Marine & Oceanography', icon: <Anchor className="w-4 h-4 text-emerald-400" /> },
  BOUNDARIES: { name: 'Safety & Boundaries', icon: <Shield className="w-4 h-4 text-amber-400" /> },
  ROUTING: { name: 'Pathfinding & Routes', icon: <Navigation className="w-4 h-4 text-cyan-400" /> },
  ANALYTICS: { name: 'Spatial Analytics (H3)', icon: <Layers className="w-4 h-4 text-purple-400" /> },
};

export const MapLayerControl: React.FC<MapLayerControlProps> = ({
  layerState,
  isOpen,
  onClose,
  onSelectBaseMap,
  onToggleLayer,
}) => {
  if (!isOpen) return null;

  const groupByCategory = () => {
    const groups: Record<LayerCategory, MapLayerConfig[]> = {
      BASE_MAP: [],
      OPERATIONAL: [],
      MARINE: [],
      BOUNDARIES: [],
      ROUTING: [],
      ANALYTICS: [],
    };

    Object.values(layerState.layers).forEach((layer) => {
      groups[layer.category].push(layer);
    });

    return groups;
  };

  const groupedLayers = groupByCategory();

  return (
    <div className="absolute top-14 left-4 z-[1000] w-80 bg-ocean-950/95 border border-ocean-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden max-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-ocean-800 flex items-center justify-between bg-ocean-900/80">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Layer Control Workspace</span>
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
        {/* Base Map Selector Section */}
        <div className="space-y-2">
          <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">
            Base Map Canvas
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => onSelectBaseMap('nautical_dark')}
              className={`p-2 rounded-xl border text-center font-bold transition ${
                layerState.baseMapId === 'nautical_dark'
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                  : 'bg-ocean-900 border-ocean-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Nautical Dark
            </button>
            <button
              onClick={() => onSelectBaseMap('satellite_esri')}
              className={`p-2 rounded-xl border text-center font-bold transition ${
                layerState.baseMapId === 'satellite_esri'
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                  : 'bg-ocean-900 border-ocean-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => onSelectBaseMap('osm_standard')}
              className={`p-2 rounded-xl border text-center font-bold transition ${
                layerState.baseMapId === 'osm_standard'
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                  : 'bg-ocean-900 border-ocean-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Standard
            </button>
          </div>
        </div>

        {/* Grouped Operational Layers */}
        {(['OPERATIONAL', 'MARINE', 'BOUNDARIES', 'ROUTING', 'ANALYTICS'] as LayerCategory[]).map(
          (category) => (
            <div key={category} className="space-y-2 pt-2 border-t border-ocean-900">
              <div className="flex items-center space-x-1.5 font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                {CATEGORY_META[category].icon}
                <span>{CATEGORY_META[category].name}</span>
              </div>

              <div className="space-y-1.5">
                {groupedLayers[category].map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => onToggleLayer(layer.id)}
                    disabled={!layer.isAvailable}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition ${
                      layer.enabled
                        ? 'bg-ocean-900/90 border-cyan-800/80 text-white'
                        : 'bg-ocean-950 border-ocean-900 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {layer.enabled ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold text-xs block">{layer.name}</span>
                        <span className="text-[10px] text-slate-400 block">{layer.description}</span>
                      </div>
                    </div>

                    {layer.freshnessStatus && (
                      <span className="text-[9px] bg-ocean-950 text-cyan-300 px-1.5 py-0.5 rounded border border-ocean-800 shrink-0">
                        {layer.freshnessStatus}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
