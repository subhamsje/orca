import React, { useMemo, useState } from 'react';
import { Compass, Gauge, Leaf, Map as MapIcon, Route, ShieldCheck } from 'lucide-react';
import { MultiObjectiveRoutes, MultiObjectiveCandidate } from '../../types';
import { formatKm } from '../../utils/format';

interface MultiObjectiveRoutePickerProps {
  routes?: MultiObjectiveRoutes;
  onFlyToWaypoints?: (waypoints: [number, number][]) => void;
}

const OBJECTIVE_META: Record<
  string,
  { label: string; tone: 'emerald' | 'amber' | 'cyan'; Icon: React.ComponentType<{ className?: string }> }
> = {
  SAFEST_DETOUR: { label: 'Safest Detour', tone: 'emerald', Icon: ShieldCheck },
  LOWEST_FUEL: { label: 'Lowest Fuel', tone: 'cyan', Icon: Leaf },
  HIGHEST_NET_VALUE: { label: 'Highest Net Value', tone: 'amber', Icon: Compass },
  safest_detour: { label: 'Safest Detour', tone: 'emerald', Icon: ShieldCheck },
  lowest_fuel: { label: 'Lowest Fuel', tone: 'cyan', Icon: Leaf },
  highest_net_value: { label: 'Highest Net Value', tone: 'amber', Icon: Compass },
};

export const MultiObjectiveRoutePicker: React.FC<MultiObjectiveRoutePickerProps> = ({
  routes,
  onFlyToWaypoints,
}) => {
  const candidates: MultiObjectiveCandidate[] = useMemo(() => routes?.candidate_routes || [], [routes]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>(
    routes?.recommended_strategy || 'SAFEST_DETOUR',
  );

  const selected = useMemo(
    () => candidates.find((c) => c.strategy === selectedStrategy) || candidates[0],
    [candidates, selectedStrategy],
  );

  if (!routes || candidates.length === 0) {
    return (
      <section className="glass rounded-2xl p-4 relative overflow-hidden">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">
          Multi-Objective Route Engine
        </h3>
        <p className="mt-3 text-xs text-ink-muted">Awaiting route candidates.</p>
      </section>
    );
  }

  return (
    <section className="glass rounded-2xl p-4 relative overflow-hidden">
      <div className="absolute inset-0 tactical-grid-fine opacity-30 pointer-events-none" />
      <header className="relative flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-1.5">
          <Route className="w-3.5 h-3.5" /> Multi-Objective Pareto Routes
        </h3>
        <span className="chip chip-cyan text-[9px]">{candidates.length} candidates</span>
      </header>

      {/* Candidate tabs */}
      <div className="relative grid grid-cols-3 gap-2 mb-3">
        {candidates.map((c) => {
          const isSelected = c.strategy === (selected?.strategy ?? selectedStrategy);
          const meta = OBJECTIVE_META[c.strategy] || {
            label: c.strategy.replace(/_/g, ' '),
            tone: 'cyan',
            Icon: Route,
          };
          return (
            <button
              key={c.strategy}
              type="button"
              onClick={() => {
                setSelectedStrategy(c.strategy);
                if (c.waypoints?.length) {
                  onFlyToWaypoints?.(c.waypoints);
                }
              }}
              className={`rounded-xl border p-2.5 text-left transition relative ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_20px_-4px_rgba(34,211,238,0.4)]'
                  : 'border-cyan-500/15 bg-ocean-1000/50 hover:border-cyan-500/30'
              }`}
            >
              <span
                className={`inline-flex p-1.5 rounded-lg mb-1.5 ${
                  meta.tone === 'emerald'
                    ? 'bg-emerald-950 text-emerald-300'
                    : meta.tone === 'amber'
                      ? 'bg-amber-950 text-amber-300'
                      : 'bg-cyan-950 text-cyan-300'
                }`}
              >
                <meta.Icon className="w-4 h-4" />
              </span>
              <p className="text-xs font-bold text-white leading-tight">{meta.label}</p>
              <p className="text-[10px] text-ink-muted mt-1 line-clamp-2">{c.description}</p>
              <div className="mt-2 flex items-baseline gap-2 text-[10px] text-ink-muted">
                <span className="numeric font-bold text-white">{c.safety_score ?? 85}</span>
                <span>safety</span>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="relative rounded-xl border border-cyan-500/15 bg-ocean-1000/70 px-4 py-3 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Distance" value={formatKm(selected.distance_km ?? 14.2)} Icon={MapIcon} />
            <Stat label="ETA" value={`${selected.estimated_mins ?? 45} min`} Icon={Gauge} />
            <Stat label="Fuel" value={`${(selected.fuel_liters ?? 12.0).toFixed(1)} L`} Icon={Leaf} />
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">{selected.description}</p>
        </div>
      )}

      {routes.legal_constraints_checked?.length > 0 && (
        <p className="relative mt-3 text-[10px] text-ink-muted">
          Constraints honored ·{' '}
          {routes.legal_constraints_checked.map((c, i) => (
            <span key={c} className="text-cyan-300">
              {i > 0 && ' · '}
              {c}
            </span>
          ))}
        </p>
      )}
    </section>
  );
};

const Stat: React.FC<{
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = ({ label, value, Icon }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-ink-muted font-bold flex items-center gap-1">
      <Icon className="w-3 h-3" /> {label}
    </p>
    <p className="text-sm font-bold text-white numeric">{value}</p>
  </div>
);