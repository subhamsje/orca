import React, { useId } from 'react';
import {
  AlertTriangle, Anchor, MapPin, Ship, WifiOff, Wifi, Globe, Satellite,
} from 'lucide-react';
import { VesselProfile } from '../types';
import { HarborLocation, GLOBAL_HARBORS } from '../utils/harbors';
import { Button, StatusBadge } from '../ui';

export const SUPPORTED_LANGUAGES = [
  { code: 'Marathi', native: 'मराठी', region: 'Koli / Malvani' },
  { code: 'Hindi', native: 'हिन्दी', region: 'Standard' },
  { code: 'Gujarati', native: 'ગુજરાતી', region: 'Standard' },
  { code: 'Tamil', native: 'தமிழ்', region: 'Standard' },
  { code: 'Telugu', native: 'తెలుగు', region: 'Standard' },
  { code: 'Malayalam', native: 'മലയാളം', region: 'Standard' },
  { code: 'Kannada', native: 'ಕನ್ನಡ', region: 'Standard' },
  { code: 'Bengali', native: 'বাংলা', region: 'Standard' },
  { code: 'English', native: 'English', region: 'Standard' },
] as const;

interface HeaderProps {
  vesselProfile: VesselProfile;
  onOpenVesselModal: () => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  isOffline: boolean;
  isDemoMode?: boolean;
  onSelectDemoPreset?: (scenarioKey: string) => void;
  selectedHarbor: HarborLocation;
  onSelectHarbor: (harbor: HarborLocation) => void;
}

export const Header: React.FC<HeaderProps> = ({
  vesselProfile, onOpenVesselModal, language, onLanguageChange,
  isOffline, isDemoMode = true, onSelectDemoPreset, selectedHarbor, onSelectHarbor,
}) => {
  const harborListId = useId();
  const langListId = useId();

  return (
    <div className="sticky top-0 z-40">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="glass-dark px-6 py-1.5 text-[11px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-300 font-medium min-w-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" aria-hidden="true" />
            <span className="truncate">
              <strong className="font-bold tracking-wide">LIVE MULTI-AGENT SIMULATION</strong>
              <span className="text-amber-400/70 ml-2">ISRO Oceansat-3 · INCOIS ERDDAP</span>
            </span>
          </div>
          {onSelectDemoPreset && (
            <div role="group" aria-label="Demo scenario presets" className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { key: 'safe', label: 'Goa · Safe', cls: 'border-emerald-700/60 bg-emerald-950/60 text-emerald-300 hover:neon-glow-emerald' },
                { key: 'danger', label: 'Mumbai · Swell', cls: 'border-amber-700/60 bg-amber-950/60 text-amber-300 hover:neon-glow-amber' },
                { key: 'cyclone', label: 'Paradip · Cyclone', cls: 'border-red-700/60 bg-red-950/60 text-red-300 hover:neon-glow-red' },
              ].map((d) => (
                <button key={d.key} type="button" onClick={() => onSelectDemoPreset(d.key)}
                  className={`rounded-lg ${d.cls} text-[10px] font-bold px-2.5 py-0.5 transition-all duration-300 border backdrop-blur-sm`}
                >{d.label}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Header */}
      <header className="glass-panel border-b border-cyan-500/10 shadow-[0_4px_40px_rgba(0,0,0,0.6)]">
        <div className="w-full px-4 sm:px-6 py-3 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-cyan-600 to-cyan-800 text-white shrink-0 neon-glow-cyan">
              <Anchor className="w-5 h-5" aria-hidden="true" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-ocean-950 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-black tracking-tight flex items-center gap-2 truncate">
                <span className="tracking-[0.25em] gradient-text-ocean text-lg">ORCA</span>
                <span className="hidden sm:inline text-[9px] bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-700/50 font-bold neon-glow-cyan">
                  v4.0 · SIH26176
                </span>
              </h1>
              <p className="text-[10px] text-slate-500 truncate">ISRO · INCOIS Universal Maritime OS</p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <StatusBadge tone={isOffline ? 'caution' : 'safe'} className="hidden md:inline-flex glass-card px-2.5 py-1">
              {isOffline ? <WifiOff className="w-3 h-3" /> : <Satellite className="w-3 h-3 animate-pulse" />}
              {isOffline ? 'Offline Cache' : 'SAT MESH LIVE'}
            </StatusBadge>

            <button type="button" onClick={onOpenVesselModal}
              aria-label={`Vessel · ${vesselProfile.vessel_name}`}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl glass-card hover:border-cyan-500/30 text-slate-100 text-[11px] font-bold px-3 py-2 transition-all duration-300"
            >
              <Ship className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              <span className="hidden md:inline max-w-[8rem] truncate">{vesselProfile.vessel_name}</span>
              <span className="text-cyan-300 font-mono text-[10px]">{vesselProfile.length_m}m</span>
            </button>

            <label className="relative" htmlFor={langListId}>
              <span className="sr-only">Select language</span>
              <Globe className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <select id={langListId} value={language} onChange={(e) => onLanguageChange(e.target.value)}
                className="appearance-none glass-card text-slate-100 text-[11px] font-bold pl-8 pr-7 py-2 rounded-xl focus:outline-none focus:border-cyan-400 cursor-pointer transition"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-ocean-950 text-white">
                    {lang.native} ({lang.code})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Harbor Row */}
        <div className="w-full px-4 sm:px-6 pb-3 flex items-center gap-3 text-xs border-t border-ocean-800/40 pt-2">
          <MapPin className="w-4 h-4 text-amber-400 shrink-0 animate-float" aria-hidden="true" />
          <label htmlFor={harborListId} className="sr-only">Select harbor</label>
          <select id={harborListId} value={selectedHarbor.id}
            onChange={(e) => { const f = GLOBAL_HARBORS.find((h) => h.id === e.target.value); if (f) onSelectHarbor(f); }}
            className="flex-1 sm:flex-none sm:min-w-[22rem] glass-card text-slate-100 text-[11px] font-bold px-3.5 py-2 rounded-xl focus:outline-none focus:border-cyan-400 cursor-pointer transition"
          >
            {GLOBAL_HARBORS.map((h) => (
              <option key={h.id} value={h.id} className="bg-ocean-950 text-white">📍 {h.name} ({h.state}, {h.country})</option>
            ))}
          </select>
          <span className="hidden lg:inline text-cyan-400/80 font-mono text-[10px] truncate">
            {selectedHarbor.lat.toFixed(4)}°N, {selectedHarbor.lon.toFixed(4)}°E
          </span>
          <Button variant="ghost" size="sm" leadingIcon={<Ship className="w-3.5 h-3.5" />} className="sm:hidden ml-auto" onClick={onOpenVesselModal}>
            {vesselProfile.length_m}m
          </Button>
        </div>
      </header>
    </div>
  );
};