import React from 'react';
import { Activity, Cpu, Database, ShieldCheck } from 'lucide-react';
import { TripAssessmentResponse } from '../types';

interface SystemDiagnosticsProps {
  assessment: TripAssessmentResponse | null;
}

export const SystemDiagnostics: React.FC<SystemDiagnosticsProps> = ({ assessment }) => {
  if (!assessment) return null;

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center space-x-2 text-slate-300 font-bold text-sm uppercase tracking-wider">
        <Activity className="w-5 h-5 text-cyan-400" />
        <span>System Diagnostics & Machine-Readable Provenance Audit</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Execution Telemetry Card */}
        <div className="bg-ocean-900/80 border border-ocean-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <h4 className="font-bold text-white flex items-center space-x-2 text-sm">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>DAG Telemetry & Latency Metrics</span>
          </h4>
          <div className="space-y-2 font-mono text-xs text-slate-300">
            <div className="flex justify-between bg-ocean-950 p-2 rounded-lg">
              <span className="text-slate-400">Total Execution Latency:</span>
              <span className="text-emerald-400 font-bold">
                {assessment.telemetry.execution_ms} ms
              </span>
            </div>
            <div className="flex justify-between bg-ocean-950 p-2 rounded-lg">
              <span className="text-slate-400">Services Evaluated:</span>
              <span className="text-cyan-300 font-bold">9 Microservices</span>
            </div>
            <div className="flex justify-between bg-ocean-950 p-2 rounded-lg">
              <span className="text-slate-400">Circuit Breaker Engine:</span>
              <span className="text-emerald-400 font-bold">DETERMINISTIC PYTHON</span>
            </div>
          </div>
        </div>

        {/* Satellite & Ocean Model Provenance Card */}
        <div className="bg-ocean-900/80 border border-ocean-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <h4 className="font-bold text-white flex items-center space-x-2 text-sm">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Authoritative Satellite & Model Provenance</span>
          </h4>
          <div className="space-y-2 text-xs text-slate-300">
            <div>
              <span className="text-slate-400 block font-semibold">Active Satellite Feeds:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {assessment.provenance.satellites.map((sat, i) => (
                  <span key={i} className="bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
                    🛰️ {sat}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-2">
              <span className="text-slate-400 block font-semibold">Ocean Numerical Models:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {assessment.provenance.ocean_models.map((model, i) => (
                  <span key={i} className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                    🌊 {model}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
