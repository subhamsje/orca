import React from 'react';
import { ShieldCheck, ShieldAlert, Volume2, Waves, Compass, Fuel, Fish } from 'lucide-react';
import { TripAssessmentResponse } from '../types';
import { speakText } from '../utils/voiceSpeech';

interface TodayViewProps {
  assessment: TripAssessmentResponse | null;
  language: string;
  onRefreshTrip: () => void;
}

export const TodayView: React.FC<TodayViewProps> = ({ assessment, language, onRefreshTrip }) => {
  if (!assessment) {
    return (
      <div className="p-8 text-center text-slate-400 animate-pulse">
        Evaluating satellite ocean models & safety circuit breakers...
      </div>
    );
  }

  const isSafe = assessment.verdict === 'SAFE TO VENTURE';
  const isHighRisk = assessment.circuit_breaker_triggered || assessment.risk_score >= 75;

  const handleSpeak = () => {
    speakText(assessment.explanation.plain_language_text, language);
  };

  return (
    <div className="space-y-4 p-4 max-w-4xl mx-auto">
      {/* Circuit Breaker Alert Banner if Triggered */}
      {assessment.circuit_breaker_triggered && (
        <div className="bg-red-950/90 border-2 border-red-500 rounded-2xl p-4 text-red-200 flex items-start space-x-3 shadow-xl">
          <ShieldAlert className="w-8 h-8 text-red-400 shrink-0 mt-1 animate-bounce" />
          <div>
            <h2 className="text-lg font-black text-red-100 tracking-wide uppercase">
              ⚠️ MANDATORY SAFETY OVERRIDE ACTIVE
            </h2>
            <p className="text-sm font-semibold mt-1">{assessment.override_reason}</p>
            <p className="text-xs text-red-300 mt-2 font-medium">
              Deterministic Safety Circuit Breaker enforces zero departure permission. Stay at harbor.
            </p>
          </div>
        </div>
      )}

      {/* Primary Trip Verdict Card */}
      <div
        className={`rounded-2xl p-6 border-2 shadow-2xl transition ${
          isHighRisk
            ? 'bg-red-950/40 border-red-600'
            : isSafe
            ? 'bg-emerald-950/40 border-emerald-500'
            : 'bg-amber-950/40 border-amber-500'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div
              className={`p-4 rounded-2xl ${
                isHighRisk
                  ? 'bg-red-900/80 text-red-300'
                  : isSafe
                  ? 'bg-emerald-900/80 text-emerald-300'
                  : 'bg-amber-900/80 text-amber-300'
              }`}
            >
              {isHighRisk ? (
                <ShieldAlert className="w-10 h-10" />
              ) : (
                <ShieldCheck className="w-10 h-10" />
              )}
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-slate-400">
                Seaworthiness Verdict
              </span>
              <h2 className="text-2xl font-black tracking-tight text-white">{assessment.verdict}</h2>
              <p className="text-sm font-medium text-slate-300 mt-0.5">
                {assessment.explanation.wave_description}
              </p>
            </div>
          </div>

          {/* Risk Gauge Dial */}
          <div className="flex items-center space-x-3 bg-ocean-900/80 px-5 py-3 rounded-2xl border border-ocean-800 self-stretch sm:self-auto justify-between sm:justify-start">
            <div className="text-right">
              <div className="text-xs text-slate-400 font-bold uppercase">Risk Score</div>
              <div
                className={`text-2xl font-black ${
                  isHighRisk ? 'text-red-400' : isSafe ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {assessment.risk_score} <span className="text-sm text-slate-500">/ 100</span>
              </div>
            </div>

            <button
              onClick={handleSpeak}
              className="bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-xl shadow-lg transition flex items-center justify-center"
              title="Listen in Native Dialect"
            >
              <Volume2 className="w-6 h-6 animate-pulse" />
            </button>
          </div>
        </div>

        {/* Audio / Plain Language Text Explanation */}
        <div className="mt-4 pt-4 border-t border-ocean-800/60 bg-ocean-900/40 p-4 rounded-xl">
          <p className="text-base font-semibold text-slate-100 leading-relaxed">
            "{assessment.explanation.plain_language_text}"
          </p>
        </div>
      </div>

      {/* Target Fishing Grounds Grid */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
          <Fish className="w-4 h-4 text-cyan-400" />
          <span>Ranked Target Fishing Grounds (PFZ Multi-Variate Model)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessment.pfz_grounds.map((ground) => (
            <div
              key={ground.rank}
              className="bg-ocean-900/80 border border-ocean-800 hover:border-cyan-600 rounded-2xl p-4 shadow-lg transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="bg-cyan-900 text-cyan-300 text-xs font-black px-2.5 py-1 rounded-lg">
                    RANK #{ground.rank}
                  </span>
                  <h4 className="font-bold text-white text-base">{ground.name}</h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 uppercase font-bold">HSI Index</span>
                  <div className="text-emerald-400 font-black text-lg">{ground.hsi} / 100</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs bg-ocean-950/60 p-2.5 rounded-xl text-slate-300">
                <div>
                  <span className="text-slate-500 block">Distance</span>
                  <span className="font-bold text-white">{ground.distance_km} km</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Est Fuel</span>
                  <span className="font-bold text-cyan-300">
                    {assessment.route.fuel_consumption_est_liters} L
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Travel Time</span>
                  <span className="font-bold text-white">
                    {assessment.route.estimated_travel_mins} mins
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1 font-semibold">
                  Likely Schooling Species:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ground.likely_species.map((species, i) => (
                    <span
                      key={i}
                      className="bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-medium px-2 py-0.5 rounded-md"
                    >
                      🐟 {species}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
