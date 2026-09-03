import React, { useMemo } from 'react';
import {
  AlertCircle,
  Compass,
  Droplets,
  Eye,
  Gauge,
  Waves,
  Wind,
} from 'lucide-react';
import { TripAssessmentResponse } from '../../types';

interface OceanVitalsProps {
  assessment: TripAssessmentResponse | null;
}

function intensityFromWave(m: number | null | undefined): number {
  if (m == null) return 0;
  return Math.max(0, Math.min(100, (m / 3.5) * 100));
}

function intensityFromWind(kmh: number | null | undefined): number {
  if (kmh == null) return 0;
  return Math.max(0, Math.min(100, (kmh / 50) * 100));
}

function intensityFromChl(chl: number | null | undefined): number {
  if (chl == null) return 0;
  return Math.max(0, Math.min(100, (chl / 4.0) * 100));
}

function bearingToCompass(deg: number | null | undefined): string {
  if (deg == null) return '—';
  const val = Math.floor((deg / 45) + 0.5);
  const arr = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return arr[val % 8];
}

export const OceanVitals: React.FC<OceanVitalsProps> = ({ assessment }) => {
  const ocean = assessment?.world_model?.ocean_state;
  const risk = assessment?.world_model?.risk_state;

  const cards = useMemo(() => {
    if (!ocean) return [];
    return [
      {
        key: 'wave_height',
        label: 'Wave Height',
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
          ? `${ocean.wind_direction_cardinal} ${ocean.wind_direction_deg != null ? ocean.wind_direction_deg.toFixed(0) : ''}° · gusts ${ocean.wind_gust_kmh != null ? ocean.wind_gust_kmh.toFixed(0) : '—'}`
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
            ? `${ocean.swell_wave_period_s.toFixed(1)}s · ${bearingToCompass(ocean.swell_wave_direction_deg ?? null)} ${ocean.swell_wave_direction_deg != null ? ocean.swell_wave_direction_deg.toFixed(0) : ''}°`
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
  }, [ocean]);

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
          <span className="chip text-[9px]">{(ocean.salinity_psu ?? 35).toFixed(1)} PSU</span>
        )}
      </header>

      <div className="relative grid grid-cols-2 gap-2">
        {cards.map((v) => {
          const Icon = v.Icon;
          return (
            <div
              key={v.key}
              className={`rounded-xl border p-2.5 space-y-1 ${
                v.tone === 'red'
                  ? 'border-red-500/30 bg-red-950/20'
                  : v.tone === 'amber'
                    ? 'border-amber-500/30 bg-amber-950/20'
                    : v.tone === 'emerald'
                      ? 'border-emerald-500/30 bg-emerald-950/20'
                      : 'border-cyan-500/20 bg-ocean-1000/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-wider text-ink-muted font-bold flex items-center gap-1">
                  <Icon className="w-3 h-3 text-cyan-300" />
                  {v.label}
                </span>
                <span className="text-[8px] text-ink-muted font-mono">{v.unit}</span>
              </div>
              <p className="text-base font-bold text-white numeric">
                {typeof v.value === 'number'
                  ? v.value.toFixed(
                      v.label === 'Wind' || v.label === 'Pressure' || v.label === 'Visibility'
                        ? 0
                        : 2,
                    )
                  : '—'}
              </p>
              <div className="h-1 rounded-full bg-ocean-800 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    v.tone === 'red'
                      ? 'bg-red-400'
                      : v.tone === 'amber'
                        ? 'bg-amber-400'
                        : v.tone === 'emerald'
                          ? 'bg-emerald-400'
                          : 'bg-cyan-400'
                  }`}
                  style={{ width: `${v.intensity}%` }}
                />
              </div>
              <p className="text-[8.5px] text-ink-muted truncate">{v.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="relative mt-3 pt-2.5 border-t border-cyan-500/10 grid grid-cols-4 gap-1.5 text-center">
        <RiskChip
          label="IMBL"
          value={
            risk.dist_to_imbl_km != null
              ? `${Math.round(risk.dist_to_imbl_km)}km`
              : '—'
          }
          tone={risk.dist_to_imbl_km != null && risk.dist_to_imbl_km < 15 ? 'red' : 'cyan'}
        />
        <RiskChip
          label="Naval"
          value={
            risk.dist_to_naval_zone_km != null
              ? `${Math.round(risk.dist_to_naval_zone_km)}km`
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