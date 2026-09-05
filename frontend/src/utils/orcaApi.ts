import { API_BASE_URL } from './api';

export interface SARDriftResponse {
  last_known_coordinate: [number, number];
  drift_centroid: [number, number];
  prioritized_search_radius_km: number;
}

export interface SightingUpdateResponse {
  updated_drift_centroid: [number, number];
  updated_search_radius_km: number;
}

export interface DarkFleetAnomaly {
  anomaly_id: string;
  coordinate: [number, number];
  radar_cross_section_m2: number;
  confidence: number;
}

export interface AnomaliesResponse {
  anomalies: DarkFleetAnomaly[];
}

export interface OsintAdvisory {
  type: string;
  description: string;
  severity: string;
  source: string;
}

export interface OsintMarketPort {
  Surmai: number;
  Bangda: number;
  updated_at: string;
}

export interface OsintSummaryResponse {
  advisories?: OsintAdvisory[];
  market_intelligence?: Record<string, OsintMarketPort>;
}

export interface SatellitePass {
  satellite: string;
  orbit_type: string;
  next_pass_in_minutes: number;
  sensor: string;
}

export interface SatellitePassesResponse {
  upcoming_overpasses: SatellitePass[];
}

export interface NmeaParsedResponse {
  checksum_valid: boolean;
  parsed_data: Record<string, unknown>;
}

export interface CpaResponse {
  initial_range_nm: number;
  cpa_nautical_miles: number;
  tcpa_minutes: number;
  recommended_action: string;
}

export interface EngineMetricsResponse {
  fuel_rate_liters_per_hour: number;
  total_fuel_consumed_liters: number;
  propeller_slip_pct: number;
  effective_load_factor_pct: number;
}

/**
 * Tagged result so callers can distinguish "loaded stale" from "live"
 * and from "actually failed". `fetchedAt` is always set so the UI
 * can render honest freshness (no more fake "10s ago" stamps when
 * the cache is 6 hours old).
 */
export type OrcaApiResult<T> =
  | { ok: true; data: T; fetchedAt: number; source: string }
  | { ok: false; error: string; status?: number; fetchedAt: number };

/**
 * Single source of truth for talking to the ORCA backend.
 *
 * Rules:
 *   - One retry on transient network failure (5xx, network error).
 *   - 4xx is NOT retried — caller asked wrong question.
 *   - Every success is timestamped so the UI can show
 *     "fetched 4s ago" without lying.
 *   - Every failure is returned (not null) so the UI can show
 *     DATA UNAVAILABLE / REFRESH instead of stale cached data.
 *   - `bypassCache` controls the no-cache query param so callers
 *     that genuinely want a fresh read can opt in.
 */
async function request<T>(
  input: string,
  init?: RequestInit,
  opts: { bypassCache?: boolean; label?: string } = {},
): Promise<OrcaApiResult<T>> {
  const label = opts.label ?? input;
  const url = new URL(`${API_BASE_URL}${input}`);
  if (opts.bypassCache) url.searchParams.set('_t', String(Date.now()));

  const tryOnce = async (): Promise<OrcaApiResult<T>> => {
    try {
      const res = await fetch(url.toString(), init);
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        return {
          ok: false,
          error: `${label} → HTTP ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 160)}` : ''}`,
          status: res.status,
          fetchedAt: Date.now(),
        };
      }
      const data = (await res.json()) as T;
      return { ok: true, data, fetchedAt: Date.now(), source: url.toString() };
    } catch (err) {
      return {
        ok: false,
        error: `${label} → network error: ${(err as Error).message}`,
        fetchedAt: Date.now(),
      };
    }
  };

  const first = await tryOnce();
  // Retry once on 5xx or network error (not on 4xx — caller bug).
  if (!first.ok && (first.status === undefined || (first.status ?? 0) >= 500)) {
    const second = await tryOnce();
    return second;
  }
  return first;
}

export const orcaApi = {
  sarDrift: (body: { last_known_lat: number; last_known_lon: number; drift_hours: number }) =>
    request<SARDriftResponse>(
      '/api/v1/sar-drift',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      { label: 'sar-drift' },
    ),

  applySighting: (body: { sighting_lat: number; sighting_lon: number; confidence: number }) =>
    request<SightingUpdateResponse>(
      '/api/v1/sar-sighting-update',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      { label: 'sar-sighting-update' },
    ),

  anomalies: (bypassCache = false) =>
    request<AnomaliesResponse>(
      '/api/v1/authority/anomalies',
      undefined,
      { label: 'authority/anomalies', bypassCache },
    ),

  governanceOverride: (body: { user_id: string; role: string; reason: string; override_action: string }) =>
    request<unknown>(
      '/api/v1/governance/override',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      { label: 'governance/override' },
    ),

  osintSummary: (bypassCache = false) =>
    request<OsintSummaryResponse>(
      '/api/v1/osint/summary',
      undefined,
      { label: 'osint/summary', bypassCache },
    ),

  satellitePasses: (bypassCache = false) =>
    request<SatellitePassesResponse>(
      '/api/v1/satellite/passes',
      undefined,
      { label: 'satellite/passes', bypassCache },
    ),

  parseNmea: (sentence: string) =>
    request<NmeaParsedResponse>(
      '/api/v1/hardware/nmea',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence }),
      },
      { label: 'hardware/nmea' },
    ),

  cpa: (body: {
    own_lat: number;
    own_lon: number;
    own_speed_knots: number;
    own_cog_deg: number;
    target_lat: number;
    target_lon: number;
    target_speed_knots: number;
    target_cog_deg: number;
  }) =>
    request<CpaResponse>(
      '/api/v1/collision/cpa',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      { label: 'collision/cpa' },
    ),

  engineMetrics: (body: {
    distance_km: number;
    vessel_speed_knots: number;
    engine_hp: number;
    headwind_kmh: number;
    wave_height_m: number;
  }) =>
    request<EngineMetricsResponse>(
      '/api/v1/engine/metrics',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      { label: 'engine/metrics' },
    ),

  harborPrices: (bypassCache = false) =>
    request<unknown>(
      '/api/v1/harbor-prices',
      undefined,
      { label: 'harbor-prices', bypassCache },
    ),
};

/**
 * Helper: format "fetched Xs ago" honestly. Always uses the
 * `fetchedAt` timestamp from the request — never invents a value.
 */
export function freshnessAgo(fetchedAt: number, now: number = Date.now()): string {
  const deltaMs = now - fetchedAt;
  if (deltaMs < 0) return 'just now';
  const sec = Math.floor(deltaMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}