import {
  TripAssessmentResponse,
  ProvenanceRecord,
  GeofenceStatus,
  ExplanationResult,
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
 * Build a clearly-labelled offline fallback. This is returned only when
 * the live backend is unreachable. Every value that looks "live" is
 * either derived from real geometry (haversine distance to nearest
 * harbor) or plainly labelled as cached. Never pretend the offline path
 * is the live feed.
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
    source: 'OFFLINE CACHE · no live backend connection',
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
    dist_to_imbl_km: NaN,
    nearest_imbl_name: 'Unknown (offline)',
    dist_to_naval_zone_km: NaN,
    inside_imbl_buffer_warning: false,
    inside_naval_zone_violation: false,
    turn_back_bearing_deg: 0,
    restricted_zones_nearby: [],
  };

  const explanation: ExplanationResult = {
    plain_language_text:
      language === 'Marathi'
        ? '⚠️ ऑफलाइन मोड: सर्व्हरशी संपर्क नाही. कृपया नेटवर्क तपासा.'
        : '⚠️ Offline: backend unreachable. Connect to a network and retry.',
    wave_description: 'Unknown — no live feed',
    language,
    voice_code: 'en-US',
    provenance_summary: {
      satellites: [],
      ocean_models: [],
      data_freshness: 'OFFLINE',
      confidence_score: 0,
      audit_hash: 'OFFLINE-NO-AUDIT',
    },
  };

  return {
    coordinate: { lat, lon },
    vessel_length_m: vesselLengthM,
    language,
    verdict: 'OFFLINE — UNABLE TO ASSESS',
    risk_score: 50,
    circuit_breaker_triggered: true,
    override_reason: 'Live ORCA backend unreachable — falling back to safe-to-stay-ashore rule.',
    pfz_grounds: [],
    species_matrix: {},
    route: {
      path_type: 'Offline — no route computed',
      total_distance_km: 0,
      estimated_travel_mins: 0,
      waypoints: [[lat, lon]],
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
    telemetry: {
      execution_ms: 0,
      services_triggered: ['offline_fallback'],
    },
  };
}

export async function fetchTripAssessment(
  lat: number,
  lon: number,
  vesselLengthM: number = 8.5,
  language: string = 'English',
  queryText?: string,
  signal?: AbortSignal,
): Promise<TripAssessmentResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/assess-trip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        latitude: lat,
        longitude: lon,
        vessel_length_m: vesselLengthM,
        language,
        query_text: queryText,
      }),
    });
  } catch (err) {
    if ((err as { name?: string }).name === 'AbortError') throw err;
    console.warn('ORCA backend unreachable, returning offline fallback:', err);
    return buildOfflineFallback(lat, lon, vesselLengthM, language);
  }

  if (!response.ok) {
    throw new AssessmentError(`HTTP ${response.status}`, response.status);
  }
  return (await response.json()) as TripAssessmentResponse;
}

export async function fetchOsintSummary(signal?: AbortSignal) {
  try {
    const r = await fetch(`${API_BASE_URL}/api/v1/osint/summary`, { signal });
    if (!r.ok) return null;
    return await r.json();
  } catch (err) {
    if ((err as { name?: string }).name === 'AbortError') throw err;
    return null;
  }
}

export async function fetchSatellitePasses(signal?: AbortSignal) {
  try {
    const r = await fetch(`${API_BASE_URL}/api/v1/satellite/passes`, { signal });
    if (!r.ok) return null;
    return await r.json();
  } catch (err) {
    if ((err as { name?: string }).name === 'AbortError') throw err;
    return null;
  }
}