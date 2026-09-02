import React from 'react';
import { Crosshair, Layers, Maximize2, Minus, Plus } from 'lucide-react';
import { Tooltip } from '../../ui/Tooltip';
import { IconButton } from '../../ui/IconButton';

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
    <div
      role="toolbar"
      aria-label="Map tools"
      className="absolute top-16 right-3 sm:right-4 z-[1000] flex flex-col gap-2"
    >
      <Tooltip content={isLayerControlOpen ? 'Hide layers' : 'Show layers'} side="left">
        <IconButton
          label={isLayerControlOpen ? 'Hide layers' : 'Show layers'}
          icon={<Layers />}
          variant={isLayerControlOpen ? 'primary' : 'secondary'}
          size="md"
          onClick={onToggleLayerControl}
          aria-pressed={isLayerControlOpen}
        />
      </Tooltip>

      <div className="flex flex-col bg-ocean-900/95 border border-ocean-800 rounded-xl shadow-xl overflow-hidden">
        <Tooltip content="Zoom in" side="left">
          <IconButton
            label="Zoom in"
            icon={<Plus />}
            variant="ghost"
            size="md"
            onClick={onZoomIn}
            className="rounded-none border-b border-ocean-800"
          />
        </Tooltip>
        <Tooltip content="Zoom out" side="left">
          <IconButton
            label="Zoom out"
            icon={<Minus />}
            variant="ghost"
            size="md"
            onClick={onZoomOut}
            className="rounded-none"
          />
        </Tooltip>
      </div>

      <Tooltip content="Fit all features" side="left">
        <IconButton
          label="Fit all features"
          icon={<Maximize2 />}
          variant="secondary"
          size="md"
          onClick={onFitBounds}
        />
      </Tooltip>

      <Tooltip content="Recenter" side="left">
        <IconButton
          label="Recenter"
          icon={<Crosshair />}
          variant="secondary"
          size="md"
          onClick={onRecenter}
          className="text-cyan-400"
        />
      </Tooltip>
    </div>
  );
};