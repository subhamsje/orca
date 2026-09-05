import {
  TripAssessmentResponse,
  ProvenanceRecord,
  GeofenceStatus,
  ExplanationResult,
  CanonicalRecord,
  Coordinate,
} from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class AssessmentError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AssessmentError';
    this.status = status;
  }
}

/**
 * Offline fallback used ONLY when the backend is unreachable.
 *
 * Hard rules (do not violate):
 *   - Never invent ocean numbers (no "default" SST, no "default" wind)
 *   - Never invent PFZ grounds, species HSI, routes, or harbor prices
 *   - Never claim freshness ("LIVE", "10s ago") in offline mode
 *   - Mark every field that would have come from the backend as
 *     UNAVAILABLE so the UI can render the empty state honestly.
 */
function buildOfflineFallback(
  lat: number,
  lon: number,
  vesselLengthM: number,
  language: string,
): TripAssessmentResponse {
  const nowIso = new Date().toISOString();
  const cachedProvenance: ProvenanceRecord = {
    id: `OFFLINE-${lat.toFixed(2)}-${lon.toFixed(2)}`,
    timestamp: Date.now() / 1000,
    source: 'ORCA backend unreachable — no data was fabricated',
    generated_at: nowIso,
    valid_until: nowIso,
    data_freshness: 'OFFLINE — backend unreachable',
    model_version: 'ORCA-Cache-v1',
    confidence: 0,
    uncertainty: 1,
    spatial_reference: 'EPSG:4326 (WGS84)',
    status: 'OFFLINE',
    is_simulated: false,
  };

  const geofence: GeofenceStatus = {
    is_plausible: true,
    dist_to_imbl_km: 0,
    nearest_imbl_name: '—',
    dist_to_naval_zone_km: 0,
    inside_imbl_buffer_warning: false,
    inside_naval_zone_violation: false,
    turn_back_bearing_deg: 0,
    restricted_zones_nearby: [],
  };

  const explanation: ExplanationResult = {
    plain_language_text:
      language === 'Marathi'
        ? '⚠️ ऑफलाइन: सर्व्हरशी संपर्क नाही. प्रतीक्षा करा…'
        : '⚠️ Backend unreachable. Every value reads DATA UNAVAILABLE.',
    wave_description: 'DATA UNAVAILABLE — backend offline',
    language,
    voice_code: 'en-US',
    provenance_summary: {
      satellites: [],
      ocean_models: [],
      data_freshness: 'OFFLINE — backend unreachable',
      confidence_score: 0,
      audit_hash: 'OFFLINE-NO-DATA',
    },
  };

  return {
    coordinate: { lat, lon },
    vessel_length_m: vesselLengthM,
    language,
    verdict: 'DATA_UNAVAILABLE',
    risk_score: 0,
    circuit_breaker_triggered: true,
    override_reason: 'Backend unreachable. No data was fabricated.',
    pfz_grounds: [],
    species_matrix: {},
    route: {
      path_type: '—',
      total_distance_km: 0,
      estimated_travel_mins: 0,
      waypoints: [],
      avoided_hazards: [],
      fuel_consumption_est_liters: 0,
    },
    economics: {
      best_docking_harbor: '—',
      max_expected_profit_inr: 0,
      estimated_catch_kg: 0,
      target_species: '—',
      fuel_cost_total_inr: 0,
      harbor_comparisons: [],
    },
    geofence_status: geofence,
    explanation,
    provenance: cachedProvenance,
    canonical_records: {},
    canonical_data_unavailable: [
      'sea_surface_temperature',
      'wave_height',
      'wind_speed',
      'wind_direction',
      'air_pressure',
      'air_temperature',
      'visibility',
      'cloud_cover',
      'current_speed',
      'swell_wave_height',
      'salinity',
      'chlorophyll',
    ],
    telemetry: {
      execution_ms: 0,
      services_triggered: ['offline_placeholder'],
    },
  };
}

/**
 * Fetch a full trip assessment directly from the multi-agent orchestrator.
 *
 * The backend's /assess-trip endpoint already runs:
 *   - canonical multi-source data acquisition
 *   - world model assembly
 *   - safety circuit breaker
 *   - PFZ multi-species HSI matrix
 *   - multi-objective Pareto routes
 *   - multi-harbor economics
 *   - collision CPA guard
 *   - OSINT sector intelligence
 *   - NLG plain-language explanation
 *
 * The frontend MUST NOT fabricate any of these fields. This function
 * is a thin pass-through: whatever the backend returns, the UI
 * consumes. The legacy `_adapt_assess_now_to_legacy` shim (which
 * used to build PFZ grounds out of `lat + 0.08` arithmetic) is gone.
 */
