import React, { useMemo } from 'react';
import {
  Compass,
  Droplets,
  Gauge,
  Thermometer,
  Waves,
  Wind,
} from 'lucide-react';
import { OceanState, RiskState, TripAssessmentResponse } from '../../types';
import { formatKm, formatPct, bearingToCompass } from '../../utils/format';

interface OceanVitalsProps {
  assessment: TripAssessmentResponse | null;
}

interface Vital {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone: 'cyan' | 'emerald' | 'amber' | 'red';
  /** value 0..100 for the small bar */
  intensity: number;
}

const TONE_BAR: Record<Vital['tone'], string> = {
  cyan: 'bg-cyan-400',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  red: 'bg-red-400',
};

function intensityFromWave(h: number): number {
  // 0 → 0%, 4m → 100%
  return Math.max(0, Math.min(100, (h / 4) * 100));
}
function intensityFromSST(c: number): number {
  // 0-35C → 0-100%
  return Math.max(0, Math.min(100, (c / 35) * 100));
}
function intensityFromChl(mg: number): number {
  // 0-10 mg/m³ → 0-100%
  return Math.max(0, Math.min(100, (mg / 10) * 100));
}

export const OceanVitals: React.FC<OceanVitalsProps> = ({ assessment }) => {
  const ocean: OceanState | undefined = assessment?.world_model?.ocean_state;
  const risk: RiskState | undefined = assessment?.world_model?.risk_state;

  const vitals: Vital[] = useMemo(() => {
    if (!ocean) return [];
    return [
      {
        label: 'SST',
        value: ocean.sst_c.toFixed(1),
        unit: '°C',
        Icon: Thermometer,
        tone: 'amber',
        intensity: intensityFromSST(ocean.sst_c),
        hint: 'Sea Surface Temp · INSAT-3DR',
      },
      {
        label: 'Wave',
        value: ocean.wave_height_m.toFixed(2),
        unit: 'm',
        Icon: Waves,
        tone: ocean.wave_height_m > 2.5 ? 'red' : ocean.wave_height_m > 1.2 ? 'amber' : 'cyan',
        intensity: intensityFromWave(ocean.wave_height_m),
        hint: `${ocean.wave_period_s.toFixed(1)}s period · WW3`,
      },
      {
        label: 'Current',
        value: ocean.current_speed_ms.toFixed(2),
        unit: 'm/s',
        Icon: Wind,
        tone: 'cyan',
        intensity: Math.max(0, Math.min(100, (ocean.current_speed_ms / 1.5) * 100)),
        hint: `${bearingToCompass(ocean.current_dir_deg)} · ROMS`,
      },
      {
        label: 'Chl-a',
        value: ocean.chlorophyll_mg_m3.toFixed(2),
        unit: 'mg/m³',
        Icon: Droplets,
        tone: 'emerald',
        intensity: intensityFromChl(ocean.chlorophyll_mg_m3),
        hint: 'Productivity · OCM-3',
      },
    ];
  }, [ocean]);

  if (!ocean || !risk) {
    return (
      <section className="glass rounded-2xl p-5 relative overflow-hidden">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">
          Ocean Vitals
        </h3>
        <p className="mt-4 text-xs text-ink-muted">Awaiting world-model telemetry.</p>
      </section>
    );
  }

  return (
    <section className="glass rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute inset-0 tactical-grid-fine opacity-30 pointer-events-none" />
      <header className="relative flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
          Ocean Vitals · Real-Time
        </h3>
        <span className="chip">{ocean.salinity_psu.toFixed(1)} PSU</span>
      </header>

      <div className="relative grid grid-cols-2 gap-3">
        {vitals.map((v) => (
          <div
            key={v.label}
            className="rounded-xl border border-cyan-500/15 bg-ocean-1000/60 p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-ink-muted font-bold">
                {v.label}
              </span>
              <v.Icon className="w-3.5 h-3.5 text-cyan-300/80" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white numeric leading-none">
                {v.value}
              </span>
              {v.unit && <span className="text-[10px] text-ink-muted font-bold">{v.unit}</span>}
            </div>
            <div className="h-1 rounded-full bg-ocean-800 overflow-hidden">
              <div
                className={`${TONE_BAR[v.tone]} h-full transition-all duration-700`}
                style={{ width: `${v.intensity}%` }}
              />
            </div>
            {v.hint && <p className="text-[10px] text-ink-muted">{v.hint}</p>}
          </div>
        ))}
      </div>

      {/* Risk sub-grid */}
      <div className="relative mt-4 grid grid-cols-2 gap-3 text-[11px]">
        <RiskChip
          label="IMBL"
          value={formatKm(risk.dist_to_imbl_km)}
          Icon={Compass}
          tone={risk.dist_to_imbl_km < 20 ? 'red' : risk.dist_to_imbl_km < 50 ? 'amber' : 'cyan'}
        />
        <RiskChip
          label="Naval"
          value={formatKm(risk.dist_to_naval_zone_km)}
          Icon={Compass}
          tone={risk.dist_to_naval_zone_km < 30 ? 'red' : 'cyan'}
        />
        <RiskChip
          label="Capsize"
          value={risk.capsizing_risk ? 'YES' : 'NO'}
          Icon={Gauge}
          tone={risk.capsizing_risk ? 'red' : 'emerald'}
        />
        <RiskChip
          label="CPA"
          value={`${risk.collision_cpa_nm.toFixed(2)} NM`}
          Icon={Gauge}
          tone={risk.collision_cpa_nm < 0.5 ? 'red' : risk.collision_cpa_nm < 1.5 ? 'amber' : 'cyan'}
        />
      </div>
    </section>
  );
};

const RiskChip: React.FC<{
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone: 'cyan' | 'amber' | 'red' | 'emerald';
}> = ({ label, value, Icon, tone }) => {
  const colorClass =
    tone === 'red'
      ? 'border-red-500/40 bg-red-950/40 text-red-200'
      : tone === 'amber'
        ? 'border-amber-500/40 bg-amber-950/40 text-amber-200'
        : tone === 'emerald'
          ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
          : 'border-cyan-500/30 bg-cyan-950/40 text-cyan-200';
  return (
    <div className={`rounded-xl border px-2.5 py-2 flex items-center justify-between ${colorClass}`}>
      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold">
        <Icon className="w-3 h-3" /> {label}
      </span>
      <span className="text-xs font-bold numeric">{value}</span>
    </div>
  );
};