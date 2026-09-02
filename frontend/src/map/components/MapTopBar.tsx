import React, { useState } from 'react';
import { Search, Compass, Wifi, WifiOff, Clock, Layers, Crosshair } from 'lucide-react';
import { FreshnessState } from '../types/feature';
import { INDIAN_HARBORS, HarborLocation } from '../../utils/harbors';

interface MapTopBarProps {
  center: [number, number];
  zoom: number;
  activeLayersCount: number;
  isOnline: boolean;
  freshness: FreshnessState;
  onSearch: (query: string) => void;
  onSelectHarbor: (harbor: HarborLocation) => void;
  onRecenter: () => void;
}

export const MapTopBar: React.FC<MapTopBarProps> = ({
  center,
  zoom,
  activeLayersCount,
  isOnline,
  freshness,
  onSearch,
  onSelectHarbor,
  onRecenter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const getFreshnessBadge = () => {
    if (freshness === 'LIVE') {
      return (
        <span className="flex items-center space-x-1.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-lg text-[11px] font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>LIVE STREAM</span>
        </span>
      );
    }
    if (freshness === 'RECENT') {
      return (
        <span className="flex items-center space-x-1 bg-cyan-950/80 text-cyan-300 border border-cyan-800 px-2 py-1 rounded-lg text-[11px] font-bold">
          <Clock className="w-3.5 h-3.5" />
          <span>RECENT (&lt;15m)</span>
        </span>
      );
    }
    return (
      <span className="flex items-center space-x-1 bg-amber-950/80 text-amber-300 border border-amber-800 px-2 py-1 rounded-lg text-[11px] font-bold">
        <Clock className="w-3.5 h-3.5" />
        <span>STALE FEED</span>
      </span>
    );
  };

  return (
    <div className="bg-ocean-900/95 border-b border-ocean-800 p-3 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
      {/* Left: Location Search & Harbor Quick Select */}
      <div className="flex items-center space-x-2 flex-1 min-w-[280px]">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Lat, Lon, Harbor, Vessel, H3 cell..."
            className="w-full bg-ocean-950 border border-ocean-800 text-slate-200 text-xs rounded-xl pl-8 pr-3 py-2 outline-none focus:border-cyan-500 transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
        </form>

        <select
          onChange={(e) => {
            const found = INDIAN_HARBORS.find((h) => h.id === e.target.value);
            if (found) onSelectHarbor(found);
          }}
          className="bg-ocean-950 border border-ocean-800 text-slate-300 text-xs rounded-xl px-2.5 py-2 outline-none cursor-pointer"
        >
          <option value="">Jump to Harbor...</option>
          {INDIAN_HARBORS.map((h) => (
            <option key={h.id} value={h.id}>
              📍 {h.name} ({h.state})
            </option>
          ))}
        </select>
      </div>

      {/* Right: Map Status, Freshness & Connectivity Badges */}
      <div className="flex items-center space-x-2 text-xs">
        <div className="hidden md:flex items-center space-x-2 text-slate-300 font-mono bg-ocean-950 px-3 py-1.5 rounded-xl border border-ocean-800">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {center[0].toFixed(4)}°N, {center[1].toFixed(4)}°E (Z{zoom})
          </span>
        </div>

        <div className="flex items-center space-x-1.5 bg-ocean-950 px-2.5 py-1 rounded-xl border border-ocean-800 text-slate-300">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>{activeLayersCount} Layers</span>
        </div>

        {getFreshnessBadge()}

        <span
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
            isOnline
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
              : 'bg-red-950/80 text-red-300 border-red-800'
          }`}
        >
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </span>

        <button
          onClick={onRecenter}
          title="Recenter Map"
          className="bg-ocean-800 hover:bg-ocean-700 text-slate-200 p-2 rounded-xl border border-ocean-700 transition"
        >
          <Crosshair className="w-4 h-4 text-cyan-400" />
        </button>
      </div>
    </div>
  );
};
