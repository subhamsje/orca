import React from 'react';
import { Plus, Minus, Layers, Maximize2, Crosshair } from 'lucide-react';

interface MapFloatingControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitBounds: () => void;
  onRecenter: () => void;
  onToggleLayerControl: () => void;
  isLayerControlOpen: boolean;
}

export const MapFloatingControls: React.FC<MapFloatingControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onFitBounds,
  onRecenter,
  onToggleLayerControl,
  isLayerControlOpen,
}) => {
  return (
    <div className="absolute top-16 right-4 z-[1000] flex flex-col space-y-2">
      <button
        onClick={onToggleLayerControl}
        title="Layer Controls"
        className={`p-2.5 rounded-xl border shadow-xl transition ${
          isLayerControlOpen
            ? 'bg-cyan-600 text-white border-cyan-400'
            : 'bg-ocean-900/90 hover:bg-ocean-800 text-slate-200 border-ocean-800'
        }`}
      >
        <Layers className="w-4 h-4" />
      </button>

      <div className="bg-ocean-900/90 border border-ocean-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
        <button
          onClick={onZoomIn}
          title="Zoom In"
          className="p-2.5 text-slate-200 hover:bg-ocean-800 border-b border-ocean-800 transition"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          title="Zoom Out"
          className="p-2.5 text-slate-200 hover:bg-ocean-800 transition"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={onFitBounds}
        title="Fit All Features"
        className="p-2.5 bg-ocean-900/90 hover:bg-ocean-800 text-slate-200 rounded-xl border border-ocean-800 shadow-xl transition"
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      <button
        onClick={onRecenter}
        title="Recenter Map"
        className="p-2.5 bg-ocean-900/90 hover:bg-ocean-800 text-slate-200 rounded-xl border border-ocean-800 shadow-xl transition"
      >
        <Crosshair className="w-4 h-4 text-cyan-400" />
      </button>
    </div>
  );
};
