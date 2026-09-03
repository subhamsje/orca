import React from 'react';
import { Anchor, ShieldAlert, ShieldCheck, Waves } from 'lucide-react';
import { OceanState, VesselTwin } from '../../types';

interface VesselSeaworthinessGaugeProps {
  vessel: VesselTwin;
  ocean: OceanState;
  currentWaveSteepness?: number;
  capsizingRisk?: boolean;
}

export const VesselSeaworthinessGauge: React.FC<VesselSeaworthinessGaugeProps> = ({
  vessel,
  ocean,
  currentWaveSteepness = 0.02,
  capsizingRisk = false,
}) => {
  const L = vessel?.length_m ?? 8.5;
  const Hcurr = ocean?.wave_height_m ?? 1.2;
  const Hcrit = Math.max(0.1, L * 0.6);
  const ratio = Math.min(2.0, Hcurr / Hcrit);
  const headroom = Math.max(0, 1 - ratio);

  const danger = capsizingRisk || ratio >= 0.85;
  const status = danger
    ? 'CRITICAL CAPSIZING RISK'
    : ratio > 0.6
      ? 'MODERATE WAVE SWELL'
      : 'SEAWORTHY · SAFE';

  const progressPct = Math.min(100, Math.round(ratio * 100));

  return (
    <section className="glass rounded-2xl p-4 relative overflow-hidden">
      <div className="absolute inset-0 tactical-grid-fine opacity-30 pointer-events-none" />
      <header className="relative flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-1.5">
          <Anchor className="w-3.5 h-3.5" /> Hydrodynamic Seaworthiness
        </h3>
        <span className="chip text-[9px]">{(L ?? 8.5).toFixed(1)}m craft</span>
      </header>

      <div className="relative flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="5" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke={danger ? '#ef4444' : ratio > 0.6 ? '#f59e0b' : '#10b981'}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 34}
              strokeDashoffset={2 * Math.PI * 34 * (1 - Math.min(1, ratio))}
              style={{ transition: 'stroke-dashoffset 600ms ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {danger ? (
              <ShieldAlert className="w-4 h-4 text-red-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
            <span className="text-[10px] font-black text-white numeric leading-none mt-0.5">
              {progressPct}%
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <p
            className={`text-xs font-bold ${
              danger ? 'text-red-300' : ratio > 0.6 ? 'text-amber-300' : 'text-emerald-300'
            }`}
          >
            {status}
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="rounded-md border border-cyan-500/20 bg-cyan-950/30 px-1.5 py-1">
              <p className="text-[8px] uppercase tracking-wider text-ink-muted font-bold">
                H now
              </p>
              <p className="text-xs font-bold text-white numeric">{(Hcurr ?? 1.2).toFixed(2)}m</p>
            </div>
            <div className="rounded-md border border-cyan-500/20 bg-cyan-950/30 px-1.5 py-1">
              <p className="text-[8px] uppercase tracking-wider text-ink-muted font-bold">
                H<sub>crit</sub>
              </p>
              <p className="text-xs font-bold text-white numeric">{(Hcrit ?? 5.1).toFixed(2)}m</p>
            </div>
            <div className="rounded-md border border-cyan-500/20 bg-cyan-950/30 px-1.5 py-1">
              <p className="text-[8px] uppercase tracking-wider text-ink-muted font-bold">
                Headroom
              </p>
              <p
                className={`text-xs font-bold numeric ${
                  headroom < 0.15 ? 'text-red-300' : 'text-emerald-300'
                }`}
              >
                {(headroom * 100).toFixed(0)}%
              </p>
            </div>
            <div className="rounded-md border border-cyan-500/20 bg-cyan-950/30 px-1.5 py-1">
              <p className="text-[8px] uppercase tracking-wider text-ink-muted font-bold flex items-center gap-1">
                <Waves className="w-2.5 h-2.5" /> Steepness
              </p>
              <p className="text-xs font-bold text-white numeric">
                {(currentWaveSteepness ?? 0.02).toFixed(3)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="relative mt-2 text-[9px] text-ink-muted leading-snug">
        Rule: H<sub>crit</sub> = 0.6 × L × sin(θ<sub>wave</sub>). Wave steepness
        above 0.05 doubles capsize risk.
      </p>
    </section>
  );
};