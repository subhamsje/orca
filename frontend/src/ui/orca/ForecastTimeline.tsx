import React, { useEffect, useState } from 'react';
import { CloudRain, Compass, Droplets, Gauge, Thermometer, Wind } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';

interface ForecastPoint {
  time: string;
  wind_kmh: number | null;
  gust_kmh: number | null;
  wind_dir_deg: number | null;
  temp_c: number | null;
  cloud_pct: number | null;
  pressure_hpa: number | null;
  vis_km: number | null;
  wave_m: number | null;
  wave_period_s: number | null;
  swell_m: number | null;
  sst_c: number | null;
}

interface ForecastTimelineProps {
  lat: number;
  lon: number;
  hours?: number;
}

function cardinal(deg: number | null): string {
  if (deg == null) return '—';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(((deg % 360) / 22.5)) % 16];
}

function fmtTime(iso: string): string {
  // 2026-09-03T00:00 → 00:00
  return iso.slice(11, 16);
}

function fmtHour(iso: string): string {
  // 2026-09-03T00:00 → Wed 03 00
  const d = new Date(iso);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[d.getDay()]} ${String(d.getDate()).padStart(2, '0')} ${fmtTime(iso)}`;
}

export const ForecastTimeline: React.FC<ForecastTimelineProps> = ({
  lat,
  lon,
  hours = 24,
}) => {
  const [points, setPoints] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>('Open-Meteo');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/api/v1/forecast/hourly?lat=${lat}&lon=${lon}&hours=${hours}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        setPoints(d.forecast ?? []);
        setSource(d.source ?? 'Open-Meteo');
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lon, hours]);

  if (loading) {
    return (
      <section className="glass rounded-2xl p-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-2">
          <Gauge className="w-3.5 h-3.5" /> Hourly Forecast
        </h3>
        <p className="mt-3 text-xs text-ink-muted">Loading {hours}h live forecast…</p>
      </section>
    );
  }

  if (error || !points.length) {
    return (
      <section className="glass rounded-2xl p-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-2">
          <Gauge className="w-3.5 h-3.5" /> Hourly Forecast
        </h3>
        <p className="mt-3 text-xs text-amber-300">Forecast unavailable: {error ?? 'no data'}</p>
      </section>
    );
  }

  const maxWave = Math.max(...points.map((p) => p.wave_m ?? 0), 1);
  const maxWind = Math.max(...points.map((p) => p.wind_kmh ?? 0), 1);

  return (
    <section className="glass rounded-2xl p-4 relative overflow-hidden">
      <div className="absolute inset-0 tactical-grid-fine opacity-20 pointer-events-none" />
      <header className="relative flex items-center justify-between gap-2 mb-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300 flex items-center gap-2">
          <Gauge className="w-3.5 h-3.5" /> Hourly Forecast · next {points.length}h
        </h3>
        <span className="chip chip-cyan text-[9px] truncate max-w-[8rem]">{source}</span>
      </header>

      <div className="relative overflow-x-auto -mx-1 pb-1">
        <div className="flex gap-1 min-w-max">
          {points.map((p, idx) => {
            const wave = p.wave_m ?? 0;
            const wind = p.wind_kmh ?? 0;
            return (
              <div
                key={`${p.time}-${idx}`}
                className="flex-shrink-0 w-[5.25rem] rounded-lg border border-cyan-500/15 bg-ocean-1000/60 p-2 space-y-1"
              >
                <p className="text-[9px] font-bold text-cyan-300 uppercase tracking-wider truncate">
                  {idx === 0 ? 'Now' : fmtTime(p.time)}
                </p>
                <p className="text-[8px] text-ink-muted truncate">
                  {idx === 0 ? new Date(p.time).toLocaleDateString() : fmtHour(p.time).slice(0, 6)}
                </p>
                <div className="h-1.5 rounded-full bg-ocean-800 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      wind > 35
                        ? 'bg-red-400'
                        : wind > 20
                          ? 'bg-amber-400'
                          : 'bg-cyan-400'
                    }`}
                    style={{ width: `${(wind / maxWind) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 text-[10px] text-white numeric">
                  <Wind className="w-3 h-3 text-cyan-300" />
                  <span>{wind.toFixed(0)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-ocean-800 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      wave > 2.5
                        ? 'bg-red-400'
                        : wave > 1.2
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                    }`}
                    style={{ width: `${(wave / maxWave) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 text-[10px] text-white numeric">
                  <Droplets className="w-3 h-3 text-cyan-300" />
                  <span>{wave.toFixed(2)}m</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-ink-muted">
                  <Compass className="w-2.5 h-2.5" />
                  {cardinal(p.wind_dir_deg)}
                </div>
                {p.temp_c != null && (
                  <div className="flex items-center gap-1 text-[9px] text-ink-muted">
                    <Thermometer className="w-2.5 h-2.5" />
                    {p.temp_c.toFixed(0)}°C
                  </div>
                )}
                {p.cloud_pct != null && (
                  <div className="flex items-center gap-1 text-[9px] text-ink-muted">
                    <CloudRain className="w-2.5 h-2.5" />
                    {p.cloud_pct.toFixed(0)}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};