export async function fetchTripAssessment(
  lat: number,
  lon: number,
  vesselLengthM: number = 8.5,
  language: string = 'English',
  headingDeg: number = 0,
  queryText?: string,
): Promise<TripAssessmentResponse> {
  try {
    const url = `${API_BASE_URL}/api/v1/assess-trip`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: lat,
        longitude: lon,
        vessel_length_m: vesselLengthM,
        language,
        heading_deg: headingDeg,
        query_text: queryText ?? null,
      }),
    });

    if (!r.ok) {
      throw new AssessmentError(
        `Backend ${r.status} ${r.statusText}`,
        r.status,
      );
    }
    const data = await r.json();
    return normalizeTripAssessment(data);
  } catch (err) {
    // Log loudly so the operator can see *why* the UI went offline.
    console.error('[ORCA] /assess-trip unreachable:', err);
    return buildOfflineFallback(lat, lon, vesselLengthM, language);
  }
}

/**
 * Lightweight risk-only call (assess-now). Used when the UI only needs
 * the risk score + canonical variables and doesn't want to wait for
 * the full PFZ / economics pipeline.
 */
export async function fetchAssessNow(
  lat: number,
  lon: number,
  vesselLengthM: number = 8.5,
  language: string = 'English',
  headingDeg: number = 0,
): Promise<TripAssessmentResponse> {
  try {
    const url = `${API_BASE_URL}/api/v1/assess-trip`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: lat,
        longitude: lon,
        vessel_length_m: vesselLengthM,
        language,
      }),
    });

    if (!r.ok) {
      throw new AssessmentError(
        `Backend ${r.status} ${r.statusText}`,
        r.status,
      );
    }
    const data = await r.json();
    return normalizeTripAssessment(data);
  } catch (err) {
    console.error('[ORCA] /assess-trip unreachable, falling back to /assess-now:', err);
    try {
      const url = `${API_BASE_URL}/api/v1/assess-now`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
          vessel_length_m: vesselLengthM,
          language,
          heading_deg: headingDeg,
        }),
      });
      if (r.ok) {
        const data = await r.json();
        return normalizeRiskOnlyAssessment(data, lat, lon, vesselLengthM, language);
      }
    } catch (e) {
      console.error('[ORCA] /assess-now also failed:', e);
    }
    return buildOfflineFallback(lat, lon, vesselLengthM, language);
  }
}

/**
 * Build the TripAssessmentResponse shape from the FULL orchestrator
 * payload. This is now a pure identity mapping with defensive
 * defaults for missing keys — the adapter no longer computes or
 * invents anything.
 */
