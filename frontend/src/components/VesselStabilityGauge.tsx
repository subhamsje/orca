import React from 'react';
import { ShieldCheck, ShieldAlert, Activity, RefreshCw } from 'lucide-react';

interface VesselStabilityGaugeProps {
  vesselLengthM?: number;
  waveHeightM?: number;
  rollAngleDeg?: number;
}

export const VesselStabilityGauge: React.FC<VesselStabilityGaugeProps> = ({
  vesselLengthM = 8.5,
  waveHeightM = 1.1,
  rollAngleDeg = 4.2,
}) => {
  const maxSafeWaveM = 0.22 * vesselLengthM + 0.05 * 2.2;
  const stabilityPct = Math.max(10, Math.min(100, Math.round((1 - waveHeightM / maxSafeWaveM) * 100)));
  const isCapsizingDanger = waveHeightM >= maxSafeWaveM;

  return (
    <div className="bg-ocean-950 border border-ocean-800 rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Hydrodynamic Stability Twin
            </h3>
            <span className="text-[10px] text-slate-400">Metacentric Height & Roll Angle (GZ Curve)</span>
          </div>
        </div>

        <span
          className={`flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-xl border ${
            isCapsizingDanger
              ? 'bg-red-950 border-red-800 text-red-300 animate-pulse'
              : 'bg-emerald-950 border-emerald-800 text-emerald-300'
          }`}
        >
          {isCapsizingDanger ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          <span>{isCapsizingDanger ? 'CAPSIZING DANGER' : 'SEAWORTHY'}</span>
        </span>
      </div>

      {/* Dynamic Animated Vessel Hull Roll Simulator */}
      <div className="relative h-28 bg-ocean-900/90 rounded-xl border border-ocean-800 flex items-center justify-center overflow-hidden">
        {/* Animated Ocean Wave Surface */}
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/60 to-transparent pointer-events-none" />

        {/* Vessel Hull Icon with Dynamic Rotation */}
        <div
          className="relative transition-transform duration-700 ease-out flex flex-col items-center justify-center"
          style={{ transform: `rotate(${rollAngleDeg}deg)` }}
        >
          <div className="bg-cyan-600 text-white p-3 rounded-full border-2 border-white shadow-2xl">
            <RefreshCw className="w-6 h-6 animate-spin-slow" />
          </div>
          <span className="text-[10px] font-mono font-bold text-cyan-300 mt-1">
            Roll Angle: {rollAngleDeg.toFixed(1)}°
          </span>
        </div>

        {/* Metacentric Height GZ Indicator Line */}
        <div className="absolute right-3 top-3 bottom-3 w-2 bg-ocean-950 rounded-full border border-ocean-800 overflow-hidden flex flex-col justify-end">
          <div
            className={`w-full transition-all duration-500 ${
              stabilityPct > 50 ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'
            }`}
            style={{ height: `${stabilityPct}%` }}
          />
        </div>
      </div>

      {/* Stability Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-ocean-900 p-2 rounded-xl border border-ocean-800 text-center">
          <span className="text-[9px] text-slate-400 uppercase font-bold block">Seaworthiness</span>
          <span className="font-mono font-bold text-emerald-400">{stabilityPct}%</span>
        </div>
        <div className="bg-ocean-900 p-2 rounded-xl border border-ocean-800 text-center">
          <span className="text-[9px] text-slate-400 uppercase font-bold block">Max Safe Wave</span>
          <span className="font-mono font-bold text-cyan-400">{maxSafeWaveM.toFixed(2)}m</span>
        </div>
        <div className="bg-ocean-900 p-2 rounded-xl border border-ocean-800 text-center">
          <span className="text-[9px] text-slate-400 uppercase font-bold block">Live Wave (Hs)</span>
          <span className="font-mono font-bold text-amber-400">{waveHeightM}m</span>
        </div>
      </div>
    </div>
  );
};
