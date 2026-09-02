import React from 'react';
import {
  AlertTriangle,
  Anchor,
  Fish,
  Fuel,
  Gauge,
  Navigation,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
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

const verdictTone = (
  risk: number,
  breaker: boolean,
): 'safe' | 'caution' | 'danger' => {
  if (breaker || risk >= 75) return 'danger';
  if (risk >= 40) return 'caution';
  return 'safe';
};

const verdictIcon = (tone: 'safe' | 'caution' | 'danger') => {
  if (tone === 'danger') return <ShieldAlert className="w-4 h-4" />;
  if (tone === 'caution') return <AlertTriangle className="w-4 h-4" />;
  return <ShieldCheck className="w-4 h-4" />;
};

const gaugeStroke = (tone: 'safe' | 'caution' | 'danger') => {
  if (tone === 'danger') return '#f87171';
  if (tone === 'caution') return '#fbbf24';
  return '#34d399';
};

const ScoreBar: React.FC<{ value: number }> = ({ value }) => {
  const color =
    value > 75 ? 'bg-emerald-400' : value > 50 ? 'bg-cyan-400' : 'bg-amber-400';
  return (
    <div className="w-full bg-ocean-800 h-1.5 rounded-full overflow-hidden mt-1">
      <div className={`${color} h-full transition-all`} style={{ width: `${value}%` }} />
    </div>
  );
};

const TodaySkeleton: React.FC = () => (
  <div className="space-y-4" aria-busy="true" aria-live="polite">
    <Card padding="lg">
      <Skeleton height="1.5rem" width="60%" />
      <div className="mt-4 space-y-2">
        <Skeleton height="1rem" />
        <Skeleton height="1rem" width="80%" />
      </div>
    </Card>
    <Card padding="lg">
      <Skeleton height="1.25rem" width="40%" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height="5rem" />
        ))}
      </div>
    </Card>
    <Card padding="lg">
      <Skeleton height="1.25rem" width="50%" />
      <div className="mt-4 space-y-2">
        <Skeleton height="2.5rem" />
        <Skeleton height="2.5rem" />
      </div>
    </Card>
  </div>
);

