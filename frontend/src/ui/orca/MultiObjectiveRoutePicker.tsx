import React, { useState } from 'react';
import {
  Fuel,
  Gauge,
  Leaf,
  Map as MapIcon,
  Route as RouteIcon,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { MultiObjectiveCandidate, MultiObjectiveRoutes } from '../../types';
import { formatKm } from '../../utils/format';

interface MultiObjectiveRoutePickerProps {
  routes: MultiObjectiveRoutes | undefined;
  onFlyToWaypoints?: (waypoints: [number, number][]) => void;
}

const STRATEGY_META: Record<
  string,
  { label: string; Icon: React.ComponentType<{ className?: string }>; tone: 'cyan' | 'emerald' | 'amber' }
> = {
  SAFEST_DETOUR: { label: 'Safest Detour', Icon: ShieldCheck, tone: 'emerald' },
  LOWEST_FUEL: { label: 'Lowest Fuel', Icon: Fuel, tone: 'cyan' },
  HIGHEST_NET_VALUE: { label: 'Highest Net Value', Icon: TrendingUp, tone: 'amber' },
};

export const MultiObjectiveRoutePicker: React.FC<MultiObjectiveRoutePickerProps> = ({
  routes,
  onFlyToWaypoints,
}) => {
  const [activeStrategy, setActiveStrategy] = useState<string | null>(null);
  const active = activeStrategy ?? routes?.recommended_strategy ?? null;

  if (!routes || !routes.candidate_routes?.length) {
    return (
      <section className="glass rounded-2xl p-5">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
          Multi-Objective Routing
        </h3>
        <p className="mt-3 text-xs text-ink-muted">No route candidates from the optimizer.</p>
      </section>
    );
  }

  const selected: MultiObjectiveCandidate | undefined =
    routes.candidate_routes.find((c) => c.strategy === active) ?? routes.candidate_routes[0];

  return (
    <section className="glass rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute inset-0 tactical-grid-fine opacity-30 pointer-events-none" />
      <header className="relative flex items-center justify-between gap-2 mb-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-2">
          <RouteIcon className="w-3.5 h-3.5" /> Pareto Frontier
        </h3>
        <span className="chip chip-cyan">{routes.optimization_version}</span>
      </header>

      <div className="relative grid grid-cols-3 gap-2 mb-4">
        {routes.candidate_routes.map((c) => {
          const meta = STRATEGY_META[c.strategy] ?? STRATEGY_META.LOWEST_FUEL;
          const isActive = selected?.strategy === c.strategy;
          const isRecommended = routes.recommended_strategy === c.strategy;
          return (
            <button
              key={c.strategy}
              type="button"
              onClick={() => {
                setActiveStrategy(c.strategy);
                onFlyToWaypoints?.(c.waypoints);
              }}
              className={`group relative rounded-xl border p-3 text-left transition overflow-hidden ${
                isActive
                  ? 'border-cyan-400/70 bg-cyan-950/40 shadow-[0_0_18px_-4px_rgba(34,211,238,0.55)]'
                  : 'border-cyan-500/15 bg-ocean-1000/60 hover:border-cyan-500/40'
              }`}
            >
              {isRecommended && (
                <span className="absolute top-1.5 right-1.5 chip chip-emerald text-[9px] px-1.5 py-0">
                  REC
                </span>
              )}
              <span
                className={`inline-flex w-7 h-7 rounded-lg items-center justify-center mb-2 ${
                  meta.tone === 'emerald'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : meta.tone === 'amber'
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-cyan-500/15 text-cyan-300'
                }`}
              >
                <meta.Icon className="w-4 h-4" />
              </span>
              <p className="text-xs font-bold text-white leading-tight">{meta.label}</p>
              <p className="text-[10px] text-ink-muted mt-1 line-clamp-2">{c.description}</p>
              <div className="mt-2 flex items-baseline gap-2 text-[10px] text-ink-muted">
                <span className="numeric font-bold text-white">{c.safety_score}</span>
                <span>safety</span>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="relative rounded-xl border border-cyan-500/15 bg-ocean-1000/70 px-4 py-3 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Distance" value={formatKm(selected.distance_km)} Icon={MapIcon} />
            <Stat label="ETA" value={`${selected.estimated_mins} min`} Icon={Gauge} />
            <Stat label="Fuel" value={`${selected.fuel_liters.toFixed(1)} L`} Icon={Leaf} />
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