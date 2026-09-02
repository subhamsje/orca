import React, { useMemo } from 'react';
import {
  Cloud,
  Compass,
  Droplets,
  Eye,
  Gauge,
  Sun,
  Thermometer,
  Waves,
  Wind,
} from 'lucide-react';
import { OceanState, RiskState, TripAssessmentResponse } from '../../types';
import { formatKm, bearingToCompass } from '../../utils/format';

interface OceanVitalsProps {
  assessment: TripAssessmentResponse | null;
}

const TONE_BAR: Record<'cyan' | 'emerald' | 'amber' | 'red', string> = {
  cyan: 'bg-cyan-400',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  red: 'bg-red-400',
};

function intensityFromWave(h: number): number {
  return Math.max(0, Math.min(100, (h / 4) * 100));
}
function intensityFromSST(c: number): number {
  return Math.max(0, Math.min(100, (c / 35) * 100));
}
function intensityFromChl(mg: number): number {
  return Math.max(0, Math.min(100, (mg / 10) * 100));
}
function intensityFromWind(kmh: number): number {
  return Math.max(0, Math.min(100, (kmh / 60) * 100));
}

export const OceanVitals: React.FC<OceanVitalsProps> = ({ assessment }) => {
  const ocean: OceanState | undefined = assessment?.world_model?.ocean_state;
  const risk: RiskState | undefined = assessment?.world_model?.risk_state;

  const cards = useMemo(() => {
    if (!ocean) return [];
    return [
      {
        label: 'SST',
        value: ocean.sst_c.toFixed(1),
        unit: '°C',
        Icon: Thermometer,
        tone: 'amber' as const,
        intensity: intensityFromSST(ocean.sst_c),
        hint: 'Sea Surface Temp · INSAT-3DR',
      },
      {
        label: 'Wave',
        value: ocean.wave_height_m.toFixed(2),
        unit: 'm',
        Icon: Waves,
        tone:
          ocean.wave_height_m > 2.5
            ? ('red' as const)
            : ocean.wave_height_m > 1.2
              ? ('amber' as const)
              : ('cyan' as const),
        intensity: intensityFromWave(ocean.wave_height_m),
        hint: `${ocean.wave_period_s.toFixed(1)}s period · WW3`,
      },
      {
        label: 'Wind',
        value: ocean.wind_speed_kmh.toFixed(0),
        unit: 'km/h',
        Icon: Wind,
        tone:
          ocean.wind_speed_kmh > 35
            ? ('red' as const)
            : ocean.wind_speed_kmh > 20
              ? ('amber' as const)
              : ('cyan' as const),
        intensity: intensityFromWind(ocean.wind_speed_kmh),
        hint: `${ocean.wind_direction_cardinal} ${ocean.wind_direction_deg.toFixed(0)}° · gusts ${ocean.wind_gust_kmh.toFixed(0)}`,
      },
      {
        label: 'Swell',
        value: ocean.swell_wave_height_m.toFixed(2),
        unit: 'm',
        Icon: Waves,
        tone: 'cyan' as const,
        intensity: intensityFromWave(ocean.swell_wave_height_m),
        hint: `${ocean.swell_wave_period_s.toFixed(1)}s · ${bearingToCompass(ocean.swell_wave_direction_deg)} ${ocean.swell_wave_direction_deg.toFixed(0)}°`,
      },
      {
        label: 'Current',
        value: ocean.current_speed_ms.toFixed(2),
        unit: 'm/s',
        Icon: Compass,
        tone: 'cyan' as const,
        intensity: Math.max(0, Math.min(100, (ocean.current_speed_ms / 1.5) * 100)),
        hint: `${bearingToCompass(ocean.current_dir_deg)} · ROMS`,
      },
      {
        label: 'Chl-a',
        value: ocean.chlorophyll_mg_m3.toFixed(2),
        unit: 'mg/m³',
        Icon: Droplets,
        tone: 'emerald' as const,
        intensity: intensityFromChl(ocean.chlorophyll_mg_m3),
        hint: 'Productivity · OCM-3',
      },
      {
        label: 'Pressure',
        value: ocean.air_pressure_hpa.toFixed(0),
        unit: 'hPa',
        Icon: Gauge,
        tone:
          ocean.air_pressure_hpa < 1000
            ? ('amber' as const)
            : ocean.air_pressure_hpa > 1020
              ? ('emerald' as const)
              : ('cyan' as const),
        intensity: Math.max(0, Math.min(100, ((ocean.air_pressure_hpa - 990) / 40) * 100)),
        hint: `Air ${ocean.air_temperature_c.toFixed(0)}°C`,
      },
      {
        label: 'Visibility',
        value: ocean.visibility_km.toFixed(0),
        unit: 'km',
        Icon: Eye,
        tone:
          ocean.visibility_km < 4
            ? ('red' as const)
            : ocean.visibility_km < 8
              ? ('amber' as const)
              : ('emerald' as const),
        intensity: Math.max(0, Math.min(100, (ocean.visibility_km / 15) * 100)),
        hint: `Cloud ${ocean.cloud_cover_pct.toFixed(0)}%`,
      },
    ];
  }, [ocean]);

  if (!ocean || !risk) {
    return (
      <section className="glass rounded-2xl p-4 relative overflow-hidden">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">
          Live Ocean Vitals
        </h3>
        <p className="mt-3 text-xs text-ink-muted">Awaiting world-model telemetry.</p>
      </section>
    );
  }

  return (
    <section className="glass rounded-2xl p-4 relative overflow-hidden">
      <div className="absolute inset-0 tactical-grid-fine opacity-30 pointer-events-none" />
      <header className="relative flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
          Live Ocean Vitals
        </h3>
        <span className="chip text-[9px]">{ocean.salinity_psu.toFixed(1)} PSU</span>
      </header>

      <div className="relative grid grid-cols-2 gap-2">
        {cards.map((v) => (
          <div
            key={v.label}
            className="rounded-lg border border-cyan-500/15 bg-ocean-1000/60 p-2.5 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider text-ink-muted font-bold">
                {v.label}
              </span>
              <v.Icon className="w-3 h-3 text-cyan-300/80" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-white numeric leading-none">
                {v.value}
              </span>
              {v.unit && (
                <span className="text-[9px] text-ink-muted font-bold">{v.unit}</span>
              )}
            </div>
            <div className="h-1 rounded-full bg-ocean-800 overflow-hidden">
              <div
                className={`${TONE_BAR[v.tone]} h-full transition-all duration-700`}
                style={{ width: `${v.intensity}%` }}
              />
            </div>
            {v.hint && (
              <p className="text-[8.5px] text-ink-muted leading-tight truncate">{v.hint}</p>
            )}
          </div>
        ))}
      </div>

      <div className="relative mt-3 grid grid-cols-4 gap-1.5 text-[10px]">
        <RiskChip
          label="IMBL"
          value={formatKm(risk.dist_to_imbl_km)}
          tone={
            risk.dist_to_imbl_km < 20
              ? 'red'
              : risk.dist_to_imbl_km < 50
                ? 'amber'
                : 'cyan'
          }
        />
        <RiskChip
          label="Naval"
          value={formatKm(risk.dist_to_naval_zone_km)}
          tone={risk.dist_to_naval_zone_km < 30 ? 'red' : 'cyan'}
        />
        <RiskChip
          label="Capsize"
          value={risk.capsizing_risk ? 'YES' : 'NO'}
          tone={risk.capsizing_risk ? 'red' : 'emerald'}
        />
        <RiskChip
          label="CPA"
          value={`${risk.collision_cpa_nm.toFixed(2)} NM`}
          tone={
            risk.collision_cpa_nm < 0.5
              ? 'red'
              : risk.collision_cpa_nm < 1.5
                ? 'amber'
                : 'cyan'
          }
        />
      </div>
    </section>
  );
};

const RiskChip: React.FC<{
  label: string;
  value: string;
  tone: 'cyan' | 'amber' | 'red' | 'emerald';
}> = ({ label, value, tone }) => {
  const colorClass =
    tone === 'red'
      ? 'border-red-500/40 bg-red-950/40 text-red-200'
      : tone === 'amber'
        ? 'border-amber-500/40 bg-amber-950/40 text-amber-200'
        : tone === 'emerald'
          ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
          : 'border-cyan-500/30 bg-cyan-950/40 text-cyan-200';
  return (
    <div className={`rounded-md border px-1.5 py-1 ${colorClass}`}>
      <p className="text-[8px] uppercase tracking-wider font-bold">{label}</p>
      <p className="text-[10px] font-bold numeric truncate">{value}</p>
    </div>
  );
};