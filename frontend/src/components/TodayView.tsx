import React from 'react';
import {
  AlertTriangle, Anchor, Fish, Fuel, Gauge, Navigation, RefreshCw,
  ShieldAlert, ShieldCheck, TrendingUp,
} from 'lucide-react';
import { TripAssessmentResponse } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import { AudioButton, Button, Card, CardHeader, EmptyState, Skeleton, StatusBadge } from '../ui';
import { OceanBathymetryChart } from './OceanBathymetryChart';
import { VesselStabilityGauge } from './VesselStabilityGauge';
import { SatellitePassRadar } from './SatellitePassRadar';
import { LoRaPacketVisualizer } from './LoRaPacketVisualizer';

interface TodayViewProps {
  assessment: TripAssessmentResponse | null;
  language: string;
  isLoading: boolean;
  onRefreshTrip: () => void;
}

const verdictTone = (risk: number, breaker: boolean): 'safe' | 'caution' | 'danger' => {
  if (breaker || risk >= 75) return 'danger';
  if (risk >= 40) return 'caution';
  return 'safe';
};

const verdictIcon = (tone: 'safe' | 'caution' | 'danger') => {
  if (tone === 'danger') return <ShieldAlert className="w-4 h-4" />;
  if (tone === 'caution') return <AlertTriangle className="w-4 h-4" />;
  return <ShieldCheck className="w-4 h-4" />;
};

const gaugeColor = (tone: 'safe' | 'caution' | 'danger') =>
  tone === 'danger' ? '#f87171' : tone === 'caution' ? '#fbbf24' : '#34d399';

const gaugeGlow = (tone: 'safe' | 'caution' | 'danger') =>
  tone === 'danger' ? 'neon-glow-red' : tone === 'caution' ? 'neon-glow-amber' : 'neon-glow-emerald';

const ScoreBar: React.FC<{ value: number }> = ({ value }) => {
  const c = value > 75 ? 'from-emerald-500 to-emerald-400' : value > 50 ? 'from-cyan-500 to-cyan-400' : 'from-amber-500 to-amber-400';
  return (
    <div className="w-full bg-ocean-900 h-1.5 rounded-full overflow-hidden mt-1">
      <div className={`bg-gradient-to-r ${c} h-full transition-all duration-700 rounded-full`} style={{ width: `${value}%` }} />
    </div>
  );
};

const TodaySkeleton: React.FC = () => (
  <div className="space-y-4" aria-busy="true">
    <div className="glass-panel rounded-2xl p-6"><Skeleton height="1.5rem" width="60%" /><div className="mt-4 space-y-2"><Skeleton height="1rem" /><Skeleton height="1rem" width="80%" /></div></div>
    <div className="glass-panel rounded-2xl p-6"><Skeleton height="1.25rem" width="40%" /><div className="grid grid-cols-4 gap-3 mt-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height="5rem" />)}</div></div>
  </div>
);

