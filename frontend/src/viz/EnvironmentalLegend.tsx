import React from 'react';
import { Layers, Wind, Droplets, Gauge, Compass } from 'lucide-react';
import type { EnvironmentalVisualizationState } from './envState';
import {
  rgbaString,
  waveRamp,
  windRamp,
  currentRamp,
  riskRamp,
  normaliseWaveHeight,
  normaliseWindSpeed,
  normaliseCurrentSpeed,
  normaliseRisk,
} from './colorRamps';

/**
 * EnvironmentalLegend — renders compact per-layer colour bars so the
 * user can read off what each visualisation represents. Bars are
 * derived from real env values; legend does NOT animate.
 */

interface EnvironmentalLegendProps {
  env: EnvironmentalVisualizationState;
}

interface LegendRow {
  label: string;
  ramp: (t: number) => readonly [number, number, number, number];
  normalise: (v: number | null) => number;
  value: number | null;
  unit: string;
  Icon: React.ComponentType<{ className?: string }>;
}

export const EnvironmentalLegend: React.FC<EnvironmentalLegendProps> = ({ env }) => {
  const rows: LegendRow[] = [
    {
      label: 'Wave',
      ramp: waveRamp,
      normalise: normaliseWaveHeight,
      value: env.waveHeight.value,
      unit: 'm',
      Icon: Gauge,
    },
    {
      label: 'Wind',
      ramp: windRamp,
      normalise: normaliseWindSpeed,
      value: env.windSpeed.value,
      unit: 'km/h',
      Icon: Wind,
    },
    {
      label: 'Current',
      ramp: currentRamp,
      normalise: normaliseCurrentSpeed,
      value: env.currentSpeed.value,
      unit: 'm/s',
      Icon: Compass,
    },
    {
      label: 'Risk',
      ramp: riskRamp,
      normalise: normaliseRisk,
      value: env.risk.score,
      unit: '/100',
      Icon: Layers,
    },
  ];

  return (
    <div
      className="glass rounded-2xl px-3.5 py-3 space-y-2"
      role="region"
      aria-label="Environmental layer legend"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
          Legend
        </p>
        <span className="text-[9px] text-ink-muted">
          {env.isOffline ? 'OFFLINE' : env.isDemo ? 'DEMO / SIM' : 'LIVE'}
        </span>
      </div>
      {rows.map((r) => {
        const t = r.normalise(r.value);
        const c = r.ramp(t);
        const swatch = rgbaString([c[0], c[1], c[2], Math.min(0.9, c[3] + 0.25)]);
        return (
          <div key={r.label} className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1 text-ink-muted font-bold uppercase tracking-wider">
                <r.Icon className="w-3 h-3 text-cyan-300" />
                {r.label}
              </span>
              <span className="text-white numeric font-bold">
                {r.value != null ? `${r.value.toFixed(r.label === 'Risk' ? 0 : 1)} ${r.unit}` : '—'}
              </span>
            </div>
            <div className="relative h-1.5 rounded-full bg-ocean-900 overflow-hidden border border-cyan-500/10">
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(90deg, ${rgbaString([c[0] * 0.6, c[1] * 0.6, c[2] * 0.6, 0.7])}, ${swatch})`,
                }}
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white/90"
                style={{
                  left: `${t * 100}%`,
                  boxShadow: '0 0 6px rgba(255,255,255,0.7)',
                }}
              />
            </div>
          </div>
        );
      })}
      <div className="pt-1 border-t border-cyan-500/10 flex items-center gap-1 text-[9px] text-ink-muted">
        <Droplets className="w-2.5 h-2.5" />
        Markers reflect current point value; particles draw only when source has data.
      </div>
    </div>
  );
};

EnvironmentalLegend.displayName = 'EnvironmentalLegend';