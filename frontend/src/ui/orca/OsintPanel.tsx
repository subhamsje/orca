import React from 'react';
import { AlertTriangle, Megaphone, Satellite, ShieldAlert, TrendingUp } from 'lucide-react';
import { OsintAdvisory, OsintIntelligence } from '../../types';
import { formatRelativeTime } from '../../utils/format';

interface OsintPanelProps {
  intelligence: OsintIntelligence | undefined;
}

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: 'border-red-500/45 bg-red-950/40 text-red-200',
  HIGH: 'border-amber-500/45 bg-amber-950/40 text-amber-200',
  MODERATE: 'border-cyan-500/30 bg-cyan-950/40 text-cyan-200',
  LOW: 'border-slate-500/30 bg-slate-900/40 text-slate-200',
};

function severityClass(s: string): string {
  return SEVERITY_COLOR[s] ?? SEVERITY_COLOR.LOW;
}

export const OsintPanel: React.FC<OsintPanelProps> = ({ intelligence }) => {
  if (!intelligence) {
    return (
      <section className="glass rounded-2xl p-5">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-2">
          <Megaphone className="w-3.5 h-3.5" /> OSINT Sector Intelligence
        </h3>
        <p className="mt-3 text-xs text-ink-muted">
          No live OSINT intelligence returned for this assessment.
        </p>
      </section>
    );
  }

  const advisories = intelligence.active_security_advisories ?? [];
  const marketPorts = Object.entries(intelligence.agmarknet_wholesale_summary ?? {}).slice(0, 4);

  return (
    <section className="glass rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute inset-0 tactical-grid-fine opacity-20 pointer-events-none" />
      <header className="relative flex items-center justify-between gap-2 mb-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-2">
          <Megaphone className="w-3.5 h-3.5" /> OSINT Sector Intelligence
        </h3>
        <span className="chip chip-violet text-[9px]">{intelligence.osint_data_sources.length} sources</span>
      </header>

      <div className="relative grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-xl border border-violet-500/25 bg-violet-950/30 p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-violet-300/80 font-bold flex items-center gap-1.5">
            <Satellite className="w-3 h-3" /> VIIRS Trawlers
          </p>
          <p className="text-xl font-black text-white numeric leading-none mt-1">
            {intelligence.viirs_nightlight_trawlers_detected}
          </p>
        </div>
        <div className="rounded-xl border border-violet-500/25 bg-violet-950/30 p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-violet-300/80 font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3" /> Active Advisories
          </p>
          <p className="text-xl font-black text-white numeric leading-none mt-1">{advisories.length}</p>
        </div>
      </div>

      {advisories.length > 0 && (
        <ul className="relative space-y-2 mb-4 max-h-[200px] overflow-y-auto">
          {advisories.map((a: OsintAdvisory) => (
            <li
              key={a.incident_id}
              className={`rounded-xl border px-3 py-2 ${severityClass(a.severity)}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  {a.type}
                </p>
                <span className="text-[9px] uppercase font-bold tracking-wider opacity-80">
                  {a.severity}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-100 leading-snug">{a.description}</p>
              <p className="mt-1 text-[9px] text-ink-muted">{a.source} · {formatRelativeTime(a.timestamp * 1000)}</p>
            </li>
          ))}
        </ul>
      )}

      {marketPorts.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-emerald-300/80 font-bold mb-1.5 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> Wholesale Auction Rates (₹/kg)
          </p>
          <div className="space-y-1.5">
            {marketPorts.map(([portName, rates]) => (
              <div
                key={portName}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 rounded-lg border border-emerald-500/15 bg-ocean-1000/60 px-2.5 py-1.5 text-[10px]"
              >
                <span className="font-bold text-slate-100 truncate">{portName}</span>
                <span className="text-cyan-200 numeric">B {rates.Bangda}</span>
                <span className="text-emerald-200 numeric">S {rates.Surmai}</span>
                <span className="text-amber-200 numeric">P {rates.Poplet}</span>
                <span className="text-ink-muted numeric">T {rates.Tarli}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="relative mt-3 text-[9px] text-ink-muted">{intelligence.data_freshness}</p>
    </section>
  );
};