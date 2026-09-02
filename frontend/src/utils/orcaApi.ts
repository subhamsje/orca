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

async function request<T>(input: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${input}`, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`ORCA API ${input} failed:`, err);
    return null;
  }
}

export const orcaApi = {
  sarDrift: (body: { last_known_lat: number; last_known_lon: number; drift_hours: number }) =>
    request<SARDriftResponse>('/api/v1/sar-drift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  applySighting: (body: { sighting_lat: number; sighting_lon: number; confidence: number }) =>
    request<SightingUpdateResponse>('/api/v1/sar-sighting-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  anomalies: () => request<AnomaliesResponse>('/api/v1/authority/anomalies'),
  governanceOverride: (body: { user_id: string; role: string; reason: string; override_action: string }) =>
    request<unknown>('/api/v1/governance/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  osintSummary: () => request<OsintSummaryResponse>('/api/v1/osint/summary'),
  satellitePasses: () => request<SatellitePassesResponse>('/api/v1/satellite/passes'),
  parseNmea: (sentence: string) =>
    request<NmeaParsedResponse>('/api/v1/hardware/nmea', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence }),
    }),
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
    request<CpaResponse>('/api/v1/collision/cpa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  engineMetrics: (body: {
    distance_km: number;
    vessel_speed_knots: number;
    engine_hp: number;
    headwind_kmh: number;
    wave_height_m: number;
  }) =>
    request<EngineMetricsResponse>('/api/v1/engine/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
};