export const TodayView: React.FC<TodayViewProps> = ({ assessment, language, isLoading, onRefreshTrip }) => {
  const speech = useSpeech(language);

  if (isLoading && !assessment) return <TodaySkeleton />;
  if (!assessment) return (
    <EmptyState icon={<Gauge className="w-6 h-6" />} title="No assessment yet"
      description="ORCA is ready. Refresh to fetch the latest ISRO satellite data."
      action={<Button onClick={onRefreshTrip}>Run assessment</Button>} />
  );

  const tone = verdictTone(assessment.risk_score, assessment.circuit_breaker_triggered);
  const verdictLabel = tone === 'danger' ? 'Danger' : tone === 'caution' ? 'Caution' : 'Safe';
  const verdictStatus = assessment.circuit_breaker_triggered ? 'Circuit Breaker Override'
    : tone === 'danger' ? 'Do Not Venture' : tone === 'caution' ? 'Moderate Caution' : 'Safe Seaworthiness';
  const arcLen = (assessment.risk_score / 100) * 251;

  return (
    <div className="space-y-4">
      {/* Primary Verdict Card */}
      <div className={`glass-panel rounded-2xl p-6 transition-all duration-500 ${tone === 'danger' ? 'border-red-500/20 neon-glow-red' : ''}`}>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-4 max-w-xl min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={tone} icon={verdictIcon(tone)}>{verdictStatus}</StatusBadge>
              <span className="text-[10px] text-slate-500">
                Confidence {Math.round(assessment.provenance.confidence * 100)}% · {assessment.provenance.data_freshness}
              </span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-bold">Seaworthiness Verdict</p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">{assessment.verdict}</h2>
              {assessment.override_reason && <p className="text-xs text-red-300 mt-1.5 font-medium">{assessment.override_reason}</p>}
            </div>
            <blockquote className="text-sm text-slate-200 leading-relaxed glass-card p-4 rounded-xl italic">
              "{assessment.explanation.plain_language_text}"
            </blockquote>
            <div className="flex items-center gap-3">
              <AudioButton isPlaying={speech.isPlaying} onPlay={() => speech.play(assessment.explanation.plain_language_text)}
                onStop={speech.stop} label={`Listen (${verdictLabel})`} size="md"
                variant={tone === 'danger' ? 'amber' : 'cyan'} />
              <span className="text-[9px] text-slate-500 font-mono">Capsizing: Hₛ &gt; {(0.6 * assessment.vessel_length_m).toFixed(1)}m</span>
            </div>
          </div>

          {/* Animated SVG Risk Gauge */}
          <div className={`flex flex-col items-center justify-center glass-card px-6 py-5 rounded-2xl text-center min-w-[11rem] ${gaugeGlow(tone)}`}>
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#0c4a6e" strokeWidth="5" />
                <circle cx="50" cy="50" r="40" fill="none" stroke={gaugeColor(tone)} strokeWidth="5"
                  strokeLinecap="round" strokeDasharray={`${arcLen}, 251`}
                  style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 8px ${gaugeColor(tone)})` }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white">{assessment.risk_score}</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Risk / 100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stability & Bathymetry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <VesselStabilityGauge vesselLengthM={assessment.vessel_length_m} waveHeightM={1.1} rollAngleDeg={4.2} />
        <OceanBathymetryChart currentDepthM={48.5} vesselDraftM={0.8} />
      </div>

      {/* Satellite & LoRa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SatellitePassRadar />
        <LoRaPacketVisualizer />
      </div>

      {/* HSI Species Matrix */}
      <div className="glass-panel rounded-2xl p-5">
        <CardHeader title="Habitat Suitability (HSI)" description="Multi-species pelagic index from INCOIS OCM-3"
          icon={<Fish className="w-4 h-4 text-cyan-400" />}
          badge={<span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-700/30 px-2 py-0.5 rounded-md">INCOIS OCM-3</span>} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {Object.entries(assessment.species_matrix).map(([species, score]) => (
            <div key={species} className="glass-card rounded-xl p-3 hover:border-cyan-500/20 transition-all duration-300 group">
              <p className="text-[11px] font-semibold text-slate-300 truncate">{species.split(' ')[0]}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-cyan-300 group-hover:text-cyan-200 transition">{score}</span>
                <span className="text-[9px] text-slate-600 font-bold">/100 HSI</span>
              </div>
              <ScoreBar value={score} />
            </div>
          ))}
        </div>
      </div>

      {/* Eco-Economic ROI */}
      <div className="glass-panel rounded-2xl p-5">
        <CardHeader title="Eco-Economic ROI" description="Profit-maximizing harbor from wholesale auctions"
          icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
          badge={<span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-700/30 px-2 py-0.5 rounded-md">Wholesale</span>} />
        <div className="glass-card rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 mt-4 border-emerald-700/20 neon-glow-emerald">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.15em] text-emerald-300 font-bold">Recommended Dock</p>
            <h4 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 truncate">
              <Anchor className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{assessment.economics.best_docking_harbor}</span>
            </h4>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500">Expected Net Profit</p>
            <p className="text-2xl font-black text-emerald-300" style={{ textShadow: '0 0 20px rgba(52,211,153,0.3)' }}>
              ₹{assessment.economics.max_expected_profit_inr.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
        <div className="mt-4 -mx-1 overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="text-[9px] uppercase glass-dark text-slate-500 font-bold border-b border-ocean-800/40">
              <tr><th className="px-4 py-2.5">Harbor</th><th className="px-3 py-2.5 text-right">Rate</th><th className="px-3 py-2.5 text-right">Gross</th><th className="px-3 py-2.5 text-right">Fuel</th><th className="px-3 py-2.5 text-right">Net</th></tr>
            </thead>
            <tbody className="divide-y divide-ocean-800/30">
              {assessment.economics.harbor_comparisons.map((h, i) => (
                <tr key={i} className={`transition-all duration-200 ${h.recommended ? 'bg-emerald-950/20 text-emerald-200' : 'hover:bg-ocean-900/30'}`}>
                  <td className="px-4 py-2.5 flex items-center gap-1.5">
                    {h.recommended && <span className="text-emerald-400 text-xs">★</span>}
                    <span className="truncate max-w-[14rem]">{h.harbor_name}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">₹{h.unit_price_per_kg}/kg</td>
                  <td className="px-3 py-2.5 text-right font-mono">₹{h.gross_revenue_inr.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-amber-400">₹{h.total_fuel_cost_inr.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-300">₹{h.net_profit_inr.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Route & Fuel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel rounded-2xl p-5">
          <CardHeader title="Pathfinder Route" icon={<Navigation className="w-4 h-4 text-cyan-400" />} />
          <p className="text-sm font-semibold text-white mt-3">{assessment.route.path_type}</p>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-ocean-800/30 mt-3">
            <span>Distance: <strong className="text-white font-mono">{assessment.route.total_distance_km} km</strong></span>
            <span>ETA: <strong className="text-white font-mono">{assessment.route.estimated_travel_mins} min</strong></span>
          </div>
          {assessment.route.avoided_hazards.length > 0 && (
            <div className="mt-3 text-[10px] text-slate-500">Detours: {assessment.route.avoided_hazards.join(' · ')}</div>
          )}
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <CardHeader title="Hydro-Acoustic Fuel Twin" icon={<Fuel className="w-4 h-4 text-amber-400" />} />
          <p className="text-sm font-semibold text-amber-200 mt-3">{assessment.route.fuel_consumption_est_liters} L diesel</p>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-ocean-800/30 mt-3">
            <span>BSFC: <strong className="text-white font-mono">240 g/hp·hr</strong></span>
            <span>Slip: <strong className="text-white font-mono">12.4%</strong></span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="secondary" size="sm" leadingIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={onRefreshTrip}>
          Reassess trip
        </Button>
      </div>
    </div>
  );
};