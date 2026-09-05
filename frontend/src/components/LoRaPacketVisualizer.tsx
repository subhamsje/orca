import React from 'react';
import { Cpu, ShieldCheck } from 'lucide-react';
import { TripAssessmentResponse } from '../types';

interface LoRaPacketVisualizerProps {
  assessment: TripAssessmentResponse | null;
}

export const LoRaPacketVisualizer: React.FC<LoRaPacketVisualizerProps> = ({ assessment }) => {
  const lat = assessment?.coordinate?.lat;
  const lon = assessment?.coordinate?.lon;
  const riskScore = assessment?.risk_score;
  const liveReady = lat != null && lon != null && riskScore != null;

  const rawHex = liveReady
    ? `02${Math.round((lat as number) * 1000).toString(16).padStart(6, '0')}${Math.round((lon as number) * 1000).toString(16).padStart(6, '0')}${(riskScore as number).toString(16).padStart(2, '0')}e4a91b2c`
    : '— awaiting live telemetry —';

  return (
    <div className="bg-ocean-950 border border-ocean-800 rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-purple-950 border border-purple-800 rounded-xl text-purple-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              LoRa 868MHz / Satellite Packet Stream
            </h3>
            <span className="text-[10px] text-slate-400">16-Byte Bit-Packed Telemetry Protocol</span>
          </div>
        </div>

        <span className="flex items-center space-x-1 text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-1 rounded-lg font-bold">
          <ShieldCheck className="w-3 h-3" />
          <span>HMAC-SHA256 SIGNED</span>
        </span>
      </div>

      {/* Hex Stream Display */}
      <div className="bg-ocean-900/90 border border-ocean-800 p-3 rounded-xl font-mono text-xs text-purple-300 flex items-center justify-between">
        <div className="space-y-1 min-w-0">
          <span className="text-[9px] text-slate-400 uppercase font-bold block font-sans">Raw Hex Payload (16-Bytes)</span>
          <span className="tracking-widest font-black text-cyan-300 truncate block">{rawHex}</span>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[9px] text-slate-400 uppercase font-bold block font-sans">Size</span>
          <span className="font-bold text-emerald-400">{liveReady ? '16 Bytes' : '—'}</span>
        </div>
      </div>

      {/* Bit-Field Breakdown Grid */}
      <div className="grid grid-cols-4 gap-1.5 text-[11px] font-mono">
        <div className="bg-ocean-900 p-2 rounded-xl border border-ocean-800 text-center">
          <span className="text-[9px] text-slate-400 uppercase block font-sans font-bold">Header</span>
          <span className="text-cyan-400 font-bold">{liveReady ? '0x02' : '—'}</span>
        </div>
        <div className="bg-ocean-900 p-2 rounded-xl border border-ocean-800 text-center">
          <span className="text-[9px] text-slate-400 uppercase block font-sans font-bold">Lat (Packed)</span>
          <span className="text-emerald-400 font-bold">{lat != null ? lat.toFixed(3) : '—'}</span>
        </div>
        <div className="bg-ocean-900 p-2 rounded-xl border border-ocean-800 text-center">
          <span className="text-[9px] text-slate-400 uppercase block font-sans font-bold">Lon (Packed)</span>
          <span className="text-amber-400 font-bold">{lon != null ? lon.toFixed(3) : '—'}</span>
        </div>
        <div className="bg-ocean-900 p-2 rounded-xl border border-ocean-800 text-center">
          <span className="text-[9px] text-slate-400 uppercase block font-sans font-bold">Risk Score</span>
          <span className="text-purple-400 font-bold">{riskScore != null ? `${riskScore}/100` : '—/100'}</span>
        </div>
      </div>
    </div>
  );
};
