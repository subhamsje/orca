import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bell, ShieldAlert, X } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';
import { formatRelativeTime } from '../../utils/format';

interface Advisory {
  incident_id: string;
  type: string;
  source: string;
  lat: number;
  lon: number;
  radius_km: number;
  severity: string;
  description: string;
  timestamp: number;
}

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: 'border-red-500/60 bg-red-950/70 text-red-100',
  HIGH: 'border-amber-500/60 bg-amber-950/70 text-amber-100',
  MODERATE: 'border-cyan-500/50 bg-cyan-950/60 text-cyan-100',
  LOW: 'border-slate-500/40 bg-slate-900/60 text-slate-200',
};

export const CycloneAlertBanner: React.FC<{ lat?: number; lon?: number }> = () => {
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/v1/osint/summary`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        setAdvisories(d.advisories ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = advisories.filter((a) => !dismissed[a.incident_id]);
  if (!visible.length) return null;

  return (
    <div className="absolute top-[6.5rem] inset-x-3 z-30 pointer-events-none space-y-2">
      {visible.map((a) => (
        <div
          key={a.incident_id}
          className={`pointer-events-auto glass-strong rounded-2xl border-l-4 p-3 flex items-start gap-3 ${
            SEVERITY_COLOR[a.severity] ?? SEVERITY_COLOR.MODERATE
          }`}
        >
          {a.severity === 'CRITICAL' || a.severity === 'HIGH' ? (
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 animate-pulse" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="chip text-[9px] font-bold uppercase tracking-wider bg-black/30">
                {a.severity}
              </span>
              <p className="text-xs font-bold uppercase tracking-wider truncate">
                {a.type}
              </p>
              <span className="text-[10px] text-ink-muted ml-auto shrink-0">
                {formatRelativeTime(a.timestamp * 1000)}
              </span>
            </div>
            <p className="text-[11px] leading-snug">{a.description}</p>
            <p className="text-[9.5px] text-ink-muted mt-1 flex items-center gap-1.5">
              <Bell className="w-3 h-3" />
              {a.source} · radius {a.radius_km} km
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissed((d) => ({ ...d, [a.incident_id]: true }))}
            className="rounded-lg p-1.5 text-ink-muted hover:text-white hover:bg-ocean-800/60"
            aria-label="Dismiss advisory"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};