export const TodayView: React.FC<TodayViewProps> = ({
  assessment,
  language,
  isLoading,
  onRefreshTrip,
}) => {
  const speech = useSpeech(language);

  if (isLoading && !assessment) {
    return <TodaySkeleton />;
  }

  if (!assessment) {
    return (
      <EmptyState
        icon={<Gauge className="w-6 h-6" />}
        title="No assessment yet"
        description="ORCA is ready. Refresh to fetch the latest ISRO satellite and ocean model data."
        action={<Button onClick={onRefreshTrip}>Run assessment</Button>}
      />
    );
  }

  const tone = verdictTone(assessment.risk_score, assessment.circuit_breaker_triggered);
  const verdictLabel = tone === 'danger' ? 'Danger' : tone === 'caution' ? 'Caution' : 'Safe';
  const verdictStatusLabel = assessment.circuit_breaker_triggered
    ? 'Circuit Breaker Override'
    : tone === 'danger'
      ? 'Do Not Venture'
      : tone === 'caution'
        ? 'Moderate Caution'
        : 'Safe Seaworthiness';

  return (
    <div className="space-y-4">
      {/* Primary Seaworthiness Verdict Card */}
      <Card padding="lg" tone={tone === 'danger' ? 'accent' : 'default'}>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-4 max-w-xl min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={tone} icon={verdictIcon(tone)}>
                {verdictStatusLabel}
              </StatusBadge>
              <span className="text-[11px] text-ink-muted">
                Confidence {Math.round(assessment.provenance.confidence_score * 100)}%
                {' · '}
                {assessment.provenance.data_freshness}
              </span>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider text-ink-muted font-bold">
                Seaworthiness verdict
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {assessment.verdict}
              </h2>
              {assessment.override_reason && (
                <p className="text-xs text-red-300 mt-1.5 font-medium">
                  {assessment.override_reason}
                </p>
              )}
            </div>

            <blockquote className="text-sm text-slate-100 leading-relaxed bg-ocean-950/60 p-4 rounded-xl border border-ocean-800">
              “{assessment.explanation.plain_language_text}”
            </blockquote>

            <AudioButton
              isPlaying={speech.isPlaying}
              onPlay={() => speech.play(assessment.explanation.plain_language_text)}
              onStop={speech.stop}
              label={`Listen (${verdictLabel})`}
              size="md"
              variant={tone === 'danger' ? 'amber' : 'cyan'}
            />
          </div>

          <div className="flex flex-col items-center justify-center bg-ocean-950 border border-ocean-800 px-6 py-5 rounded-2xl text-center min-w-[10rem]">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  stroke="#0c4a6e"
                  strokeWidth="3.5"
                  fill="none"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  stroke={gaugeStroke(tone)}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${assessment.risk_score}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{assessment.risk_score}</span>
                <span className="text-[10px] text-ink-muted font-bold uppercase">Risk / 100</span>
              </div>
            </div>
            <p className="text-[11px] text-ink-muted mt-3 leading-snug">
              Capsizing threshold: {Math.round(0.6 * assessment.vessel_length_m * 10) / 10}m
            </p>
          </div>
        </div>
      </Card>

      {/* Hydrodynamic Vessel Stability Twin & Ocean Bathymetry Sounder Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <VesselStabilityGauge
          vesselLengthM={assessment.vessel_length_m}
          waveHeightM={1.1}
          rollAngleDeg={4.2}
        />
        <OceanBathymetryChart
          currentDepthM={48.5}
          vesselDraftM={0.8}
        />
      </div>

      {/* Satellite Pass Radar & LoRa Hardware Visualizer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SatellitePassRadar />
        <LoRaPacketVisualizer />
      </div>

      {/* Habitat Suitability (HSI) Multi-Species Matrix */}
      <Card padding="md">
        <CardHeader
          title="Habitat suitability (HSI)"
          description="Multi-species pelagic index from INCOIS OCM-3 bio-thermal feed"
          icon={<Fish className="w-4 h-4 text-cyan-400" />}
          badge={
            <span className="text-[11px] font-semibold text-cyan-300 bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded-md">
              INCOIS OCM-3
            </span>
          }
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {Object.entries(assessment.species_matrix).map(([species, score]) => (
            <div
              key={species}
              className="bg-ocean-950 border border-ocean-800 hover:border-ocean-700 rounded-xl p-3 transition"
            >
              <p className="text-xs font-semibold text-slate-200 truncate">
                {species.split(' ')[0]}
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold text-cyan-300">{score}</span>
                <span className="text-[10px] text-ink-subtle font-semibold">/100 HSI</span>
              </div>
              <ScoreBar value={score} />
            </div>
          ))}
        </div>
      </Card>

      {/* Eco-Economic ROI Docking Optimizer */}
      <Card padding="md">
        <CardHeader
          title="Eco-economic ROI"
          description="Profit-maximizing docking harbor from wholesale auction rates"
          icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
          badge={
            <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-md">
              Wholesale auctions
            </span>
          }
        />
        <div className="bg-emerald-950/40 border border-emerald-900/60 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 mt-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold">
              Recommended dock
            </p>
            <h4 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 truncate">
              <Anchor className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{assessment.economics.best_docking_harbor}</span>
            </h4>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-ink-muted">Expected net profit</p>
            <p className="text-2xl font-bold text-emerald-300">
              ₹{assessment.economics.max_expected_profit_inr.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="mt-4 -mx-5 overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-200">
            <thead className="text-[10px] uppercase bg-ocean-950 text-ink-muted font-bold border-b border-ocean-800">
              <tr>
                <th className="px-5 py-2.5">Coastal harbor</th>
                <th className="px-3 py-2.5 text-right">Rate</th>
                <th className="px-3 py-2.5 text-right">Gross</th>
                <th className="px-3 py-2.5 text-right">Fuel</th>
                <th className="px-3 py-2.5 text-right">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ocean-800">
              {assessment.economics.harbor_comparisons.map((h, i) => (
                <tr
                  key={i}
                  className={h.recommended ? 'bg-emerald-950/40 text-emerald-200' : 'hover:bg-ocean-950/50'}
                >
                  <td className="px-5 py-2.5 flex items-center gap-1.5">
                    {h.recommended && (
                      <span className="text-emerald-400" aria-hidden="true">
                        ★
                      </span>
                    )}
                    <span className="truncate max-w-[16rem]">{h.harbor_name}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right">₹{h.unit_price_per_kg}/kg</td>
                  <td className="px-3 py-2.5 text-right">
                    ₹{h.gross_revenue_inr.toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-2.5 text-right text-amber-300">
                    ₹{h.total_fuel_cost_inr.toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-emerald-300">
                    ₹{h.net_profit_inr.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card padding="md">
          <CardHeader
            title="Pathfinder route"
            icon={<Navigation className="w-4 h-4 text-cyan-400" />}
          />
          <p className="text-sm font-semibold text-white mt-3">{assessment.route.path_type}</p>
          <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-ocean-800 mt-3">
            <span>
              Distance: <strong className="text-white">{assessment.route.total_distance_km} km</strong>
            </span>
            <span>
              ETA: <strong className="text-white">{assessment.route.estimated_travel_mins} min</strong>
            </span>
          </div>
          {assessment.route.avoided_hazards.length > 0 && (
            <div className="mt-3 text-[11px] text-ink-muted">
              Detours: {assessment.route.avoided_hazards.join(' · ')}
            </div>
          )}
        </Card>

        <Card padding="md">
          <CardHeader
            title="Hydro-acoustic fuel twin"
            icon={<Fuel className="w-4 h-4 text-amber-400" />}
          />
          <p className="text-sm font-semibold text-amber-200 mt-3">
            {assessment.route.fuel_consumption_est_liters} L diesel
          </p>
          <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-ocean-800 mt-3">
            <span>
              BSFC: <strong className="text-white">240 g/hp·hr</strong>
            </span>
            <span>
              Slip: <strong className="text-white">12.4%</strong>
            </span>
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={onRefreshTrip}
        >
          Reassess trip
        </Button>
      </div>
    </div>
  );
};