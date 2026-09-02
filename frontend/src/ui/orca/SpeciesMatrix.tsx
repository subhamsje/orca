import React from 'react';
import { Fish, TrendingUp } from 'lucide-react';
import { PFZGround } from '../../types';

interface SpeciesPanelProps {
  species: Record<string, number>;
  pfz: PFZGround[];
}

function speciesLabel(s: string): string {
  // "Bangda (Indian Mackerel)" → "Bangda"
  return s.split('(')[0].trim();
}

export const SpeciesMatrixPanel: React.FC<SpeciesPanelProps> = ({ species, pfz }) => {
  const entries = Object.entries(species).sort((a, b) => Number(b[1]) - Number(a[1]));
  const topPfz = pfz?.[0];

  return (
    <section className="glass rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute inset-0 tactical-grid-fine opacity-20 pointer-events-none" />
      <header className="relative flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-2">
          <Fish className="w-3.5 h-3.5" /> Habitat Suitability Index
        </h3>
        <span className="chip chip-cyan text-[9px]">INCOIS OCM-3</span>
      </header>

      <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-2">
        {entries.map(([s, score]) => {
          const intensity = Math.max(0, Math.min(100, Number(score)));
          return (
            <div
              key={s}
              className="rounded-xl border border-emerald-500/15 bg-ocean-1000/60 px-3 py-2.5 space-y-1"
            >
              <p className="text-[10px] uppercase tracking-wider text-ink-muted font-bold truncate">
                {speciesLabel(s)}
              </p>
              <p className="text-xl font-black text-white numeric leading-none">{score}</p>
              <div className="h-1 rounded-full bg-ocean-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${
                    intensity > 75
                      ? 'bg-emerald-400'
                      : intensity > 50
                        ? 'bg-cyan-400'
                        : 'bg-amber-400'
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
              <p className="text-sm font-bold text-white truncate">{topPfz.name}</p>
              <p className="text-[11px] text-ink-muted">
                {topPfz.distance_km.toFixed(1)} km away · HSI {topPfz.hsi} · {topPfz.likely_species.slice(0, 2).join(', ')}
              </p>
            </div>
            <span className="chip chip-emerald text-[9px]">RANK #{topPfz.rank}</span>
          </div>
        </div>
      )}
    </section>
  );
};