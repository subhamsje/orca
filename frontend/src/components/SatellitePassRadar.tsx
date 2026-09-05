import React, { useEffect, useState } from 'react';
import { Radio, Clock, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { SatellitePass } from '../utils/orcaApi';

export const SatellitePassRadar: React.FC = () => {
  const [passes, setPasses] = useState<SatellitePass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/v1/satellite/passes?_t=${Date.now()}`)
      .then((r) => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then((d) => {
        if (cancelled) return;
        setPasses(d?.upcoming_overpasses ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setPasses([]);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-ocean-950 border border-ocean-800 rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-cyan-950 border border-cyan-800 rounded-xl text-cyan-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              ISRO / Copernicus Satellite Overpass
            </h3>
            <span className="text-[10px] text-slate-400">Orbital Overpass Countdown Radar</span>
          </div>
        </div>

        <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-1 rounded-lg font-mono font-bold">
          {loading ? '…' : `${passes.length} SATELLITES TRACKED`}
        </span>
      </div>

      {/* Satellite Rows */}
      <div className="space-y-2 text-xs">
        {loading ? (
          <p className="text-ink-muted text-center py-4">Loading live pass predictor…</p>
        ) : passes.length === 0 ? (
          <p className="text-ink-muted text-center py-4">No live overpass data right now.</p>
        ) : (
          passes.map((sat, idx) => (
            <div key={idx} className="bg-ocean-900/90 border border-ocean-800 p-2.5 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <div>
                  <span className="font-bold text-white block">{sat.satellite}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{sat.orbit_type} • {sat.sensor}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-cyan-400 block">{sat.next_pass_in_minutes} min</span>
                <span className="text-[9px] text-slate-400">Next Pass</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
