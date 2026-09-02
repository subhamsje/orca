import React, { useMemo } from 'react';
import {
  Anchor,
  AudioLines,
  Compass,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { TripAssessmentResponse, VerdictTone, verdictTone } from '../../types';
import { useSpeech } from '../../hooks/useSpeech';
import { formatINR, formatKm } from '../../utils/format';

interface VerdictHeroProps {
  assessment: TripAssessmentResponse | null;
  language: string;
  isLoading: boolean;
  onRefresh: () => void;
}

const TONE_HEX: Record<VerdictTone, { from: string; to: string; ring: string; glow: string }> = {
  safe: {
    from: 'rgba(16, 185, 129, 0.4)',
    to: 'rgba(16, 185, 129, 0)',
    ring: 'rgba(16, 185, 129, 0.6)',
    glow: '0 0 80px -20px rgba(16, 185, 129, 0.6)',
  },
  caution: {
    from: 'rgba(245, 158, 11, 0.45)',
    to: 'rgba(245, 158, 11, 0)',
    ring: 'rgba(245, 158, 11, 0.6)',
    glow: '0 0 80px -20px rgba(245, 158, 11, 0.55)',
  },
  danger: {
    from: 'rgba(239, 68, 68, 0.5)',
    to: 'rgba(239, 68, 68, 0)',
    ring: 'rgba(239, 68, 68, 0.65)',
    glow: '0 0 90px -20px rgba(239, 68, 68, 0.7)',
  },
};

const TONE_LABEL: Record<VerdictTone, string> = {
  safe: 'SAFE TO VENTURE',
  caution: 'PROCEED WITH CAUTION',
  danger: 'DO NOT VENTURE',
};

const TONE_ICON: Record<VerdictTone, React.ComponentType<{ className?: string }>> = {
  safe: ShieldCheck,
  caution: Compass,
  danger: ShieldAlert,
};

function RiskGauge({ value, tone }: { value: number; tone: VerdictTone }) {
  const v = Math.max(0, Math.min(100, value));
  const stroke = TONE_HEX[tone].ring;
  const C = 2 * Math.PI * 52;
  const offset = C * (1 - v / 100);
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden>
      <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="6" />
      <circle
        cx="60"
        cy="60"
        r="52"
        fill="none"
        stroke={stroke}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
    </svg>
  );
}

