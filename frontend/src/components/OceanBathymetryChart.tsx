import React from 'react';
import { Anchor, AlertCircle, Compass } from 'lucide-react';

interface OceanBathymetryChartProps {
  currentDepthM?: number;
  vesselDraftM?: number;
}

export const OceanBathymetryChart: React.FC<OceanBathymetryChartProps> = ({
  currentDepthM = 48.5,
  vesselDraftM = 0.8,
}) => {
  const keelClearance = currentDepthM - vesselDraftM;
  const isGroundingRisk = keelClearance < 3.0;

  return (
    <div className="bg-ocean-950 border border-ocean-800 rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-ocean-900/40 via-cyan-950/20 to-ocean-950 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-cyan-950 border border-cyan-800 rounded-xl text-cyan-400">
            <Anchor className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Ocean Bathymetry & Seabed Sounder
            </h3>
            <span className="text-[10px] text-slate-400">INCOIS 30m High-Res Depth Profile</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-lg font-black text-cyan-400 font-mono">{currentDepthM}m</span>
          <span className="text-[10px] text-slate-400 block font-sans">Seabed Depth</span>
        </div>
      </div>

      {/* Seabed Sounder Profile Canvas Mock */}
      <div className="relative h-32 w-full bg-ocean-900/90 rounded-xl border border-ocean-800 p-2 overflow-hidden flex flex-col justify-end">
        {/* Sea Level Line */}
        <div className="absolute top-3 left-0 right-0 border-b border-cyan-500/60 flex items-center justify-between px-3">
          <span className="text-[9px] text-cyan-300 font-mono font-bold">0m (Sea Surface)</span>
          <span className="text-[9px] font-mono text-emerald-400 animate-pulse font-bold">
            Vessel Draft: {vesselDraftM}m
          </span>
        </div>

        {/* Keel Clearance Marker */}
        <div
          className="absolute left-1/2 -translate-x-1/2 border-l-2 border-dashed border-amber-400 flex flex-col items-center justify-center pointer-events-none z-10"
          style={{ top: '16px', bottom: '35px' }}
        >
          <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-mono font-bold shadow">
            Keel Clearance: {keelClearance.toFixed(1)}m
          </span>
        </div>

        {/* Dynamic Seabed SVG Contour Line */}
        <svg className="w-full h-24 overflow-visible" viewBox="0 0 300 80" preserveAspectRatio="none">
          <defs>
            <linearGradient id="seabedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0891b2" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#021827" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <path
            d="M 0 45 Q 50 30, 100 55 T 200 40 T 300 65 L 300 80 L 0 80 Z"
            fill="url(#seabedGrad)"
            stroke="#06b6d4"
            strokeWidth="2"
          />
        </svg>

        {/* Sounder Scan Pulse Beam */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-20 bg-gradient-to-b from-cyan-400/20 to-transparent clip-triangle animate-pulse pointer-events-none" />
      </div>

      {/* Footer Metrics */}
      <div className="grid grid-cols-3 gap-2 text-xs relative z-10">
        <div className="bg-ocean-900/80 p-2 rounded-xl border border-ocean-800 text-center">
          <span className="text-[9px] text-slate-400 uppercase font-bold block">Keel Clearance</span>
          <span className="font-mono font-bold text-emerald-400">{keelClearance.toFixed(1)}m</span>
        </div>
        <div className="bg-ocean-900/80 p-2 rounded-xl border border-ocean-800 text-center">
          <span className="text-[9px] text-slate-400 uppercase font-bold block">Seabed Type</span>
          <span className="font-bold text-cyan-300">Sand & Silt</span>
        </div>
        <div className="bg-ocean-900/80 p-2 rounded-xl border border-ocean-800 text-center">
          <span className="text-[9px] text-slate-400 uppercase font-bold block">Grounding Risk</span>
          <span className={`font-bold ${isGroundingRisk ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
            {isGroundingRisk ? 'HIGH RISK' : 'SAFE'}
          </span>
        </div>
      </div>
    </div>
  );
};
