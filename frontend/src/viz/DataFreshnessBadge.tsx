import React from 'react';
import { Wifi, WifiOff, AlertTriangle, Clock } from 'lucide-react';
import type { EnvironmentalVisualizationState } from './envState';
import { formatRelativeTime } from '../utils/format';

/**
 * DataFreshnessBadge — surfaces the assessment's freshness to the
 * user. Shows LIVE / RECENT / STALE / OFFLINE / DEMO explicitly so
 * animated layers cannot masquerade as authoritative when the underlying
 * data is stale or simulated.
 */

interface DataFreshnessBadgeProps {
  env: EnvironmentalVisualizationState;
}

type Level = 'LIVE' | 'RECENT' | 'STALE' | 'OFFLINE' | 'DEMO' | 'UNKNOWN';

function classify(env: EnvironmentalVisualizationState): Level {
  if (env.isOffline) return 'OFFLINE';
  if (env.isDemo) return 'DEMO';
  const ageMs = Date.now() - env.provenance.generatedAt;
  if (!Number.isFinite(ageMs) || ageMs < 0) return 'UNKNOWN';
  if (ageMs < 10 * 60 * 1000) return 'LIVE';
  if (ageMs < 60 * 60 * 1000) return 'RECENT';
  return 'STALE';
}

const STYLE: Record<Level, { icon: React.ComponentType<{ className?: string }>; classes: string; label: string }> = {
  LIVE: { icon: Wifi, classes: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200', label: 'LIVE' },
  RECENT: { icon: Clock, classes: 'border-cyan-500/40 bg-cyan-950/30 text-cyan-200', label: 'RECENT' },
  STALE: { icon: AlertTriangle, classes: 'border-amber-500/50 bg-amber-950/30 text-amber-200', label: 'STALE' },
  OFFLINE: { icon: WifiOff, classes: 'border-slate-500/50 bg-slate-900/60 text-slate-300', label: 'OFFLINE' },
  DEMO: { icon: AlertTriangle, classes: 'border-violet-500/50 bg-violet-950/30 text-violet-200', label: 'DEMO / SIMULATION' },
  UNKNOWN: { icon: Clock, classes: 'border-slate-500/40 bg-slate-900/40 text-slate-300', label: 'UNKNOWN' },
};

export const DataFreshnessBadge: React.FC<DataFreshnessBadgeProps> = ({ env }) => {
  const level = classify(env);
  const style = STYLE[level];
  const Icon = style.icon;
  const ageLabel = formatRelativeTime(env.provenance.generatedAt);

  return (
    <div
      className={`glass rounded-full border px-3 py-1 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] font-bold ${style.classes}`}
      role="status"
      aria-live="polite"
      aria-label={`Data freshness: ${style.label}`}
      title={env.provenance.source}
    >
      <Icon className="w-3 h-3" />
      <span>{style.label}</span>
      <span className="text-ink-muted">·</span>
      <span className="numeric normal-case tracking-normal text-[10px] text-ink-muted">{ageLabel}</span>
    </div>
  );
};

DataFreshnessBadge.displayName = 'DataFreshnessBadge';