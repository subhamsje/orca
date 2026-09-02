import React, { useMemo } from 'react';
import { Activity, AlertCircle, Database, Satellite, ShieldCheck } from 'lucide-react';
import { TripAssessmentResponse } from '../../types';
import { formatRelativeTime } from '../../utils/format';

interface ProvenanceSourcePanelProps {
  assessment: TripAssessmentResponse | null;
}

const STATE_TONE: Record<string, string> = {
  OBSERVED: 'text-emerald-300 border-emerald-700/40 bg-emerald-950/30',
  NEAR_REAL_TIME: 'text-cyan-300 border-cyan-700/40 bg-cyan-950/30',
  NOWCAST: 'text-cyan-300 border-cyan-700/40 bg-cyan-950/30',
  FORECAST: 'text-amber-300 border-amber-700/40 bg-amber-950/30',
  MODEL: 'text-cyan-300 border-cyan-700/40 bg-cyan-950/30',
  SATELLITE: 'text-cyan-300 border-cyan-700/40 bg-cyan-950/30',
  BUOY: 'text-emerald-300 border-emerald-700/40 bg-emerald-950/30',
  STATION: 'text-emerald-300 border-emerald-700/40 bg-emerald-950/30',
  CACHED: 'text-ink-muted border-slate-700/40 bg-slate-900/30',
  STALE: 'text-amber-300 border-amber-700/40 bg-amber-950/30',
  UNAVAILABLE: 'text-amber-200 border-amber-700/40 bg-amber-950/30',
};

export const ProvenanceSourcePanel: React.FC<ProvenanceSourcePanelProps> = ({ assessment }) => {
  const records = assessment?.canonical_records;
  const unavailable = assessment?.canonical_data_unavailable ?? [];

  const bySource = useMemo(() => {
    if (!records) return [];
    const seen = new Map<string, { source: string; states: Set<string>; params: string[] }>();
    for (const [param, rec] of Object.entries(records)) {
      if (!rec || rec.value == null) continue;
      const key = rec.source;
      if (!seen.has(key)) {
        seen.set(key, { source: key, states: new Set(), params: [] });
      }
      const entry = seen.get(key)!;
      entry.states.add(rec.state);
      entry.params.push(param);
    }
    return Array.from(seen.values());
  }, [records]);

  if (!records) {
    return null;
  }

  return (
    <section className="glass rounded-2xl p-4 relative overflow-hidden">
      <div className="absolute inset-0 tactical-grid-fine opacity-20 pointer-events-none" />
      <header className="relative flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-2">
          <Database className="w-3.5 h-3.5" /> Data Provenance
        </h3>
        <span className="chip text-[9px]">{bySource.length} sources</span>
      </header>

      <ul className="relative space-y-1.5">
        {bySource.map((s) => {
          const states = Array.from(s.states);
          const primary = states[0] ?? 'MODEL';
          return (
            <li
              key={s.source}
              className={`rounded-lg border px-2.5 py-1.5 ${STATE_TONE[primary] ?? STATE_TONE.MODEL}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10.5px] font-bold truncate flex-1">{s.source}</p>
                {primary === 'OBSERVED' || primary === 'BUOY' || primary === 'STATION' ? (
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                ) : primary === 'SATELLITE' ? (
                  <Satellite className="w-3 h-3 shrink-0" />
                ) : (
                  <Activity className="w-3 h-3 shrink-0" />
                )}
              </div>
              <p className="text-[9px] uppercase tracking-wider opacity-80 font-bold">
                {primary.replace(/_/g, ' ')} · {s.params.length} params
              </p>
            </li>
          );
        })}
      </ul>

      {unavailable.length > 0 && (
        <div className="relative mt-3 rounded-lg border border-amber-700/40 bg-amber-950/30 px-2.5 py-1.5">
          <p className="text-[9.5px] font-bold uppercase tracking-wider text-amber-200 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3" />
            {unavailable.length} parameters unavailable
          </p>
          <p className="text-[9px] text-amber-300/80 mt-0.5 line-clamp-2">
            No source returned a usable value: {unavailable.join(', ')}
          </p>
        </div>
      )}
    </section>
  );
};
