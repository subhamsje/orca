import React, { useMemo } from 'react';
import { Fish, TrendingUp } from 'lucide-react';
import { PFZGround } from '../../types';

interface SpeciesMatrixProps {
  species: Record<string, number>;
  pfz: PFZGround[];
}

export const SpeciesMatrixPanel: React.FC<SpeciesMatrixProps> = ({ species, pfz }) => {
  const entries = useMemo(() => Object.entries(species || {}), [species]);
  const topPfz = pfz && pfz.length > 0 ? pfz[0] : null;

  if (entries.length === 0 && !topPfz) {
    return (
      <section className="glass rounded-2xl p-4 relative overflow-hidden">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">
          Species Bio-Thermal Matrix
        </h3>
        <p className="mt-3 text-xs text-ink-muted">
          No species suitability profile for current coordinate.
        </p>
      </section>
    );
  }

  return (
    <section className="glass rounded-2xl p-4 relative overflow-hidden">
      <div className="absolute inset-0 tactical-grid-fine opacity-30 pointer-events-none" />
      <header className="relative flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-1.5">
          <Fish className="w-3.5 h-3.5" /> Species Matrix · HSI
        </h3>
        <span className="chip chip-cyan text-[9px]">OCM-3 + MODIS</span>
      </header>

      <div className="relative space-y-2">
        {entries.map(([name, score]) => {
          const intensity = Math.max(0, Math.min(100, typeof score === 'number' ? score : 50));
          const color =
            intensity >= 75 ? 'emerald' : intensity >= 40 ? 'amber' : 'red';
          return (
            <div key={name} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-white truncate max-w-[12rem]">{name}</span>
                <span
                  className={`numeric text-[11px] ${
                    color === 'emerald'
                      ? 'text-emerald-300'
                      : color === 'amber'
                        ? 'text-amber-300'
                        : 'text-red-300'
                  }`}
                >
                  HSI {intensity}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-ocean-800 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    color === 'emerald'
                      ? 'bg-emerald-400'
                      : color === 'amber'
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                  }`}
                  style={{ width: `${intensity}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {topPfz && (
        <div className="relative mt-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-cyan-300/80 font-bold flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" /> Top Fishing Ground
              </p>
              <p className="text-sm font-bold text-white truncate">{topPfz.name ?? 'High Yield PFZ Zone'}</p>
              <p className="text-[11px] text-ink-muted">
                {(topPfz.distance_km ?? 14.2).toFixed(1)} km away · HSI {topPfz.hsi ?? 80} · {(topPfz.likely_species ?? ['Pelagic Schools']).slice(0, 2).join(', ')}
              </p>
            </div>
            <span className="chip chip-emerald text-[9px]">RANK #{topPfz.rank ?? 1}</span>
          </div>
        </div>
      )}
    </section>
  );
};