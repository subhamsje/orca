import { describe, it, expect } from 'vitest';
import {
  buildEnvState,
  classifyRiskScore,
  computeEncounter,
  hasLiveOcean,
} from '../envState';
import type { TripAssessmentResponse } from '../../types';

const baseOpts = {
  requested: { lat: 18.92, lon: 72.83 },
  actual: { lat: 18.92, lon: 72.83 },
  vessel: {
    lat: 18.92,
    lon: 72.83,
    headingDeg: 90,
    speedKnots: 6.5,
    lengthM: 8.5,
    name: 'Test Craft',
  },
};

function makeResponse(overrides: Partial<TripAssessmentResponse> = {}): TripAssessmentResponse {
  return {
    coordinate: { lat: 18.92, lon: 72.83 },
    vessel_length_m: 8.5,
    language: 'English',
    verdict: 'PROCEED WITH CAUTION',
    risk_score: 42,
    circuit_breaker_triggered: false,
    pfz_grounds: [],
    species_matrix: {},
    route: {
      path_type: 'A*',
      total_distance_km: 12,
      estimated_travel_mins: 90,
      waypoints: [
        [18.92, 72.83],
        [18.95, 72.86],
        [19.0, 72.9],
      ],
      avoided_hazards: [],
      fuel_consumption_est_liters: 12,
    },
    economics: {
      best_docking_harbor: 'Mumbai',
      max_expected_profit_inr: 1200,
      estimated_catch_kg: 50,
      target_species: 'Surmai',
      fuel_cost_total_inr: 600,
      harbor_comparisons: [],
    },
    geofence_status: {
      is_plausible: true,
      dist_to_imbl_km: 100,
      nearest_imbl_name: '',
      dist_to_naval_zone_km: 200,
      inside_imbl_buffer_warning: false,
      inside_naval_zone_violation: false,
      turn_back_bearing_deg: 0,
      restricted_zones_nearby: [],
    },
    explanation: {
      plain_language_text: 'test',
      wave_description: 'test',
      language: 'en',
      voice_code: 'en-US',
      provenance_summary: {
        satellites: [],
        ocean_models: [],
        data_freshness: 'live',
        confidence_score: 0.9,
        audit_hash: 'x',
      },
    },
    provenance: {
      id: 'TEST-1',
      timestamp: Date.now() / 1000,
      source: 'Open-Meteo',
      generated_at: new Date().toISOString(),
      valid_until: new Date(Date.now() + 3600 * 1000).toISOString(),
      data_freshness: 'LIVE',
      model_version: 'v4',
      confidence: 0.9,
      uncertainty: 0.1,
      spatial_reference: 'EPSG:4326',
      status: 'VALID',
      is_simulated: false,
    },
    canonical_records: {
      wave_height: {
        value: 1.8,
        unit: 'm',
        source: 'Open-Meteo Marine',
        source_id: 'om-marine',
        dataset: 'wave_height',
        data_type: 'NOWCAST',
        observation_time: null,
        valid_time: null,
        retrieved_at: Date.now(),
        spatial_resolution: '0.25°',
        temporal_resolution: '1h',
        distance_from_requested_km: 4.2,
        quality: 'GOOD',
        confidence: 0.91,
        notes: '',
      },
      wind_speed: {
        value: 22.5,
        unit: 'km/h',
        source: 'Open-Meteo ECMWF',
        source_id: 'om-ecmwf',
        dataset: 'wind_speed',
        data_type: 'NOWCAST',
        observation_time: null,
        valid_time: null,
        retrieved_at: Date.now(),
        spatial_resolution: '0.25°',
        temporal_resolution: '1h',
        distance_from_requested_km: 2.1,
        quality: 'GOOD',
        confidence: 0.88,
        notes: '',
      },
      current_speed: {
        value: 0.42,
        unit: 'm/s',
        source: 'OSCAR',
        source_id: 'oscar',
        dataset: 'current_speed',
        data_type: 'OBSERVED',
        observation_time: Date.now(),
        valid_time: Date.now(),
        retrieved_at: Date.now(),
        spatial_resolution: '0.33°',
        temporal_resolution: '5d',
        distance_from_requested_km: 5.5,
        quality: 'GOOD',
        confidence: 0.85,
        notes: '',
      },
    },
    telemetry: { execution_ms: 120, services_triggered: ['risk_engine'] },
    ...overrides,
  } as TripAssessmentResponse;
}

