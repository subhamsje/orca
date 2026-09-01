import React from 'react';
import { Anchor, Ship, Wifi, MapPin, AlertCircle } from 'lucide-react';
import { VesselProfile } from '../types';
import { INDIAN_HARBORS, HarborLocation } from '../utils/harbors';

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
  return (
    <div className="sticky top-0 z-50">
      {/* Persistent Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-amber-300 border-b border-amber-800 px-4 py-1.5 text-xs flex items-center justify-between font-medium">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong>DEMO MODE ACTIVE</strong> — Running simulated satellite & ocean model feeds for SIH Judging
            </span>
          </div>
          {onSelectDemoPreset && (
            <div className="flex items-center space-x-1.5 overflow-x-auto">
              <span className="text-slate-400 text-[10px] uppercase font-bold hidden md:inline">Presets:</span>
              <button
                onClick={() => onSelectDemoPreset('safe')}
                className="bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 text-[11px] px-2 py-0.5 rounded font-bold transition"
              >
                Goa Safe
              </button>
              <button
                onClick={() => onSelectDemoPreset('danger')}
                className="bg-amber-900/80 hover:bg-amber-800 text-amber-200 border border-amber-700 text-[11px] px-2 py-0.5 rounded font-bold transition"
              >
                Mumbai High Swell
              </button>
              <button
                onClick={() => onSelectDemoPreset('cyclone')}
                className="bg-red-900/80 hover:bg-red-800 text-red-200 border border-red-700 text-[11px] px-2 py-0.5 rounded font-bold transition"
              >
                Paradip Cyclone
              </button>
            </div>
          )}
        </div>
      )}

      <header className="bg-ocean-900 border-b border-ocean-800 px-4 py-3 flex flex-wrap items-center justify-between gap-2 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-600 p-2 rounded-xl text-white shadow-md">
            <Anchor className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
              <span>ORCA</span>
              <span className="text-xs bg-cyan-900 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-700">
                SIH26176
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">ISRO Marine Ecosystem Intelligence</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Harbor Location Quick Switcher */}
          <div className="flex items-center space-x-1.5 bg-ocean-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-ocean-700">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <select
              value={selectedHarbor.id}
              onChange={(e) => {
                const found = INDIAN_HARBORS.find((h) => h.id === e.target.value);
                if (found) onSelectHarbor(found);
              }}
              aria-label="Select Coastal Harbor"
              className="bg-transparent text-slate-200 text-xs font-bold outline-none cursor-pointer"
            >
              {INDIAN_HARBORS.map((h) => (
                <option key={h.id} value={h.id} className="bg-ocean-900 text-white">
                  📍 {h.name} ({h.state})
                </option>
              ))}
            </select>
          </div>

          {/* Network Connectivity Badge */}
          <div
            className={`flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-full font-semibold border ${
              isOffline
                ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                : 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isOffline ? 'OFFLINE PWA' : 'ONLINE (ISRO)'}</span>
          </div>

          {/* Vessel Profile Button */}
          <button
            onClick={onOpenVesselModal}
            className="flex items-center space-x-1 bg-ocean-800 hover:bg-ocean-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-ocean-700 transition"
          >
            <Ship className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold hidden sm:inline">{vesselProfile.vessel_name}</span>
            <span className="text-cyan-300 font-bold">({vesselProfile.length_m}m)</span>
          </button>

          {/* 8-Language Switcher */}
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            aria-label="Select Dialect Language"
            className="bg-ocean-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-ocean-700 font-medium outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="Marathi">मराठी (Koli/Malvani)</option>
            <option value="Hindi">हिन्दी</option>
            <option value="Gujarati">ગુજરાતી</option>
            <option value="Tamil">தமிழ்</option>
            <option value="Telugu">తెలుగు</option>
            <option value="Malayalam">മലയാളം</option>
            <option value="Kannada">ಕನ್ನಡ</option>
            <option value="Bengali">বাংলা</option>
            <option value="English">English</option>
          </select>
        </div>
      </header>
    </div>
  );
};
