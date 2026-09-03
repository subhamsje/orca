import React from 'react';
import { Activity, AlertTriangle, Anchor, BarChart3, CheckCircle2, Compass, Droplets, Eye, Gauge, Layers, Shield, Wind } from 'lucide-react';

interface RiskComponent {
  name: string;
  score: number;
  weighted_contribution: number;
  details: Record<string, any>;
}

interface RiskResult {
  risk_score: number;
  risk_label: string;
  risk_uncertainty: number;
  data_confidence: number;
  data_quality_score: number;
  unavailable_parameters: string[];
  components: RiskComponent[];
  circuit_breaker: {
    triggered: boolean;
    forced_label: string | null;
    data_quality_insufficient: boolean;
    hits: Array<{ rule_id: string; rule_description: string; input_value: any; threshold: any; source: string; timestamp: number }>;
  };
  risk_equation: string;
  raw_score_before_cb?: number;
  calculation_version?: string;
  configuration_version?: string;
}

const COMPONENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  wave_height: Anchor,
  wave_vessel_interaction: Compass,
  wind: Wind,
  gust: Wind,
  current: Droplets,
  visibility: Eye,
  pressure: Gauge,
  precipitation: Droplets,
  official_warning: AlertTriangle,
};

const COMPONENT_LABELS: Record<string, string> = {
  wave_height: 'Wave height',
  wave_vessel_interaction: 'Wave-vessel interaction',
  wind: 'Wind',
  gust: 'Gust',
  current: 'Current',
  visibility: 'Visibility',
  pressure: 'Pressure',
  precipitation: 'Precipitation',
  official_warning: 'Official warning',
};

const LABEL_TONE: Record<string, string> = {
  SAFE: 'text-emerald-300',
  PROCEED_WITH_CAUTION: 'text-amber-300',
  HIGH_RISK: 'text-orange-300',
  HIGH_RISK_CYCLONE: 'text-red-300',
  HIGH_RISK_GUST: 'text-red-300',
  HIGH_RISK_CAPSIZE: 'text-red-300',
  HIGH_RISK_IMBL: 'text-red-300',
  EXTREME_DANGER: 'text-red-300',
  EXTREME_DANGER_CYCLONE: 'text-red-400',
  INSUFFICIENT_CURRENT_DATA: 'text-amber-300',
};

