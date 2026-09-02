import React, { useMemo } from 'react';
import {
  AlertCircle,
  Cloud,
  Compass,
  Droplets,
  Eye,
  Gauge,
  Thermometer,
  Waves,
  Wind,
} from 'lucide-react';
import { OceanState, RiskState, TripAssessmentResponse } from '../../types';
import { formatKm, bearingToCompass } from '../../utils/format';
import { ProvenanceBadge } from './ProvenanceBadge';

interface OceanVitalsProps {
  assessment: TripAssessmentResponse | null;
}

const TONE_BAR: Record<'cyan' | 'emerald' | 'amber' | 'red' | 'slate', string> = {
  cyan: 'bg-cyan-400',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  red: 'bg-red-400',
  slate: 'bg-slate-500',
};

function intensityFromWave(h: number | null | undefined): number {
  if (h == null) return 0;
  return Math.max(0, Math.min(100, (h / 4) * 100));
}
function intensityFromSST(c: number | null | undefined): number {
  if (c == null) return 0;
  return Math.max(0, Math.min(100, (c / 35) * 100));
}
function intensityFromChl(mg: number | null | undefined): number {
  if (mg == null) return 0;
  return Math.max(0, Math.min(100, (mg / 10) * 100));
}
function intensityFromWind(kmh: number | null | undefined): number {
  if (kmh == null) return 0;
  return Math.max(0, Math.min(100, (kmh / 60) * 100));
}

interface VitalDef {
  key: 'sea_surface_temperature' | 'wave_height' | 'wind_speed' | 'swell_wave_height' | 'current_speed' | 'chlorophyll' | 'air_pressure' | 'visibility';
  label: string;
  unit: string;
  value: number | null | undefined;
  Icon: React.ComponentType<{ className?: string }>;
  tone: 'cyan' | 'emerald' | 'amber' | 'red' | 'slate';
  intensity: number;
  hint: string;
}

