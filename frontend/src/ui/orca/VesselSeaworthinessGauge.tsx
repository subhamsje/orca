import React, { useMemo } from 'react';
import { Anchor, ShieldAlert, ShieldCheck, Waves } from 'lucide-react';
import { OceanState, VesselTwin } from '../../types';

interface VesselSeaworthinessProps {
  vessel: VesselTwin;
  ocean: OceanState;
  currentWaveSteepness: number;
  capsizingRisk: boolean;
}

export const VesselSeaworthinessGauge: React.FC<VesselSeaworthinessProps> = ({
  vessel,
  ocean,
  currentWaveSteepness,
  capsizingRisk,
}) => {
  // Deterministic capsize rule (per ORCA.md §1.5): H_crit = 0.6 * L * sin(θ_wave)
  // θ_wave ≈ 0.174 rad for typical Indian coastal conditions; we use the
  // backend's reported max_wave_height_m as the H_crit, and compare.
  const L = vessel.length_m;
  const Hcrit = vessel.max_wave_height_m;
  const Hcurr = ocean.wave_height_m;
  const Hratio = Hcrit > 0 ? Hcurr / Hcrit : 0;

  const { ratio, status, headroom, danger } = useMemo(() => {
    if (capsizingRisk) {
      return { ratio: 1, status: 'CAPSIZE DANGER', headroom: 0, danger: true };
    }
    const ratio = Math.min(1, Hratio);
    if (Hratio >= 0.85) {
      return { ratio, status: 'BORDERLINE', headroom: 1 - Hratio, danger: true };
    }
    if (Hratio >= 0.6) {
      return { ratio, status: 'TIGHT', headroom: 1 - Hratio, danger: false };
    }
    return { ratio, status: 'SAFE', headroom: 1 - Hratio, danger: false };
  }, [Hratio, capsizingRisk]);

  const C = 2 * Math.PI * 48;
  const offset = C * (1 - ratio);
  const color = danger ? '#ef4444' : ratio > 0.6 ? '#f59e0b' : '#22d3ee';

  return (
    <section className="glass rounded-2xl p-4 relative overflow-hidden">
      <div className="absolute inset-0 tactical-grid-fine opacity-20 pointer-events-none" />
      <header className="relative flex items-center justify-between gap-2 mb-2">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-2">
          <Anchor className="w-3.5 h-3.5" /> Vessel Seaworthiness
        </h3>
        <span className="chip text-[9px]">{L.toFixed(1)}m craft</span>
      </header>

      <div className="relative flex items-center gap-3">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden>
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="5"
            />
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke={color}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {danger ? (
              <ShieldAlert className="w-4 h-4 text-red-300 mb-0.5" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-300 mb-0.5" />
            )}
            <span className="text-base font-black text-white numeric leading-none">
              {(ratio * 100).toFixed(0)}%
            </span>
            <span className="text-[7.5px] font-bold uppercase tracking-[0.16em] text-ink-muted mt-0.5">
              H/H<sub>crit</sub>
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
              <p className="text-xs font-bold text-white numeric">{Hcurr.toFixed(2)}m</p>
            </div>
            <div className="rounded-md border border-cyan-500/20 bg-cyan-950/30 px-1.5 py-1">
              <p className="text-[8px] uppercase tracking-wider text-ink-muted font-bold">
                H<sub>crit</sub>
              </p>
              <p className="text-xs font-bold text-white numeric">{Hcrit.toFixed(2)}m</p>
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
                {currentWaveSteepness.toFixed(3)}
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