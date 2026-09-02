import React, { useState } from 'react';
import { Compass, Crosshair, MapPin, Search, Wifi, WifiOff } from 'lucide-react';
import { OperationalState } from '../../design/states';
import { INDIAN_HARBORS, HarborLocation } from '../../utils/harbors';
import { StatusIndicator } from '../../ui/StatusIndicator';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { IconButton } from '../../ui/IconButton';
import { Tooltip } from '../../ui/Tooltip';

interface MapTopBarProps {
  center: [number, number];
  zoom: number;
  activeLayersCount: number;
  isOffline: boolean;
  /** Connectivity state for the status indicator. */
  connectivity: OperationalState;
  onSearch: (query: string) => void;
  onSelectHarbor: (harbor: HarborLocation) => void;
  onRecenter: () => void;
}

export const MapTopBar: React.FC<MapTopBarProps> = ({
  center,
  zoom,
  activeLayersCount,
  isOffline,
  connectivity,
  onSearch,
  onSelectHarbor,
  onRecenter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) onSearch(trimmed);
  };

  const harborOptions = INDIAN_HARBORS.map((h) => ({
    value: h.id,
    label: `${h.name} · ${h.state}`,
  }));

  return (
    <div className="bg-ocean-975/95 border-b border-ocean-800 p-3 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
      <form
        onSubmit={handleSearchSubmit}
        className="flex items-center gap-2 flex-1 min-w-[260px]"
      >
        <Input
          aria-label="Search coordinates, harbor, or feature"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Coordinates (16.02, 73.48) or feature name"
          inputSize="sm"
          leadingIcon={<Search className="w-3.5 h-3.5" />}
          className="flex-1 max-w-sm"
        />
        <Select
          aria-label="Jump to harbor"
          placeholder="Jump to harbor…"
          value=""
          onChange={(e) => {
            const found = INDIAN_HARBORS.find((h) => h.id === e.target.value);
            if (found) {
              onSelectHarbor(found);
              // Reset selector to placeholder
              e.target.value = '';
            }
          }}
          options={harborOptions}
          className="hidden sm:block sm:w-56"
        />
      </form>

      <div className="flex items-center gap-2 text-xs flex-wrap">
        <div className="hidden md:flex items-center gap-2 text-slate-300 font-mono bg-ocean-950 px-3 py-1.5 rounded-xl border border-ocean-800">
          <Compass className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
          <span aria-label="Map center">
            {center[0].toFixed(4)}°N, {center[1].toFixed(4)}°E
          </span>
          <span className="text-ink-subtle">·</span>
          <span aria-label="Zoom level">Z{zoom}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-ocean-950 px-2.5 py-1 rounded-xl border border-ocean-800 text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
          <span className="text-[11px]">
            <strong>{activeLayersCount}</strong> layers
          </span>
        </div>

        <StatusIndicator state={connectivity} />
        {isOffline && <StatusIndicator state="OFFLINE" label="Offline" />}

        <Tooltip content="Recenter on active assessment">
          <IconButton
            label="Recenter"
            icon={<Crosshair />}
            variant="secondary"
            size="sm"
            onClick={onRecenter}
          />
        </Tooltip>
      </div>
    </div>
  );
};

// Re-export for downstream tests
export { Wifi, WifiOff };