export const OceanVitals: React.FC<OceanVitalsProps> = ({ assessment }) => {
  const ocean: OceanState | undefined = assessment?.world_model?.ocean_state;
  const risk: RiskState | undefined = assessment?.world_model?.risk_state;
  const canonical = assessment?.canonical_records;

  const cards: VitalDef[] = useMemo(() => {
    if (!ocean) return [];
    return [
      {
        key: 'sea_surface_temperature',
        label: 'SST',
        unit: '°C',
        value: ocean.sst_c,
        Icon: Thermometer,
        tone: 'amber',
        intensity: intensityFromSST(ocean.sst_c),
        hint: canonical?.sea_surface_temperature?.source ?? 'Sea Surface Temp',
      },
      {
        key: 'wave_height',
        label: 'Wave',
        unit: 'm',
        value: ocean.wave_height_m,
        Icon: Waves,
        tone:
          ocean.wave_height_m != null && ocean.wave_height_m > 2.5
            ? 'red'
            : ocean.wave_height_m != null && ocean.wave_height_m > 1.2
              ? 'amber'
              : 'cyan',
        intensity: intensityFromWave(ocean.wave_height_m),
        hint: ocean.wave_period_s != null ? `${ocean.wave_period_s.toFixed(1)}s period · WW3` : 'Significant wave',
      },
      {
        key: 'wind_speed',
        label: 'Wind',
        unit: 'km/h',
        value: ocean.wind_speed_kmh,
        Icon: Wind,
        tone:
          ocean.wind_speed_kmh != null && ocean.wind_speed_kmh > 35
            ? 'red'
            : ocean.wind_speed_kmh != null && ocean.wind_speed_kmh > 20
              ? 'amber'
              : 'cyan',
        intensity: intensityFromWind(ocean.wind_speed_kmh),
        hint: ocean.wind_direction_cardinal
          ? `${ocean.wind_direction_cardinal} ${ocean.wind_direction_deg?.toFixed(0)}° · gusts ${ocean.wind_gust_kmh?.toFixed(0) ?? '—'}`
          : '10m wind',
      },
      {
        key: 'swell_wave_height',
        label: 'Swell',
        unit: 'm',
        value: ocean.swell_wave_height_m,
        Icon: Waves,
        tone: 'cyan',
        intensity: intensityFromWave(ocean.swell_wave_height_m),
        hint:
          ocean.swell_wave_period_s != null
            ? `${ocean.swell_wave_period_s.toFixed(1)}s · ${bearingToCompass(ocean.swell_wave_direction_deg ?? null)} ${ocean.swell_wave_direction_deg?.toFixed(0) ?? ''}°`
            : 'Swell',
      },
      {
        key: 'current_speed',
        label: 'Current',
        unit: 'm/s',
        value: ocean.current_speed_ms,
        Icon: Compass,
        tone: 'cyan',
        intensity: ocean.current_speed_ms != null ? Math.max(0, Math.min(100, (ocean.current_speed_ms / 1.5) * 100)) : 0,
        hint: ocean.current_dir_deg != null ? `${bearingToCompass(ocean.current_dir_deg)} · ROMS` : 'Surface current',
      },
      {
        key: 'chlorophyll',
        label: 'Chl-a',
        unit: 'mg/m³',
        value: ocean.chlorophyll_mg_m3,
        Icon: Droplets,
        tone: 'emerald',
        intensity: intensityFromChl(ocean.chlorophyll_mg_m3),
        hint: 'Productivity',
      },
      {
        key: 'air_pressure',
        label: 'Pressure',
        unit: 'hPa',
        value: ocean.air_pressure_hpa,
        Icon: Gauge,
        tone:
          ocean.air_pressure_hpa != null && ocean.air_pressure_hpa < 1000
            ? 'amber'
            : ocean.air_pressure_hpa != null && ocean.air_pressure_hpa > 1020
              ? 'emerald'
              : 'cyan',
        intensity: ocean.air_pressure_hpa != null ? Math.max(0, Math.min(100, ((ocean.air_pressure_hpa - 990) / 40) * 100)) : 0,
        hint: ocean.air_temperature_c != null ? `Air ${ocean.air_temperature_c.toFixed(0)}°C` : 'Surface pressure',
      },
      {
        key: 'visibility',
        label: 'Visibility',
        unit: 'km',
        value: ocean.visibility_km,
        Icon: Eye,
        tone:
          ocean.visibility_km != null && ocean.visibility_km < 4
            ? 'red'
            : ocean.visibility_km != null && ocean.visibility_km < 8
              ? 'amber'
              : 'emerald',
        intensity: ocean.visibility_km != null ? Math.max(0, Math.min(100, (ocean.visibility_km / 15) * 100)) : 0,
        hint: ocean.cloud_cover_pct != null ? `Cloud ${ocean.cloud_cover_pct.toFixed(0)}%` : 'Visibility',
      },
    ];
  }, [ocean, canonical]);

  if (!ocean || !risk) {
    return (
      <section className="glass rounded-2xl p-4 relative overflow-hidden">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">
          Live Ocean Vitals
        </h3>
        <p className="mt-3 text-xs text-ink-muted flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          Awaiting world-model telemetry.
        </p>
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
        {ocean.salinity_psu != null && (
          <span className="chip text-[9px]">{ocean.salinity_psu.toFixed(1)} PSU</span>
        )}
      </header>

      <div className="relative grid grid-cols-2 gap-2">
        {cards.map((v) => {
          const isMissing = v.value == null;
          const rec = canonical?.[v.key];
          return (
            <div
              key={v.label}
              className="rounded-lg border border-cyan-500/15 bg-ocean-1000/60 p-2.5 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-wider text-ink-muted font-bold">
                  {v.label}
                </span>
                <v.Icon
                  className={`w-3 h-3 ${isMissing ? 'text-ink-subtle' : 'text-cyan-300/80'}`}
                />
              </div>
              {isMissing ? (
                <div className="space-y-0.5">
                  <p className="text-base font-black text-ink-subtle leading-none">—</p>
                  <p className="text-[8.5px] uppercase tracking-wider text-amber-300/80 font-bold">
                    Data unavailable
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-white numeric leading-none">
                      {typeof v.value === 'number' ? v.value.toFixed(v.label === 'Wind' || v.label === 'Pressure' || v.label === 'Visibility' ? 0 : 2) : '—'}
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
                </>
              )}
              <p className="text-[8.5px] text-ink-muted leading-tight truncate">
                {isMissing ? 'No source returned a usable value' : v.hint}
              </p>
              {!isMissing && <ProvenanceBadge record={rec} compact />}
            </div>
          );
        })}
      </div>

      <div className="relative mt-3 grid grid-cols-4 gap-1.5 text-[10px]">
        <RiskChip
          label="IMBL"
          value={
            risk.dist_to_imbl_km != null ? formatKm(risk.dist_to_imbl_km) : '—'
          }
          tone={
            risk.dist_to_imbl_km != null && risk.dist_to_imbl_km < 20
              ? 'red'
              : risk.dist_to_imbl_km != null && risk.dist_to_imbl_km < 50
                ? 'amber'
                : 'cyan'
          }
        />
        <RiskChip
          label="Naval"
          value={
            risk.dist_to_naval_zone_km != null
              ? formatKm(risk.dist_to_naval_zone_km)
              : '—'
          }
          tone={risk.dist_to_naval_zone_km != null && risk.dist_to_naval_zone_km < 30 ? 'red' : 'cyan'}
        />
        <RiskChip
          label="Capsize"
          value={risk.capsizing_risk ? 'YES' : 'NO'}
          tone={risk.capsizing_risk ? 'red' : 'emerald'}
        />
        <RiskChip
          label="CPA"
          value={
            risk.collision_cpa_nm != null
              ? `${risk.collision_cpa_nm.toFixed(2)} NM`
              : '—'
          }
          tone={
            risk.collision_cpa_nm != null && risk.collision_cpa_nm < 0.5
              ? 'red'
              : risk.collision_cpa_nm != null && risk.collision_cpa_nm < 1.5
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