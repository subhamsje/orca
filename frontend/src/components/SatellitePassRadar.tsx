import React from 'react';
import { Radio, Clock, ShieldCheck } from 'lucide-react';

export const SatellitePassRadar: React.FC = () => {
  const passes = [
    { name: 'INSAT-3DR (SST Imager)', orbit: 'GEO 74.0°E', overpassIn: 'LIVE NOW', type: 'Thermal SST' },
    { name: 'Oceansat-3 (OCM-3)', orbit: 'SSO 720km', overpassIn: '42 mins', type: 'Chlorophyll-a' },
    { name: 'Sentinel-1 C-Band SAR', orbit: 'Polar 693km', overpassIn: '3h 14m', type: 'SAR Radar' },
  ];

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
          3 SATELLITES TRACKED
        </span>
      </div>

      {/* Satellite Rows */}
      <div className="space-y-2 text-xs">
        {passes.map((sat, idx) => (
          <div key={idx} className="bg-ocean-900/90 border border-ocean-800 p-2.5 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <div>
                <span className="font-bold text-white block">{sat.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">{sat.orbit} • {sat.type}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="font-mono font-bold text-cyan-400 block">{sat.overpassIn}</span>
              <span className="text-[9px] text-slate-400">Next Pass</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
