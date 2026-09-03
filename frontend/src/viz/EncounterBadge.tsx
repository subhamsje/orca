import React from 'react';
import { Compass, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { EncounterState } from './envState';
import { bearingToCompass } from '../utils/format';

/**
 * EncounterBadge — small floating glass card that labels the
 * vessel-vs-wave encounter state.
 *
 *  - BEAM / HEAD / FOLLOWING are the three classical relative-sea
 *    states. We add QUARTERING + CROSS to mirror maritime briefings.
 *  - When `encounter.unsafeForHeading` is true the badge flips to a
 *    pulsing warning treatment (purely visual; the user still sees the
 *    risk score on the verdict hero).
 *  - If the backend has no wave direction, we render an "Awaiting
 *    wave direction" pill rather than inventing a state.
 */

interface EncounterBadgeProps {
  encounter: EncounterState;
  vesselHeadingDeg: number | null;
  waveDirDeg: number | null;
  /** Display the unsafe pulse animation. */
  pulse?: boolean;
}

const LABEL: Record<EncounterState['relative'], string> = {
  HEAD: 'HEAD SEAS',
  FOLLOWING: 'FOLLOWING',
  BEAM: 'BEAM SEAS',
  QUARTERING: 'QUARTERING',
  CROSS: 'CROSS SEA',
  UNKNOWN: 'NO WAVE DATA',
};

const ACCENT: Record<EncounterState['relative'], string> = {
  HEAD: 'border-red-500/50 bg-red-950/40 text-red-200',
  FOLLOWING: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200',
  BEAM: 'border-amber-500/40 bg-amber-950/30 text-amber-200',
  QUARTERING: 'border-cyan-500/40 bg-cyan-950/30 text-cyan-200',
  CROSS: 'border-violet-500/40 bg-violet-950/30 text-violet-200',
  UNKNOWN: 'border-slate-500/30 bg-slate-900/40 text-slate-300',
};

export const EncounterBadge: React.FC<EncounterBadgeProps> = ({
  encounter,
  vesselHeadingDeg,
  waveDirDeg,
  pulse = true,
}) => {
  const Icon =
    encounter.relative === 'UNKNOWN'
      ? Compass
      : encounter.unsafeForHeading
        ? AlertTriangle
        : ShieldCheck;

  const tone = ACCENT[encounter.relative];
  const showPulse = pulse && encounter.unsafeForHeading;

  return (
    <div
      className={`glass-strong rounded-2xl px-3.5 py-2.5 border ${tone} transition-colors`}
      role="status"
      aria-live="polite"
      aria-label={`Vessel encounter: ${LABEL[encounter.relative]}`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${showPulse ? 'animate-pulse' : ''}`} />
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-ink-muted">
            Wave vs Vessel
          </p>
          <p className="text-sm font-black tracking-tight leading-tight">
            {LABEL[encounter.relative]}
          </p>
        </div>
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-[10px]">
        <span className="flex flex-col leading-tight">
          <span className="text-ink-muted uppercase text-[8.5px] tracking-wider">Wave</span>
          <span className="font-bold numeric">
            {waveDirDeg != null ? `${bearingToCompass(waveDirDeg)} ${waveDirDeg.toFixed(0)}°` : '—'}
          </span>
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-ink-muted uppercase text-[8.5px] tracking-wider">Heading</span>
          <span className="font-bold numeric">
            {vesselHeadingDeg != null ? `${vesselHeadingDeg.toFixed(0)}°` : '—'}
          </span>
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-ink-muted uppercase text-[8.5px] tracking-wider">Rel</span>
          <span className="font-bold numeric">
            {encounter.angleDeg != null ? `${encounter.angleDeg.toFixed(0)}°` : '—'}
          </span>
        </span>
      </div>
      {encounter.encounterRatio != null && (
        <p className="mt-1 text-[10px] text-ink-muted">
          Enc ratio{' '}
          <span className="font-bold numeric text-white">
            {encounter.encounterRatio.toFixed(2)}
          </span>
          {encounter.unsafeForHeading && (
            <span className="ml-1 text-red-300 font-bold">· near resonance</span>
          )}
        </p>
      )}
    </div>
  );
};

EncounterBadge.displayName = 'EncounterBadge';