export const VerdictHero: React.FC<VerdictHeroProps> = ({
  assessment,
  language,
  isLoading,
  onRefresh,
}) => {
  const speech = useSpeech(language);

  const tone: VerdictTone = useMemo(() => {
    if (!assessment) return 'caution';
    return verdictTone(assessment.risk_score, assessment.circuit_breaker_triggered);
  }, [assessment]);

  const toneColor = TONE_HEX[tone];
  const Icon = TONE_ICON[tone];

  if (!assessment) {
    return (
      <section className="glass-strong rounded-2xl px-5 py-6 relative overflow-hidden scanlines">
        <div className="flex flex-col items-center justify-center gap-3 text-center py-10">
          <div className="relative w-10 h-10">
            <span className="absolute inset-0 rounded-full bg-cyan-500/30 animate-ping-soft" />
            <span className="absolute inset-1 rounded-full bg-cyan-400/60" />
          </div>
          <p className="text-xs text-cyan-200 font-bold uppercase tracking-[0.2em]">
            Awaiting Ocean Telemetry
          </p>
          <p className="text-[11px] text-ink-muted max-w-xs leading-relaxed">
            Pick a global harbor in the right rail or hit <kbd className="rounded bg-ocean-1000 px-1 py-0.5 text-cyan-300 font-mono text-[10px]">⌘K</kbd> to
            trigger a fresh multi-agent assessment.
          </p>
        </div>
      </section>
    );
  }

  const { verdict, risk_score, circuit_breaker_triggered, override_reason } = assessment;
  const explanation = assessment.explanation;
  const isOffline = assessment.provenance.status === 'OFFLINE';

  return (
    <section
      className="glass-strong rounded-2xl relative overflow-hidden"
      style={{ boxShadow: toneColor.glow }}
      aria-label="Trip verdict"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 0% 0%, ${toneColor.from}, ${toneColor.to} 60%)`,
        }}
      />
      <div className="absolute inset-0 tactical-grid opacity-30 pointer-events-none" />
      <div className="absolute inset-0 scanlines pointer-events-none" />

      {/* Header chips row */}
      <div className="relative px-5 pt-5 flex flex-wrap items-center gap-2">
        <span
          className={`chip ${
            tone === 'safe'
              ? 'chip-emerald'
              : tone === 'caution'
                ? 'chip-amber'
                : 'chip-red'
          }`}
        >
          <span className="dot bg-current animate-pulse-soft" />
          {TONE_LABEL[tone]}
        </span>
        {circuit_breaker_triggered && (
          <span className="chip chip-red">
            <ShieldAlert className="w-3 h-3" /> CIRCUIT BREAKER
          </span>
        )}
        {isOffline && <span className="chip chip-amber">OFFLINE FALLBACK</span>}
        <span className="chip chip-cyan">
          <Sparkles className="w-3 h-3" /> {Math.round((assessment.provenance.confidence || 0) * 100)}% confidence
        </span>
      </div>

      {/* Big verdict + gauge row */}
      <div className="relative px-5 pt-4 pb-4 flex items-center gap-4">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
          <RiskGauge value={risk_score} tone={tone} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Icon
              className={`w-4 h-4 mb-0.5 ${
                tone === 'safe'
                  ? 'text-emerald-300'
                  : tone === 'caution'
                    ? 'text-amber-300'
                    : 'text-red-300'
              }`}
            />
            <span className="text-2xl sm:text-3xl font-black text-white numeric leading-none">
              {risk_score}
            </span>
            <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-ink-muted">
              /100
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h1
            className={`text-lg sm:text-xl md:text-2xl font-black tracking-tight leading-[1.1] break-words ${
              tone === 'safe'
                ? 'text-emerald-200'
                : tone === 'caution'
                  ? 'text-amber-200'
                  : 'text-red-200'
            }`}
          >
            {verdict}
          </h1>
          {override_reason && (
            <p className="mt-1 text-[10px] text-red-300/90 font-medium leading-snug">
              {override_reason}
            </p>
          )}
        </div>
      </div>

      {/* Plain-language explanation */}
      <div className="relative px-5 pb-3">
        <blockquote className="text-[12.5px] leading-relaxed text-slate-100 bg-ocean-1000/60 border border-ocean-800/80 px-3 py-2.5 rounded-xl">
          <p className="selectable">“{explanation.plain_language_text}”</p>
          <p className="mt-1 text-[10px] text-cyan-300/80">{explanation.wave_description}</p>
        </blockquote>
      </div>

      {/* Vitals strip */}
      <div className="relative px-5 pb-3 grid grid-cols-3 gap-2">
        <VitalStat
          label="Best Dock"
          value={assessment.economics.best_docking_harbor.split('(')[0].trim()}
          accent="emerald"
        />
        <VitalStat
          label="Est. Net"
          value={`₹${formatINR(assessment.economics.max_expected_profit_inr)}`}
          accent="emerald"
        />
        <VitalStat
          label="Distance"
          value={formatKm(assessment.route.total_distance_km)}
          accent="cyan"
        />
      </div>

      {/* Action row */}
      <div className="relative px-5 pb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => speech.play(explanation.plain_language_text)}
          disabled={speech.isPlaying}
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-200 px-3 py-1.5 text-[11px] font-bold transition shadow-lg"
          aria-label="Read verdict aloud"
        >
          {speech.isPlaying ? (
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
          ) : (
            <AudioLines className="w-3.5 h-3.5" />
          )}
          {speech.isPlaying ? 'Speaking…' : `Listen · ${language}`}
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-ocean-700 hover:bg-ocean-800/60 text-slate-200 px-3 py-1.5 text-[11px] font-bold transition"
        >
          <Compass className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Reassess
        </button>
        <span className="ml-auto text-[9px] text-ink-muted font-mono truncate">
          {assessment.provenance.id}
        </span>
      </div>

      {/* Footer audit strip */}
      <div className="relative border-t border-cyan-500/15 px-5 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9.5px] uppercase tracking-[0.16em] text-cyan-300/80 font-bold bg-ocean-1000/40">
        <span className="flex items-center gap-1.5">
          <span className="dot bg-emerald-400 animate-pulse-soft" />
          ORCA-MultiObjective-v4.0
        </span>
        <span className="text-ink-muted">·</span>
        <span>
          {assessment.telemetry.execution_ms.toFixed(0)} ms · {assessment.telemetry.services_triggered.length} agents
        </span>
        <span className="text-ink-muted">·</span>
        <span>{assessment.provenance.source}</span>
        {assessment.provenance.is_simulated && (
          <>
            <span className="text-ink-muted">·</span>
            <span className="text-amber-300">SIMULATED</span>
          </>
        )}
      </div>
    </section>
  );
};

const VitalStat: React.FC<{
  label: string;
  value: string;
  accent: 'cyan' | 'emerald' | 'amber';
}> = ({ label, value, accent }) => (
  <div
    className={`rounded-lg border px-2.5 py-2 ${
      accent === 'cyan'
        ? 'border-cyan-500/25 bg-cyan-950/30'
        : accent === 'emerald'
          ? 'border-emerald-500/25 bg-emerald-950/25'
          : 'border-amber-500/25 bg-amber-950/25'
    }`}
  >
    <p className="text-[8.5px] uppercase tracking-[0.18em] text-ink-muted font-bold">{label}</p>
    <p className="text-[12px] font-bold text-white truncate numeric">{value}</p>
  </div>
);