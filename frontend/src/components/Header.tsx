import React, { useId } from 'react';
import {
  AlertTriangle,
  Anchor,
  MapPin,
  Ship,
  WifiOff,
  Wifi,
  Globe,
  Compass,
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
  vesselProfile,
  onOpenVesselModal,
  language,
  onLanguageChange,
  isOffline,
  isDemoMode = true,
  onSelectDemoPreset,
  selectedHarbor,
  onSelectHarbor,
}) => {
  const harborListId = useId();
  const langListId = useId();

  return (
    <div className="sticky top-0 z-40">
      {isDemoMode && (
        <div className="bg-amber-950/90 border-b border-amber-900 px-4 py-1.5 text-[11px] flex items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-center gap-2 text-amber-300 font-medium min-w-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
            <span className="truncate">
              <strong className="font-bold">Live Simulation Mode</strong>
              <span className="text-amber-400/80"> · ISRO Oceansat-3 & INCOIS ERDDAP telemetry active</span>
            </span>
          </div>
          {onSelectDemoPreset && (
            <div
              role="group"
              aria-label="Demo scenario presets"
              className="flex items-center gap-1.5 overflow-x-auto"
            >
              <button
                type="button"
                onClick={() => onSelectDemoPreset('safe')}
                className="rounded-md border border-emerald-800 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 text-[11px] font-bold px-2.5 py-0.5 transition shadow"
              >
                Goa · Safe
              </button>
              <button
                type="button"
                onClick={() => onSelectDemoPreset('danger')}
                className="rounded-md border border-amber-800 bg-amber-950 hover:bg-amber-900 text-amber-200 text-[11px] font-bold px-2.5 py-0.5 transition shadow"
              >
                Mumbai · High Swell
              </button>
              <button
                type="button"
                onClick={() => onSelectDemoPreset('cyclone')}
                className="rounded-md border border-red-800 bg-red-950 hover:bg-red-900 text-red-200 text-[11px] font-bold px-2.5 py-0.5 transition shadow"
              >
                Paradip · Cyclone
              </button>
            </div>
          )}
        </div>
      )}

      <header className="bg-ocean-950/95 backdrop-blur-xl border-b border-ocean-800/80 shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-cyan-600 p-2.5 rounded-xl text-white shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Anchor className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2 truncate">
                <span className="tracking-wider">ORCA</span>
                <span className="hidden sm:inline text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-800 font-bold">
                  v4.0 · SIH26176
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 truncate">
                ISRO / INCOIS Universal Maritime Operating System
              </p>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge tone={isOffline ? 'caution' : 'safe'} className="hidden md:inline-flex">
              {isOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
              {isOffline ? 'Offline Cache' : 'ONLINE (ISRO)'}
            </StatusBadge>

            <button
              type="button"
              onClick={onOpenVesselModal}
              aria-label={`Vessel profile · ${vesselProfile.vessel_name}`}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-ocean-800 bg-ocean-900 hover:bg-ocean-800 text-slate-100 text-xs font-bold px-3 py-2 transition shadow-md"
            >
              <Ship className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              <span className="hidden md:inline max-w-[10rem] truncate">
                {vesselProfile.vessel_name}
              </span>
              <span className="text-cyan-300">{vesselProfile.length_m}m</span>
            </button>

            <label className="relative" htmlFor={langListId}>
              <span className="sr-only">Select language</span>
              <Globe
                className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <select
                id={langListId}
                value={language}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="appearance-none bg-ocean-900 hover:bg-ocean-800 border border-ocean-800 text-slate-100 text-xs font-bold pl-7 pr-7 py-2 rounded-xl focus:outline-none focus:border-cyan-500 cursor-pointer transition shadow-md"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option
                    key={lang.code}
                    value={lang.code}
                    className="bg-ocean-950 text-white"
                  >
                    {lang.native} ({lang.code})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-3 flex items-center gap-2 text-xs">
          <MapPin className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <label htmlFor={harborListId} className="sr-only">
            Select harbor
          </label>
          <select
            id={harborListId}
            value={selectedHarbor.id}
            onChange={(e) => {
              const found = GLOBAL_HARBORS.find((h) => h.id === e.target.value);
              if (found) onSelectHarbor(found);
            }}
            className="flex-1 sm:flex-none sm:min-w-[20rem] bg-ocean-900 hover:bg-ocean-800 border border-ocean-800 text-slate-100 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 cursor-pointer transition shadow-md"
          >
            {GLOBAL_HARBORS.map((h) => (
              <option key={h.id} value={h.id} className="bg-ocean-950 text-white">
                📍 {h.name} ({h.state}, {h.country})
              </option>
            ))}
          </select>
          <span className="hidden lg:inline text-slate-400 font-mono text-[11px] truncate">
            {selectedHarbor.lat.toFixed(4)}°N, {selectedHarbor.lon.toFixed(4)}°E
          </span>
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<Ship className="w-3.5 h-3.5" />}
            className="sm:hidden ml-auto"
            onClick={onOpenVesselModal}
          >
            {vesselProfile.length_m}m
          </Button>
        </div>
      </header>
    </div>
  );
};