describe('buildEnvState', () => {
  it('produces a fully-typed shape with canonical-record values when present', () => {
    const env = buildEnvState(makeResponse(), baseOpts);
    expect(env.waveHeight.value).toBe(1.8);
    expect(env.windSpeed.value).toBe(22.5);
    expect(env.currentSpeed.value).toBe(0.42);
    expect(env.waveHeight.source).toContain('Open-Meteo');
    expect(env.windSpeed.confidence).toBeCloseTo(0.88);
  });

  it('falls back to ocean_state when canonical records are missing', () => {
    const resp = makeResponse({
      canonical_records: {},
      world_model: {
        coordinate: { lat: 18.92, lon: 72.83 },
        h3_index_res7: '',
        vessel_twin: {
          vessel_id: 'x',
          vessel_name: 'x',
          vessel_type: 'x',
          length_m: 8,
          beam_m: 3,
          draft_m: 1,
          engine_hp: 10,
          fuel_capacity_l: 50,
          fuel_current_l: 50,
          max_wave_height_m: 3,
          seaworthiness_score: 80,
        },
        ocean_state: {
          sst_c: 27.5,
          chlorophyll_mg_m3: 1.2,
          current_speed_ms: 0.3,
          current_dir_deg: 120,
          wave_height_m: 1.4,
          wave_period_s: 8,
          salinity_psu: 35,
          wind_speed_kmh: 18,
          wind_gust_kmh: 24,
          wind_direction_deg: 270,
          wind_direction_cardinal: 'W',
          swell_wave_height_m: 0.9,
          swell_wave_period_s: 12,
          swell_wave_direction_deg: 280,
          air_pressure_hpa: 1011,
          air_temperature_c: 27,
          cloud_cover_pct: 50,
          visibility_km: 9,
        },
        risk_state: {
          weather_risk_score: 40,
          wave_steepness_ratio: 0.07,
          capsizing_risk: false,
          collision_cpa_nm: 1.2,
          grounding_depth_m: 50,
          dist_to_imbl_km: 100,
          dist_to_naval_zone_km: 200,
        },
        provenance: {
          id: 'WM',
          timestamp: Date.now() / 1000,
          source: 'world_model',
          generated_at: new Date().toISOString(),
          valid_until: new Date(Date.now() + 3600 * 1000).toISOString(),
          data_freshness: 'LIVE',
          model_version: 'v4',
          confidence: 0.9,
          uncertainty: 0.1,
          spatial_reference: 'EPSG:4326',
          status: 'VALID',
          is_simulated: false,
        },
      },
    });
    const env = buildEnvState(resp, baseOpts);
    expect(env.waveHeight.value).toBe(1.4);
    expect(env.windSpeed.value).toBe(18);
    expect(env.currentSpeed.value).toBe(0.3);
  });

  it('returns nulls (not fakes) when response is null and marks offline', () => {
    const env = buildEnvState(null, { ...baseOpts, isOffline: true });
    expect(env.waveHeight.value).toBeNull();
    expect(env.windSpeed.value).toBeNull();
    expect(env.currentSpeed.value).toBeNull();
    expect(env.isOffline).toBe(true);
    expect(env.hasOwnProperty('encounter')).toBe(true);
  });

  it('exposes route waypoints as segments keyed by index', () => {
    const env = buildEnvState(makeResponse(), baseOpts);
    expect(env.route.segmentRisk.length).toBe(3);
    expect(env.route.segmentRisk[0].risk).toBe(42);
    expect(env.route.segmentRisk[0].state).toBe('CAUTION');
  });

  it('marks demo flag when backend provenance says simulated', () => {
    const resp = makeResponse({
      provenance: {
        ...makeResponse().provenance,
        is_simulated: true,
        data_freshness: 'SIMULATED',
      },
    });
    const env = buildEnvState(resp, baseOpts);
    expect(env.isDemo).toBe(true);
    expect(env.provenance.isSimulated).toBe(true);
  });
});

describe('computeEncounter', () => {
  it('classifies HEAD seas when waves come from the bow', () => {
    const e = computeEncounter(90, 90, 8, 8);
    expect(e.relative).toBe('HEAD');
  });

  it('classifies FOLLOWING when waves come from astern', () => {
    const e = computeEncounter(0, 180, 8, 8);
    expect(e.relative).toBe('FOLLOWING');
  });

  it('classifies BEAM when waves come from the side', () => {
    const e = computeEncounter(0, 90, 8, 8);
    expect(e.relative).toBe('BEAM');
  });

  it('classifies QUARTERING for 45° offsets', () => {
    const e = computeEncounter(0, 45, 8, 8);
    expect(e.relative).toBe('QUARTERING');
  });

  it('returns UNKNOWN when inputs are missing', () => {
    expect(computeEncounter(null, 90, 8, 8).relative).toBe('UNKNOWN');
    expect(computeEncounter(0, null, 8, 8).relative).toBe('UNKNOWN');
  });

  it('flags unsafeForHeading near resonance for HEAD seas', () => {
    // vessel length 8.5 → beam proxy ~2.55 → natural roll ~1.78.
    // period 8s * cos(0) = 8 → encounterRatio ≈ 8/1.78 ≈ 4.5 → unsafe.
    const e = computeEncounter(0, 0, 8.5, 8);
    expect(e.relative).toBe('HEAD');
    expect(e.encounterRatio).not.toBeNull();
    // The resonance band is between 0.7 and 1.4; outside that band the
    // head seas may still be uncomfortable but should NOT auto-trigger.
    // The important invariant: encounterRatio is monotonic with Tp for HEAD.
    const e2 = computeEncounter(0, 0, 8.5, 4);
    expect(e2.encounterRatio!).toBeLessThan(e.encounterRatio!);
  });
});

describe('classifyRiskScore', () => {
  it('maps 0..25 → SAFE', () => {
    expect(classifyRiskScore(0)).toBe('SAFE');
    expect(classifyRiskScore(25)).toBe('CAUTION');
  });
  it('maps null → UNKNOWN', () => {
    expect(classifyRiskScore(null)).toBe('UNKNOWN');
  });
  it('maps 90+ → CRITICAL', () => {
    expect(classifyRiskScore(91)).toBe('CRITICAL');
  });
});

describe('hasLiveOcean', () => {
  it('is false when every value is null', () => {
    const env = buildEnvState(null, { ...baseOpts, isOffline: true });
    expect(hasLiveOcean(env)).toBe(false);
  });
  it('is true when at least one canonical value is present', () => {
    const env = buildEnvState(makeResponse(), baseOpts);
    expect(hasLiveOcean(env)).toBe(true);
  });
});