import React, { useMemo } from 'react';
import { Activity, AlertTriangle, Bot, Cpu, Sparkles } from 'lucide-react';
import { InterAgentEvent } from '../../types';
import { formatRelativeTime } from '../../utils/format';

interface InterAgentStreamProps {
  events: InterAgentEvent[] | undefined;
  className?: string;
}

const SENDER_COLOR: Record<string, string> = {
  WorldModelService: 'text-cyan-300',
  SafetyAgent: 'text-emerald-300',
  PFZAgent: 'text-amber-300',
  OceanService: 'text-sky-300',
  WaveService: 'text-blue-300',
  WeatherService: 'text-indigo-300',
  PathfinderAgent: 'text-violet-300',
  EconomicAgent: 'text-emerald-300',
  CollisionGuardAgent: 'text-red-300',
  OSINTAgent: 'text-fuchsia-300',
  OptimizationEngine: 'text-orange-300',
};

function senderClass(sender: string): string {
  return SENDER_COLOR[sender] ?? 'text-cyan-300';
}

export const InterAgentStream: React.FC<InterAgentStreamProps> = ({
  events,
  className = '',
}) => {
  const sorted = useMemo(
    () => [...(events ?? [])].sort((a, b) => b.timestamp - a.timestamp).slice(0, 14),
    [events],
  );

  if (!sorted.length) {
    return (
      <section className={`glass rounded-2xl p-4 ${className}`}>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" /> Inter-Agent Stream
        </h3>
        <p className="mt-3 text-xs text-ink-muted">No agent events recorded for this assessment yet.</p>
      </section>
    );
  }

  const uniqueSenders = new Set(sorted.map((e) => e.sender)).size;

  return (
    <section className={`glass rounded-2xl p-4 relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 tactical-grid-fine opacity-20 pointer-events-none" />
      <header className="relative flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" /> Inter-Agent Stream
        </h3>
        <div className="flex items-center gap-2">
          <span className="chip chip-cyan text-[9px]">{uniqueSenders} agents</span>
          <span className="chip text-[9px]">{sorted.length} events</span>
        </div>
      </header>

      <ol className="relative space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
        {sorted.map((e, idx) => {
          const lowConf = e.confidence < 0.85;
          return (
            <li
              key={`${e.timestamp}-${idx}`}
              className="group relative flex items-start gap-2.5 rounded-lg border border-cyan-500/10 bg-ocean-1000/40 hover:border-cyan-500/30 px-2.5 py-2 transition"
            >
              <span className="mt-1.5 flex h-2 w-2 shrink-0">
                <span
                  className={`absolute inline-flex h-2 w-2 rounded-full ${
                    lowConf ? 'bg-amber-400' : 'bg-cyan-400'
                  } opacity-70 animate-ping-soft`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    lowConf ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold leading-tight">
                  <span className={senderClass(e.sender)}>{e.sender}</span>
                  <span className="text-ink-muted"> · </span>
                  <span className="text-slate-200">{e.event_type}</span>
                </p>
                <p className="text-[10px] text-ink-muted leading-snug mt-0.5">
                  {summarizePayload(e)}
                </p>
              </div>
              <div className="flex flex-col items-end text-right shrink-0">
                <span className="text-[10px] text-cyan-300/80 numeric font-bold">
                  {Math.round(e.confidence * 100)}%
                </span>
                <span className="text-[9px] text-ink-muted">{formatRelativeTime(e.timestamp * 1000)}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

function summarizePayload(e: InterAgentEvent): string {
  const p = e.payload ?? {};
  const candidates = [
    p.hsi_score !== undefined && `HSI ${p.hsi_score}`,
    p.risk_score !== undefined && `risk ${p.risk_score}`,
    p.cpa_nautical_miles !== undefined && `CPA ${p.cpa_nautical_miles} NM`,
    p.safety_ratio !== undefined && `safety ${p.safety_ratio}`,
    p.wave_steepness_ratio !== undefined && `steepness ${p.wave_steepness_ratio}`,
    p.uncertainty_band !== undefined && `± ${p.uncertainty_band}`,
    p.rule_triggered !== undefined && `${p.rule_triggered}`,
    p.coordinate && `at ${(p.coordinate as { lat: number }).lat?.toFixed?.(2)}, ${(p.coordinate as { lon: number }).lon?.toFixed?.(2)}`,
  ].filter(Boolean);
  return candidates.join(' · ');
}