import React from 'react';
import { Anchor, Ship, Wifi, Volume2, ShieldAlert } from 'lucide-react';
import { VesselProfile } from '../types';

interface HeaderProps {
  vesselProfile: VesselProfile;
  onOpenVesselModal: () => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  isOffline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  vesselProfile,
  onOpenVesselModal,
  language,
  onLanguageChange,
  isOffline,
}) => {
  return (
    <header className="bg-ocean-900 border-b border-ocean-800 px-4 py-3 sticky top-0 z-50 flex items-center justify-between shadow-lg">
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
          <p className="text-xs text-slate-400 font-medium">ISRO Marine Intelligence Platform</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Network Connectivity Badge */}
        <div
          className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border ${
            isOffline
              ? 'bg-amber-950/80 text-amber-400 border-amber-800'
              : 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
          }`}
        >
          <Wifi className="w-3.5 h-3.5" />
          <span>{isOffline ? 'OFFLINE PWA' : 'ONLINE (ISRO)'}</span>
        </div>

        {/* Vessel Profile Quick Switcher */}
        <button
          onClick={onOpenVesselModal}
          className="flex items-center space-x-1.5 bg-ocean-800 hover:bg-ocean-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-ocean-700 transition"
        >
          <Ship className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold hidden sm:inline">{vesselProfile.vessel_name}</span>
          <span className="text-cyan-300 font-bold">({vesselProfile.length_m}m)</span>
        </button>

        {/* Language Selector */}
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          aria-label="Select Language"
          className="bg-ocean-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-ocean-700 font-medium outline-none focus:ring-1 focus:ring-cyan-500"
        >
          <option value="Marathi">मराठी (Koli/Malvani)</option>
          <option value="Hindi">हिन्दी</option>
          <option value="English">English</option>
        </select>
      </div>
    </header>
  );
};
