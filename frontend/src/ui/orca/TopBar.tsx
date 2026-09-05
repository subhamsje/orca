import React, { useEffect, useMemo, useState } from 'react';
import {
  Anchor,
  Command,
  Crosshair,
  Globe,
  Languages,
  Radio,
  Search,
  Ship,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { HarborLocation } from '../../utils/harbors';
import { TripAssessmentResponse } from '../../types';
import { formatLatLon } from '../../utils/format';

interface TopBarProps {
  isOffline: boolean;
  selectedHarbor: HarborLocation | null;
  assessment: TripAssessmentResponse | null;
  onOpenCommandPalette: () => void;
  onSelectHarbor: (h: HarborLocation) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  onOpenVessel: () => void;
  vesselName: string;
  vesselLengthM: number;
}

const LANGUAGES: Array<{ code: string; native: string }> = [
  { code: 'English', native: 'English' },
  { code: 'Marathi', native: 'मराठी' },
  { code: 'Hindi', native: 'हिन्दी' },
  { code: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'Tamil', native: 'தமிழ்' },
  { code: 'Telugu', native: 'తెలుగు' },
  { code: 'Malayalam', native: 'മലയാളം' },
  { code: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'Bengali', native: 'বাংলা' },
];

export const TopBar: React.FC<TopBarProps> = ({
  isOffline,
  selectedHarbor,
  assessment,
  onOpenCommandPalette,
  onSelectHarbor,
  language,
  onLanguageChange,
  onOpenVessel,
  vesselName,
  vesselLengthM,
}) => {
  const isMacLike = useMemo(
    () =>
      typeof navigator !== 'undefined' &&
      /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent),
    [],
  );
  const modKey = isMacLike ? '⌘' : 'Ctrl';

  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const satCount = assessment?.explanation?.provenance_summary?.satellites?.length;
  const modelCount = assessment?.explanation?.provenance_summary?.ocean_models?.length;
  const freshness = assessment?.provenance?.data_freshness;

  return (
    <header className="relative z-40 glass-strong border-b border-cyan-500/20">
      <div className="flex items-center gap-3 px-4 sm:px-5 py-2.5">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-700 p-[1.5px] shadow-[0_0_18px_-2px_rgba(34,211,238,0.5)]">
            <div className="w-full h-full rounded-[10px] bg-ocean-1000 flex items-center justify-center">
              <Anchor className="w-4 h-4 text-cyan-300" />
            </div>
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-[15px] font-black tracking-[0.18em] bg-gradient-to-r from-cyan-300 via-sky-200 to-white bg-clip-text text-transparent">
              ORCA
            </p>
            <p className="text-[9px] uppercase tracking-[0.18em] text-ink-muted font-bold">
              Universal Marine Ops
            </p>
          </div>
        </div>

        {/* Search trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="ml-1 sm:ml-3 flex-1 max-w-xs sm:max-w-sm flex items-center gap-2 rounded-xl bg-ocean-1000/60 border border-cyan-500/20 hover:border-cyan-500/40 px-3 py-2 text-xs text-ink-muted hover:text-cyan-200 transition group"
          aria-label="Open command palette"
        >
          <Search className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
          <span className="truncate">Search or paste coords…</span>
          <span className="ml-auto chip text-[9px] shrink-0">
            {modKey}K
          </span>
        </button>

        {/* Harbor picker */}
        <div className="hidden lg:flex items-center gap-2 rounded-xl bg-ocean-1000/70 border border-cyan-500/20 px-3 py-2">
          <Crosshair className="w-3.5 h-3.5 text-amber-300 animate-pulse-soft" />
          <div className="leading-tight">
            <p className="text-[11px] font-bold text-cyan-200 truncate max-w-[12rem]">
              {selectedHarbor?.name ?? 'No harbor'}
            </p>
            <p className="text-[9px] uppercase tracking-wider text-ink-muted font-bold">
              {selectedHarbor?.country ?? ''}
            </p>
          </div>
        </div>

        {/* Language */}
        <label className="hidden md:flex items-center gap-1.5 rounded-xl bg-ocean-1000/70 border border-cyan-500/20 px-2 py-1.5">
          <Languages className="w-3.5 h-3.5 text-cyan-300" />
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="bg-transparent text-[11px] font-bold text-cyan-200 focus:outline-none cursor-pointer pr-1"
            aria-label="Voice language"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-ocean-1000 text-white">
                {l.native}
              </option>
            ))}
          </select>
        </label>

        {/* Vessel */}
        <button
          type="button"
          onClick={onOpenVessel}
          className="hidden sm:flex items-center gap-2 rounded-xl bg-ocean-1000/70 border border-cyan-500/20 hover:border-cyan-500/40 px-3 py-2 text-xs font-bold text-cyan-200 transition"
        >
          <Ship className="w-3.5 h-3.5" />
          <span className="hidden lg:inline max-w-[10rem] truncate">{vesselName}</span>
          <span className="text-cyan-300/80 numeric">{vesselLengthM}m</span>
        </button>

        {/* Connectivity */}
        <div
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${
            isOffline
              ? 'border-amber-500/40 bg-amber-950/40 text-amber-200'
              : 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
          }`}
        >
          {isOffline ? (
            <WifiOff className="w-3.5 h-3.5" />
          ) : (
            <Wifi className="w-3.5 h-3.5 animate-pulse" />
          )}
          {isOffline ? 'OFFLINE' : 'LIVE MESH'}
        </div>

        {/* UTC clock */}
        <div className="hidden md:flex flex-col items-end text-right leading-tight">
          <p className="text-[11px] font-bold text-white numeric">
            {clock.toUTCString().slice(17, 22)}
            <span className="text-cyan-300"> UTC</span>
          </p>
          <p className="text-[9px] uppercase tracking-wider text-ink-muted font-bold">
            {clock.toUTCString().slice(5, 16)}
          </p>
        </div>
      </div>

      {/* Sub-strip: live coordinate readout + freshness */}
      <div className="px-4 sm:px-5 py-1.5 border-t border-cyan-500/10 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.14em] font-bold text-ink-muted">
        <span className="flex items-center gap-1.5 text-cyan-300/90">
          <Globe className="w-3 h-3" />
          {assessment?.coordinate
            ? formatLatLon(assessment.coordinate.lat, assessment.coordinate.lon)
            : selectedHarbor
              ? formatLatLon(selectedHarbor.lat, selectedHarbor.lon)
              : '—'}
        </span>
        {assessment && (
          <>
            {(satCount != null || modelCount != null) && (
              <span className="text-cyan-300/60">
                {satCount != null ? `${satCount} sats` : '— sats'} · {modelCount != null ? `${modelCount} models` : '— models'}
              </span>
            )}
            {freshness && (
              <span className="flex items-center gap-1.5 text-emerald-300/80">
                <Radio className="w-3 h-3 animate-pulse" />
                {freshness}
              </span>
            )}
          </>
        )}
      </div>
    </header>
  );
};