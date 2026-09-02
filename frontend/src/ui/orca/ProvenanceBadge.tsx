import React from 'react';
import { Activity, AlertCircle, CheckCircle2, Clock, HelpCircle, Satellite } from 'lucide-react';
import { CanonicalRecord } from '../../types';
import { formatRelativeTime } from '../../utils/format';

interface ProvenanceBadgeProps {
  record: CanonicalRecord | undefined;
  compact?: boolean;
}

const STATE_META: Record<string, { Icon: React.ComponentType<{ className?: string }>; tone: string; label: string }> = {
  OBSERVED:        { Icon: CheckCircle2, tone: 'text-emerald-300', label: 'OBSERVED' },
  NEAR_REAL_TIME:  { Icon: Satellite,    tone: 'text-cyan-300',    label: 'NEAR-REAL-TIME' },
  NOWCAST:         { Icon: Activity,     tone: 'text-cyan-300',    label: 'NOWCAST' },
  FORECAST:        { Icon: Clock,        tone: 'text-amber-300',   label: 'FORECAST' },
  MODEL:           { Icon: Activity,     tone: 'text-cyan-300',    label: 'MODEL' },
  SATELLITE:       { Icon: Satellite,    tone: 'text-cyan-300',    label: 'SATELLITE' },
  BUOY:            { Icon: Activity,     tone: 'text-emerald-300', label: 'BUOY' },
  STATION:         { Icon: Activity,     tone: 'text-emerald-300', label: 'STATION' },
  CACHED:          { Icon: Clock,        tone: 'text-ink-muted',   label: 'CACHED' },
  STALE:           { Icon: Clock,        tone: 'text-amber-300',   label: 'STALE' },
  UNAVAILABLE:     { Icon: AlertCircle,  tone: 'text-ink-subtle',  label: 'UNAVAILABLE' },
  UNKNOWN:         { Icon: HelpCircle,   tone: 'text-ink-subtle',  label: 'UNKNOWN' },
};

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ record, compact }) => {
  if (!record) {
    return (
      <span className="chip">
        <AlertCircle className="w-3 h-3" /> NO DATA
      </span>
    );
  }
  const meta = STATE_META[record.state] ?? STATE_META.UNKNOWN;
  const Icon = meta.Icon;
  if (record.value === null || record.state === 'UNAVAILABLE') {
    return (
      <span className="chip text-ink-subtle" title={record.notes || 'No data available'}>
        <AlertCircle className="w-3 h-3" /> DATA UNAVAILABLE
      </span>
    );
  }
  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${meta.tone}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          record.state === 'STALE' ? 'bg-amber-400' :
          record.state === 'FORECAST' ? 'bg-amber-400' :
          'bg-emerald-400'
        }`} />
        {meta.label}
      </span>
    );
  }
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${meta.tone}`}>
        <Icon className="w-3 h-3" />
        {meta.label}
        {record.confidence > 0 && (
          <span className="text-ink-muted">· {Math.round(record.confidence * 100)}% conf</span>
        )}
      </span>
      <span className="text-[9px] text-ink-muted leading-tight line-clamp-1" title={record.source}>
        {record.source}
        {record.observation_time && record.observation_time > 0 && (
          <> · {formatRelativeTime(record.observation_time * 1000)}</>
        )}
      </span>
    </div>
  );
};
