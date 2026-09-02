import React from 'react';
import { ShieldCheck, ShieldAlert, Activity } from 'lucide-react';

interface VesselStabilityGaugeProps {
  vesselLengthM?: number;
  waveHeightM?: number;
  rollAngleDeg?: number;
}

export const VesselStabilityGauge: React.FC<VesselStabilityGaugeProps> = ({
  vesselLengthM = 8.5, waveHeightM = 1.1, rollAngleDeg = 4.2,
}) => {
  const maxSafeWaveM = 0.6 * vesselLengthM;
  const stabilityPct = Math.max(5, Math.min(100, Math.round((1 - waveHeightM / maxSafeWaveM) * 100)));
  const isCapsizing = waveHeightM >= maxSafeWaveM;
  const arcLen = (stabilityPct / 100) * 251;

  return (
    <div className={`glass-panel rounded-2xl p-5 space-y-4 relative overflow-hidden transition-all duration-500 ${
      isCapsizing ? 'border-red-500/30 neon-glow-red' : 'border-ocean-800/60'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className={`p-2 rounded-xl border ${isCapsizing ? 'bg-red-950/60 border-red-700/40 text-red-400' : 'bg-emerald-950/60 border-emerald-700/40 text-emerald-400'}`}>
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Vessel Stability Twin</h3>
            <span className="text-[9px] text-slate-500">Capsizing: Hₛ &gt; 0.6 × L = {maxSafeWaveM.toFixed(1)}m</span>
          </div>
        </div>
        <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border backdrop-blur-sm ${
          isCapsizing ? 'bg-red-950/60 border-red-700/40 text-red-300 animate-pulse' : 'bg-emerald-950/60 border-emerald-700/40 text-emerald-300'
        }`}>
          {isCapsizing ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
          {isCapsizing ? 'CAPSIZING DANGER' : 'SEAWORTHY'}
        </span>
      </div>

      {/* SVG Vessel Cross-Section */}
      <div className="relative h-36 glass-card rounded-xl flex items-center justify-center overflow-hidden">
        {/* Animated Water */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-cyan-950/50 via-cyan-900/20 to-transparent">
          <div className="absolute inset-0 opacity-30" style={{
            background: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(34,211,238,0.1) 20px, rgba(34,211,238,0.1) 40px)',
            animation: 'wave-flow 4s linear infinite',
          }} />
        </div>

        {/* Stability Arc Gauge */}
        <div className="absolute left-4 top-4">
          <svg width="56" height="56" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#0c4a6e" strokeWidth="6" />
            <circle cx="50" cy="50" r="40" fill="none"
              stroke={isCapsizing ? '#f87171' : '#34d399'}
              strokeWidth="6" strokeLinecap="round" strokeDasharray={`${arcLen}, 251`}
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 0.8s ease', filter: `drop-shadow(0 0 6px ${isCapsizing ? '#f87171' : '#34d399'})` }}
            />
            <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="18" fontWeight="bold">
              {stabilityPct}%
            </text>
          </svg>
        </div>

        {/* Vessel Hull */}
        <div className="relative transition-transform duration-700 ease-out" style={{ transform: `rotate(${rollAngleDeg}deg)` }}>
          <svg width="120" height="60" viewBox="0 0 120 60">
            <path d="M10,50 Q15,20 60,15 Q105,20 110,50 Z" fill="none" stroke="#22d3ee" strokeWidth="2"
              style={{ filter: 'drop-shadow(0 0 4px rgba(34,211,238,0.5))' }} />
            <line x1="60" y1="15" x2="60" y2="0" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3,2" />
            <circle cx="60" cy="0" r="2" fill="#fbbf24" />
            <text x="60" y="40" textAnchor="middle" fill="#94a3b8" fontSize="7">HULL</text>
          </svg>
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-cyan-400">
            Roll: {rollAngleDeg.toFixed(1)}°
          </div>
        </div>

        {/* GM Indicator */}
        <div className="absolute right-3 top-3 bottom-3 w-1.5 bg-ocean-900 rounded-full overflow-hidden border border-ocean-800/60">
          <div className={`w-full transition-all duration-500 rounded-full ${stabilityPct > 50 ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}
            style={{ height: `${stabilityPct}%`, marginTop: `${100 - stabilityPct}%` }} />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        {[
          { label: 'Stability', value: `${stabilityPct}%`, color: 'text-emerald-400' },
          { label: 'Max Safe (0.6×L)', value: `${maxSafeWaveM.toFixed(1)}m`, color: 'text-cyan-400' },
          { label: 'Live Hₛ', value: `${waveHeightM}m`, color: isCapsizing ? 'text-red-400' : 'text-amber-400' },
        ].map((m) => (
          <div key={m.label} className="glass-card rounded-xl p-2.5 text-center">
            <span className="text-[8px] text-slate-500 uppercase font-bold block tracking-wider">{m.label}</span>
            <span className={`font-mono font-bold text-sm ${m.color}`}>{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