export const RiskBreakdownPanel: React.FC<{ risk: RiskResult | null }> = ({ risk }) => {
  if (!risk) {
    return (
      <section className="glass rounded-2xl p-4 relative overflow-hidden">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5" /> Risk Breakdown
        </h3>
        <p className="mt-3 text-xs text-ink-muted">Awaiting risk engine output.</p>
      </section>
    );
  }

  const tone = LABEL_TONE[risk.risk_label] ?? 'text-cyan-300';
  const contribSum = risk.components.reduce((s, c) => s + (c.weighted_contribution || 0), 0);
  const rawPts = risk.raw_score_before_cb ?? Math.round(contribSum * 100);
  const cbGap = risk.risk_score - rawPts;
  const gapLabel =
    cbGap > 0
      ? `Circuit breaker lifted the score by ${cbGap} pts`
      : cbGap < 0
        ? `Raw score ${rawPts}, final ${risk.risk_score} (clamped/overridden)`
        : 'No circuit-breaker override applied';

  return (
    <section className="glass rounded-2xl p-4 relative overflow-hidden">
      <div className="absolute inset-0 tactical-grid-fine opacity-20 pointer-events-none" />
      <header className="relative flex items-center justify-between gap-2 mb-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5" /> Risk Breakdown
        </h3>
        <span className="chip chip-cyan text-[9px]">
          ORCA MRSI v{risk.calculation_version?.split('-').pop() ?? '1.0.0'}
        </span>
      </header>

      <div className="relative grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg border border-cyan-500/20 bg-ocean-1000/60 px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wider text-ink-muted font-bold">Risk</p>
          <p className={`text-2xl font-black numeric leading-none mt-1 ${tone}`}>
            {risk.risk_score}
          </p>
          <p className="text-[9px] text-ink-muted font-bold mt-0.5">
            {risk.risk_label.replace(/_/g, ' ')}
          </p>
        </div>
        <div className="rounded-lg border border-cyan-500/20 bg-ocean-1000/60 px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wider text-ink-muted font-bold">Data</p>
          <p className="text-2xl font-black numeric leading-none mt-1 text-cyan-200">
            {Math.round(risk.data_quality_score * 100)}
            <span className="text-xs text-ink-muted">%</span>
          </p>
          <p className="text-[9px] text-ink-muted font-bold mt-0.5">
            Confidence {Math.round(risk.data_confidence * 100)}%
          </p>
        </div>
      </div>

      <ul className="relative space-y-1.5">
        {risk.components.map((c) => {
          const Icon = COMPONENT_ICONS[c.name] ?? Activity;
          const label = COMPONENT_LABELS[c.name] ?? c.name;
          const pts = Math.round(c.weighted_contribution * 100);
          const pct = Math.max(0, Math.min(100, c.score * 100));
          return (
            <li
              key={c.name}
              className="rounded-md border border-cyan-500/10 bg-ocean-1000/40 px-2.5 py-1.5"
            >
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-[10px] font-bold text-slate-200 flex items-center gap-1.5">
                  <Icon className="w-3 h-3 text-cyan-300" /> {label}
                </span>
                <span className="text-[10px] font-bold text-cyan-200 numeric">
                  +{pts} pts
                </span>
              </div>
              <div className="h-1 rounded-full bg-ocean-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${
                    pct > 75 ? 'bg-red-400' : pct > 50 ? 'bg-amber-400' : pct > 25 ? 'bg-cyan-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[9px] text-ink-muted leading-snug mt-0.5 line-clamp-2">
                {Object.entries(c.details)
                  .filter(([k, v]) => !['status', 'source', 'freshness'].includes(k) && v !== null && v !== undefined)
                  .slice(0, 3)
                  .map(([k, v]) => `${k}=${typeof v === 'number' ? v.toFixed(2) : v}`)
                  .join(' · ')}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="relative mt-3 pt-3 border-t border-cyan-500/15 text-[10px]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-ink-muted font-bold uppercase tracking-wider">Reconciliation</span>
          <span className="text-cyan-200 numeric font-bold">
            raw {rawPts} → final {risk.risk_score}
          </span>
        </div>
        <p className="text-ink-muted leading-snug">{gapLabel}</p>
      </div>

      {risk.circuit_breaker.triggered && (
        <div className="relative mt-3 rounded-lg border border-red-500/40 bg-red-950/40 p-2.5">
          <p className="text-[10px] font-bold text-red-200 flex items-center gap-1.5 uppercase tracking-wider">
            <Shield className="w-3 h-3" /> Circuit Breaker — Forced Verdict
          </p>
          <ul className="mt-1.5 space-y-1 text-[10px] text-red-200/90">
            {risk.circuit_breaker.hits.map((h, i) => (
              <li key={i} className="leading-snug">
                <code className="text-red-300 font-mono">{h.rule_id}</code>: {h.rule_description}
                {h.input_value != null && (
                  <span className="text-red-200/70">
                    {' '}
                    (input: {typeof h.input_value === 'number' ? h.input_value.toFixed(2) : String(h.input_value)})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {risk.unavailable_parameters.length > 0 && (
        <div className="relative mt-3 rounded-lg border border-amber-500/40 bg-amber-950/30 p-2.5">
          <p className="text-[10px] font-bold text-amber-200 flex items-center gap-1.5 uppercase tracking-wider">
            <AlertTriangle className="w-3 h-3" /> Unavailable
          </p>
          <p className="text-[9.5px] text-amber-200/80 mt-0.5">
            {risk.unavailable_parameters.join(', ')}
          </p>
        </div>
      )}

      <details className="relative mt-3 text-[9px] text-ink-muted">
        <summary className="cursor-pointer hover:text-cyan-300 font-bold uppercase tracking-wider">
          Calculation equation
        </summary>
        <code className="block mt-1 p-2 rounded bg-ocean-1000/60 text-[9px] leading-snug whitespace-pre-wrap break-words selectable">
          {risk.risk_equation}
        </code>
      </details>
    </section>
  );
};