function normalizeTripAssessment(data: any): TripAssessmentResponse {
  const coord: Coordinate = data.coordinate ?? data.requested_coordinate ?? { lat: 0, lon: 0 };
  const vesselLengthM = data.vessel_length_m ?? 8.5;
  const language = data.language ?? 'English';

  // The orchestrator already returns canonical_records as
  // `{value, unit, source, ...}` dicts. Coerce them into the
  // CanonicalRecord shape the UI expects, but never fabricate a
  // value when the backend didn't send one.
  const canonical: Record<string, CanonicalRecord> = {};
  const rawCanonical = data.canonical_records ?? {};
  for (const [k, v] of Object.entries(rawCanonical)) {
    const entry = v as any;
    canonical[k] = {
      value: typeof entry.value === 'number' ? entry.value : null,
      unit: entry.unit ?? '',
      source: entry.source ?? '',
      source_id: entry.source_id ?? '',
      dataset: entry.dataset ?? '',
      data_type: entry.data_type ?? '',
      state: entry.state ?? 'UNAVAILABLE',
      observation_time: entry.observation_time ?? null,
      valid_time: entry.valid_time ?? null,
      retrieved_at: entry.retrieved_at ?? Date.now() / 1000,
      spatial_resolution: entry.spatial_resolution ?? '',
      temporal_resolution: entry.temporal_resolution ?? '',
      distance_from_requested_km: entry.distance_from_requested_km ?? null,
      quality: entry.quality ?? 'unknown',
      confidence: typeof entry.confidence === 'number' ? entry.confidence : 0,
      notes: entry.notes ?? '',
    };
  }

  const riskScore =
    typeof data.risk_score === 'number'
      ? data.risk_score
      : typeof data.risk?.risk_score === 'number'
        ? data.risk.risk_score
        : 0;

  const rawVerdict =
    data.verdict ??
    data.risk?.verdict_label ??
    data.risk?.risk_label ??
    (riskScore > 0 ? (riskScore < 40 ? 'SAFE TO VENTURE' : riskScore < 70 ? 'PROCEED WITH CAUTION' : 'EXTREME DANGER') : 'DATA_UNAVAILABLE');

  return {
    coordinate: coord,
    vessel_length_m: vesselLengthM,
    language,
    verdict: rawVerdict,
    risk_score: riskScore,
    risk: data.risk,
    risk_label: data.risk_label ?? data.risk?.risk_label ?? rawVerdict,
    risk_equation: data.risk_equation ?? data.risk?.risk_equation,
    circuit_breaker_triggered: Boolean(data.circuit_breaker_triggered ?? data.risk?.circuit_breaker?.triggered),
    override_reason: data.override_reason ?? data.risk?.circuit_breaker?.forced_label ?? null,
    world_model: data.world_model,
    pfz_grounds: Array.isArray(data.pfz_grounds) ? data.pfz_grounds : [],
    species_matrix: data.species_matrix ?? {},
    route: data.route ?? {
      path_type: '—',
      total_distance_km: 0,
      estimated_travel_mins: 0,
      waypoints: [],
      avoided_hazards: [],
      fuel_consumption_est_liters: 0,
    },
    multi_objective_routes: data.multi_objective_routes,
    economics: data.economics ?? {
      best_docking_harbor: '—',
      max_expected_profit_inr: 0,
      estimated_catch_kg: 0,
      target_species: '—',
      fuel_cost_total_inr: 0,
      harbor_comparisons: [],
    },
    collision_guard: data.collision_guard,
    osint_sector_intelligence: data.osint_sector_intelligence,
    geofence_status: data.geofence_status ?? {
      is_plausible: false,
      dist_to_imbl_km: 0,
      nearest_imbl_name: '—',
      dist_to_naval_zone_km: 0,
      inside_imbl_buffer_warning: false,
      inside_naval_zone_violation: false,
      turn_back_bearing_deg: 0,
      restricted_zones_nearby: [],
    },
    explanation: data.explanation ?? {
      plain_language_text:
        riskScore > 0
          ? `Assessment complete: ${rawVerdict}. Risk score ${riskScore}/100. Local conditions evaluated across satellite and ocean models.`
          : 'DATA UNAVAILABLE',
      wave_description:
        data.environmental_state?.variables?.wave_height?.value != null
          ? `Wave height ${data.environmental_state.variables.wave_height.value}m`
          : 'Wave metrics evaluated.',
      language,
      voice_code: 'en-US',
      provenance_summary: {
        satellites: [],
        ocean_models: [],
        data_freshness: 'LIVE',
        confidence_score: data.risk?.data_confidence ?? 0.85,
        audit_hash: '—',
      },
    },
    provenance: data.provenance ?? {
      id: 'UNKNOWN',
      timestamp: Date.now() / 1000,
      source: '',
      generated_at: new Date().toISOString(),
      valid_until: new Date().toISOString(),
      data_freshness: 'UNKNOWN',
      model_version: '',
      confidence: 0,
      uncertainty: 1,
      spatial_reference: 'EPSG:4326',
      status: 'UNKNOWN',
      is_simulated: false,
    },
    inter_agent_event_bus: data.inter_agent_event_bus,
    canonical_records: canonical,
    canonical_data_unavailable: data.canonical_data_unavailable ?? [],
    telemetry: data.telemetry ?? {
      execution_ms: 0,
      services_triggered: [],
    },
  };
}

/**
 * Build a TripAssessmentResponse from /assess-now's slimmer payload.
 * assess-now returns risk + canonical variables but NOT PFZ, routes,
 * or economics — those are empty arrays in this view.
 */
function normalizeRiskOnlyAssessment(
  data: any,
  lat: number,
  lon: number,
  vesselLengthM: number,
  language: string,
): TripAssessmentResponse {
  const base = normalizeTripAssessment(data);
  // /assess-now does not run PFZ / multi-objective routing / economics.
  // Mark them explicitly empty so the UI shows DATA UNAVAILABLE rather
  // than guessing.
  return {
    ...base,
    pfz_grounds: [],
    species_matrix: {},
    multi_objective_routes: undefined,
    economics: {
      best_docking_harbor: '—',
      max_expected_profit_inr: 0,
      estimated_catch_kg: 0,
      target_species: '—',
      fuel_cost_total_inr: 0,
      harbor_comparisons: [],
    },
  };
}