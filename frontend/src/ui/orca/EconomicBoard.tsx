import React from 'react';
import { Anchor, Banknote, Fuel, TrendingUp } from 'lucide-react';
import { EconomicResult } from '../../types';
import { formatINR, formatINRSigned, formatKm } from '../../utils/format';

interface EconomicBoardProps {
  economic: EconomicResult;
}

export const EconomicBoard: React.FC<EconomicBoardProps> = ({ economic }) => {
  return (
    <section className="glass rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute inset-0 tactical-grid-fine opacity-20 pointer-events-none" />
      <header className="relative flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300 flex items-center gap-2">
          <Banknote className="w-3.5 h-3.5" /> Profit Maximizing Docks
        </h3>
        <span className="chip chip-emerald text-[9px]">Auction · AGMARKNET</span>
      </header>

      <div className="relative grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-3">
          <p className="text-[10px] uppercase tracking-wider text-emerald-300/80 font-bold">
            Best Dock
          </p>
          <p className="text-sm font-bold text-white truncate">
            {economic.best_docking_harbor}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-3">
          <p className="text-[10px] uppercase tracking-wider text-emerald-300/80 font-bold">
            Expected Net
          </p>
          <p className="text-base font-black text-emerald-200 numeric">
            ₹{formatINR(economic.max_expected_profit_inr)}
          </p>
        </div>
      </div>

      <div className="relative -mx-1 overflow-x-auto rounded-xl border border-emerald-500/15">
        <table className="w-full text-xs text-left text-slate-200 min-w-[28rem]">
          <thead className="text-[10px] uppercase bg-ocean-1000 text-ink-muted font-bold border-b border-emerald-500/15">
            <tr>
              <th className="px-3 py-2">Harbor</th>
              <th className="px-2 py-2 text-right">Rate</th>
              <th className="px-2 py-2 text-right">Net</th>
              <th className="px-2 py-2 text-right">+km</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-500/10">
            {economic.harbor_comparisons.map((h, i) => (
              <tr
                key={`${h.harbor_name}-${i}`}
                className={
                  h.recommended
                    ? 'bg-emerald-950/30 text-emerald-100'
                    : 'hover:bg-ocean-1000/50'
                }
              >
                <td className="px-3 py-2 truncate max-w-[14rem]">
                  <span className="flex items-center gap-1.5">
                    {h.recommended && (
                      <span className="text-emerald-400" aria-hidden>
                        ★
                      </span>
                    )}
                    <Anchor className="w-3 h-3 text-cyan-400 shrink-0" />
                    {h.harbor_name}
                  </span>
                </td>
                <td className="px-2 py-2 text-right numeric">₹{h.unit_price_per_kg}/kg</td>
                <td
                  className={`px-2 py-2 text-right numeric font-bold ${
                    h.net_profit_inr < 0 ? 'text-red-300' : 'text-emerald-300'
                  }`}
                >
                  {formatINRSigned(h.net_profit_inr)}
                </td>
                <td className="px-2 py-2 text-right numeric text-ink-muted">
                  {formatKm(h.extra_distance_km)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="relative mt-3 text-[10px] text-ink-muted flex items-center gap-1.5">
        <Fuel className="w-3 h-3" /> Fuel cost (recommended trip): ₹
        {formatINR(economic.fuel_cost_total_inr)} · Target catch {economic.estimated_catch_kg} kg ·{' '}
        {economic.target_species}
      </p>
    </section>
  );
};