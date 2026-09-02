import React, { useState } from 'react';
import { TripAssessmentResponse } from '../types';
import { ShieldCheck, ShieldAlert, AlertTriangle, Fish, TrendingUp, Navigation, Gauge, Zap, Fuel, RefreshCw, Volume2, Anchor } from 'lucide-react';

interface TodayViewProps {
  assessment: TripAssessmentResponse | null;
  language: string;
  onRefreshTrip: () => void;
}

export const TodayView: React.FC<TodayViewProps> = ({ assessment, language, onRefreshTrip }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<string>('Bangda (Indian Mackerel)');

  if (!assessment) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="inline-flex bg-cyan-900/60 p-4 rounded-full border border-cyan-700 text-cyan-400 animate-spin">
          <RefreshCw className="w-8 h-8" />
        </div>
        <p className="text-sm font-bold text-slate-300">Assimilation of ISRO Satellite & Ocean Models in Progress...</p>
      </div>
    );
  }

  const isDanger = assessment.circuit_breaker_triggered || assessment.risk_score >= 75;
  const isCaution = assessment.risk_score >= 40 && assessment.risk_score < 75;

  const playVoiceSynthesis = () => {
    if (!assessment.explanation.plain_language_text) return;
    setIsPlayingAudio(true);

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(assessment.explanation.plain_language_text);
      utterance.lang = language === 'Marathi' ? 'mr-IN' : language === 'Hindi' ? 'hi-IN' : 'en-US';
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingAudio(false), 3000);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      {/* 1. SEAWORTHINESS VERDICT HERO DIAL CARD */}
      <div
        className={`border rounded-3xl p-6 shadow-2xl relative overflow-hidden transition-all ${
          isDanger
            ? 'bg-gradient-to-br from-red-950 via-ocean-950 to-ocean-900 border-red-800'
            : isCaution
            ? 'bg-gradient-to-br from-amber-950 via-ocean-950 to-ocean-900 border-amber-800'
            : 'bg-gradient-to-br from-emerald-950 via-ocean-950 to-ocean-900 border-emerald-800'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 max-w-md">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-ocean-900/80">
              {isDanger ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-red-400 animate-bounce" />
                  <span className="text-red-400">CIRCUIT BREAKER OVERRIDE</span>
                </>
              ) : isCaution ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400">MODERATE SWELL CAUTION</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">SAFE SEAWORTHINESS</span>
                </>
              )}
            </div>

            <h2 className="text-3xl font-black tracking-tight text-white">{assessment.verdict}</h2>

            <p className="text-xs text-slate-300 font-medium leading-relaxed bg-ocean-900/60 p-3.5 rounded-xl border border-ocean-800">
              "{assessment.explanation.plain_language_text}"
            </p>

            <button
              onClick={playVoiceSynthesis}
              className={`flex items-center space-x-2 text-xs font-bold px-4 py-2 rounded-xl border transition ${
                isPlayingAudio
                  ? 'bg-emerald-900 text-emerald-200 border-emerald-700 animate-pulse'
                  : 'bg-cyan-900 hover:bg-cyan-800 text-cyan-200 border-cyan-700'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isPlayingAudio ? 'Playing Native Audio...' : 'Listen Native Voice Advisory'}</span>
            </button>
          </div>

          {/* Seaworthiness Risk Gauge Dial */}
          <div className="flex flex-col items-center justify-center bg-ocean-900/90 border border-ocean-800 p-6 rounded-3xl text-center space-y-2 shrink-0">
            <div className="relative flex items-center justify-center w-28 h-28">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-ocean-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={isDanger ? 'text-red-500' : isCaution ? 'text-amber-400' : 'text-emerald-400'}
                  strokeDasharray={`${assessment.risk_score}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-white">{assessment.risk_score}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">RISK / 100</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Craft Safety Limit: 0.6 × Vessel Length</span>
          </div>
        </div>
      </div>

      {/* 2. MULTI-SPECIES HABITAT SUITABILITY (HSI) MATRIX */}
      <div className="bg-ocean-900 border border-ocean-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Fish className="w-5 h-5 text-cyan-400" />
            <span>Multi-Species Pelagic Habitat Suitability (HSI Matrix)</span>
          </h3>
          <span className="text-xs text-cyan-400 font-semibold bg-cyan-950 px-2.5 py-1 rounded-md border border-cyan-800">
            INCOIS OCM-3 Bio-Thermal
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(assessment.species_matrix).map(([species, score]) => (
            <button
              key={species}
              onClick={() => setSelectedSpecies(species)}
              className={`p-3.5 rounded-xl border text-left transition ${
                selectedSpecies === species
                  ? 'bg-cyan-950 border-cyan-500 shadow-md ring-1 ring-cyan-500'
                  : 'bg-ocean-950/80 border-ocean-800 hover:border-ocean-700'
              }`}
            >
              <span className="text-xs font-bold text-slate-300 block truncate">{species.split(' ')[0]}</span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-xl font-black text-cyan-400">{score}</span>
                <span className="text-[10px] text-slate-500 font-bold">/100 HSI</span>
              </div>
              <div className="w-full bg-ocean-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full ${score > 75 ? 'bg-emerald-400' : score > 50 ? 'bg-cyan-400' : 'bg-amber-400'}`}
                  style={{ width: `${score}%` }}
                ></div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. MULTI-PORT ECO-ECONOMIC ROI OPTIMIZER CARD */}
      <div className="bg-ocean-900 border border-ocean-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>Multi-Port Eco-Economic Net ROI Optimizer</span>
          </h3>
          <span className="text-xs text-emerald-400 font-bold bg-emerald-950 px-2.5 py-1 rounded-md border border-emerald-800">
            Wholesale Auction Rates
          </span>
        </div>

        <div className="bg-gradient-to-r from-emerald-950/80 to-ocean-950 border border-emerald-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">Recommended Profit-Maximizing Dock:</span>
            <h4 className="text-lg font-black text-white flex items-center space-x-1.5">
              <Anchor className="w-5 h-5 text-emerald-400" />
              <span>{assessment.economics.best_docking_harbor}</span>
            </h4>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Est Expected Net Profit:</span>
            <span className="text-2xl font-black text-emerald-400">
              ₹{assessment.economics.max_expected_profit_inr.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Harbor Auction Price Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="text-[11px] uppercase bg-ocean-950 text-slate-400 font-bold border-b border-ocean-800">
              <tr>
                <th className="p-3">Coastal Harbor</th>
                <th className="p-3">Wholesale Rate</th>
                <th className="p-3">Gross Catch Value</th>
                <th className="p-3">Est Fuel Burn</th>
                <th className="p-3">Net Expected Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ocean-800">
              {assessment.economics.harbor_comparisons.map((h, i) => (
                <tr key={i} className={h.recommended ? 'bg-emerald-950/40 font-bold text-emerald-300' : 'hover:bg-ocean-950/50'}>
                  <td className="p-3 flex items-center space-x-1.5">
                    {h.recommended && <span className="text-emerald-400">★</span>}
                    <span>{h.harbor_name}</span>
                  </td>
                  <td className="p-3">₹{h.unit_price_per_kg}/kg</td>
                  <td className="p-3">₹{h.gross_revenue_inr.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-amber-400">₹{h.total_fuel_cost_inr.toLocaleString('en-IN')}</td>
                  <td className="p-3 font-black text-emerald-400">₹{h.net_profit_inr.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. ROUTE & FUEL BURNING METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-ocean-900 border border-ocean-800 rounded-2xl p-5 shadow-lg space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Navigation className="w-4 h-4 text-cyan-400" />
            <span>Weather Pathfinder Route</span>
          </h4>
          <p className="text-sm font-bold text-white">{assessment.route.path_type}</p>
          <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-ocean-800">
            <span>Distance: <strong>{assessment.route.total_distance_km} km</strong></span>
            <span>Est Travel: <strong>{assessment.route.estimated_travel_mins} mins</strong></span>
          </div>
        </div>

        <div className="bg-ocean-900 border border-ocean-800 rounded-2xl p-5 shadow-lg space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Fuel className="w-4 h-4 text-amber-400" />
            <span>Hydro-Acoustic Fuel Twin</span>
          </h4>
          <p className="text-sm font-bold text-amber-300">{assessment.route.fuel_consumption_est_liters} Liters Diesel</p>
          <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-ocean-800">
            <span>BSFC Rate: <strong>240 g/hp-hr</strong></span>
            <span>Prop Slip: <strong>12.4%</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
