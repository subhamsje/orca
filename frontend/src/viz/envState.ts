/**
 * ORCA 4.0 — Central Environmental Visualization State.
 *
 * Normalises every animated input the frontend may render onto a single
 * typed value object. The entire visualization layer reads from
 * `EnvironmentalVisualizationState`; no other component is allowed to
 * re-derive wave / wind / current / risk numbers from the raw backend
 * payload directly.
 *
 * RULES:
 *   - every numeric value is `number | null`; null = "DATA UNAVAILABLE"
 *   - `isAvailable` helpers downstream use these nulls to decide whether
 *     to render an animated layer at all
 *   - provenance & confidence travel alongside each value so the UI can
 *     label freshness and source without losing context
 */

import type {
  CanonicalRecord,
  TripAssessmentResponse,
  WorldModel,
  Coordinate,
  ProvenanceRecord,
} from '../types';

/**
 * A small wrapper around an optional numeric value that travels with
 * provenance metadata. Lets the UI render a "DATA UNAVAILABLE" pill
 * instead of inventing a fake 0.
 */
export interface EnvValue<T extends number | string = number> {
  value: T | null;
  unit?: string;
  source?: string;
  confidence?: number | null;
  isSimulated?: boolean;
  freshness?: string;
}

export interface EncounterState {
  /** HEAD / FOLLOWING / BEAM / QUARTERING / CROSS */
  relative: 'HEAD' | 'FOLLOWING' | 'BEAM' | 'QUARTERING' | 'CROSS' | 'UNKNOWN';
  /** |wave_dir − vessel_heading| in degrees, modulo 360. */
  angleDeg: number | null;
  /** Encounter period ratio Tp / sqrt(L/g) — null if no L. */
  encounterRatio: number | null;
  /** Whether the backend explicitly says "unsafe for heading". */
  unsafeForHeading: boolean;
}

export interface RouteSegmentRisk {
  index: number;
  waypoint: [number, number];
  risk: number | null;
  state: 'SAFE' | 'CAUTION' | 'WARNING' | 'HIGH_RISK' | 'CRITICAL' | 'UNKNOWN';
}

export interface EnvironmentalVisualizationState {
  timestamp: number;
  forecastValidAt: number | null;
  location: Coordinate;
  requestedLocation: Coordinate;
  actualDataLocation: Coordinate | null;
  /** Significant wave height Hs in metres. */
  waveHeight: EnvValue;
  /** Peak wave period Tp in seconds. */
  wavePeriod: EnvValue;
  /** Mean wave direction (degrees from north, meteorological convention). */
  waveDirection: EnvValue;
  /** Steepness ratio (Hs / (g * Tp² / (2π))). */
  waveSteepness: EnvValue;
  /** Swell Hs in metres. */
  swellHeight: EnvValue;
  /** Swell period in seconds. */
  swellPeriod: EnvValue;
  /** Swell direction degrees. */
  swellDirection: EnvValue;
  /** 10 m wind speed (km/h). */
  windSpeed: EnvValue;
  /** Wind gust (km/h). */
  windGust: EnvValue;
  /** Wind direction (degrees). */
  windDirection: EnvValue;
  /** Surface current speed (m/s). */
  currentSpeed: EnvValue;
  /** Surface current direction (degrees). */
  currentDirection: EnvValue;
  /** Sea surface temperature (°C). */
  seaSurfaceTemperature: EnvValue;
  /** Chlorophyll-a (mg/m³). */
  chlorophyll: EnvValue;
  /** Air pressure (hPa). */
  pressure: EnvValue;
  /** Visibility (km). */
  visibility: EnvValue;
  /** Rainfall (mm/h). */
  rainfall: EnvValue;
  /** Cyclone presence + position. */
  cyclone: {
    present: boolean;
    name?: string;
    centerLat?: number;
    centerLon?: number;
    category?: string;
    source?: string;
  };
  /** Advisory warnings. */
  warnings: Array<{
    id: string;
    severity: string;
    type: string;
    description: string;
    source: string;
    lat?: number;
    lon?: number;
    radiusKm?: number;
    timestamp: number;
  }>;
  /** Vessel position / heading / speed. */
  vessel: {
    lat: number;
    lon: number;
    headingDeg: number | null;
    speedKnots: number | null;
    lengthM: number | null;
    name?: string;
  };
  /** Planned route (per-segment risk + waypoints). */
  route: {
    waypoints: Array<[number, number]>;
    segmentRisk: RouteSegmentRisk[];
    totalDistanceKm: number;
    estimatedMins: number;
    fuelLiters: number;
  };
  /** Risk score (0-100) with circuit breaker flag. */
  risk: {
    score: number | null;
    confidence: number | null;
    uncertainty: number | null;
    circuitBreakerTriggered: boolean;
    dataConfidence: number | null;
    dataQualityScore: number | null;
    riskLabel: string | null;
  };
  /** Wave-vs-vessel encounter. */
  encounter: EncounterState;
  /** Provenance record for the whole assessment. */
  provenance: {
    id: string;
    source: string;
    confidence: number;
    isSimulated: boolean;
    freshness: string;
    generatedAt: number;
    validUntil: number | null;
  };
  /** Whether the live backend is connected (false → offline fallback). */
  isOffline: boolean;
  /** Whether the assessment is a demo / simulation (must be labelled). */
  isDemo: boolean;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function envFromCanonical(
  rec: CanonicalRecord | undefined,
  fallbackSource?: string,
): EnvValue {
  if (!rec) {
    return { value: null, source: fallbackSource };
  }
  return {
    value: typeof rec.value === 'number' ? rec.value : null,
    unit: rec.unit,
    source: rec.source || fallbackSource,
    confidence: rec.confidence ?? null,
    isSimulated: false,
    freshness: rec.data_type,
  };
}

function envFromOcean(
  ocean: WorldModel['ocean_state'] | undefined,
  key: keyof WorldModel['ocean_state'],
  fallbackSource?: string,
): EnvValue {
  const v = ocean?.[key];
  return {
    value: typeof v === 'number' ? v : null,
    source: fallbackSource,
  };
}

function angleDiffDeg(a: number, b: number): number {
  const d = (((a - b) % 360) + 360) % 360;
  return d;
}

export function computeEncounter(
  vesselHeadingDeg: number | null,
  waveDirDeg: number | null,
  vesselLengthM: number | null,
  wavePeriodS: number | null,
): EncounterState {
  if (vesselHeadingDeg == null || waveDirDeg == null) {
    return {
      relative: 'UNKNOWN',
      angleDeg: null,
      encounterRatio: null,
      unsafeForHeading: false,
    };
  }
  // Wave direction is "from" (meteorological). Relative angle is the
  // direction the waves are coming from *relative to the bow*.
  const rel = angleDiffDeg(waveDirDeg, vesselHeadingDeg);
  let classification: EncounterState['relative'];
  if (rel < 30 || rel > 330) classification = 'HEAD';
  else if (rel > 150 && rel < 210) classification = 'FOLLOWING';
  else if (rel >= 60 && rel <= 120) classification = 'BEAM';
  else if ((rel > 30 && rel < 60) || (rel > 120 && rel < 150)) classification = 'QUARTERING';
  else if (Math.abs(rel - 90) < 5) classification = 'BEAM';
  else classification = 'CROSS';

  // Encounter period approximation: Tp * cos(angle) for head seas.
  // Crude but consistent with the visual scaling we use elsewhere.
  const cosRel = Math.cos((rel * Math.PI) / 180);
  const encPeriod = wavePeriodS != null ? wavePeriodS * Math.abs(cosRel) : null;

  // Encounter-ratio vs vessel natural period: rule-of-thumb vessel
  // roll period ≈ 0.8 * beam for small craft; here we accept length as
  // a proxy since beam is not always populated.
  let encounterRatio: number | null = null;
  if (encPeriod != null && vesselLengthM != null && vesselLengthM > 0) {
    // Natural roll period scales with beam; small craft ~0.5-0.7 * beam.
    // Without beam, approximate beam ~ 0.3 * length.
    const beamProxy = 0.3 * vesselLengthM;
    const naturalRoll = 0.7 * beamProxy;
    encounterRatio = encPeriod / naturalRoll;
  }

  const unsafeForHeading =
    classification === 'HEAD' &&
    encounterRatio != null &&
    encounterRatio > 0.7 &&
    encounterRatio < 1.4;

  return {
    relative: classification,
    angleDeg: rel,
    encounterRatio,
    unsafeForHeading,
  };
}

/* ------------------------------------------------------------------ */
/* Builders                                                            */
/* ------------------------------------------------------------------ */

interface BuildOptions {
  /** The harbor / coordinate the user requested. */
  requested: Coordinate;
  /** The actual coordinate the backend used for the grid point. */
  actual: Coordinate | null;
  /** Vessel identity. */
  vessel: {
    lat: number;
    lon: number;
    headingDeg: number | null;
    speedKnots: number | null;
    lengthM: number | null;
    name?: string;
  };
  /** Force the offline fallback flag (defaults to reading response.provenance). */
  isOffline?: boolean;
  /** Force demo flag. */
  isDemo?: boolean;
}

/**
 * Build the normalized EnvironmentalVisualizationState from a backend
 * TripAssessmentResponse. If the response is null we still return a
 * valid shape with every value null and `isOffline: true`.
 */
export function buildEnvState(
  response: TripAssessmentResponse | null | undefined,
  opts: BuildOptions,
): EnvironmentalVisualizationState {
  const ocean = response?.world_model?.ocean_state;
  const canonical = response?.canonical_records ?? {};
  const provenanceRecord: ProvenanceRecord | undefined = response?.provenance;
  const isOffline =
    opts.isOffline ?? (provenanceRecord?.status === 'OFFLINE' || response == null);
  const isDemo =
    opts.isDemo ?? Boolean(provenanceRecord?.is_simulated);

  // Ocean canonical key names in the spec:
  //   sea_surface_temperature, wave_height, wind_speed, swell_wave_height,
  //   current_speed, chlorophyll, air_pressure, visibility.
  // These match OceanVitals.tsx and the backend canonical_records map.
  const waveHeight = canonical['wave_height']
    ? envFromCanonical(canonical['wave_height'], envFromOcean(ocean, 'wave_height_m').source ?? undefined)
    : envFromOcean(ocean, 'wave_height_m', 'Open-Meteo Marine');

  const wavePeriod = envFromOcean(ocean, 'wave_period_s', 'Open-Meteo Marine');
  const waveDirection: EnvValue = {
    value: ocean?.wind_direction_cardinal ? ocean.wind_direction_deg ?? null : null,
    // Note: backend currently does not expose mean-wave direction in
    // the legacy OceanState; we surface swell direction as the
    // closest authoritative proxy for "wave propagation direction".
    source: 'Open-Meteo Marine (swell proxy)',
  };

  const swellHeight = envFromOcean(ocean, 'swell_wave_height_m', 'Open-Meteo Marine');
  const swellPeriod = envFromOcean(ocean, 'swell_wave_period_s', 'Open-Meteo Marine');
  const swellDirection = envFromOcean(ocean, 'swell_wave_direction_deg', 'Open-Meteo Marine');

  const windSpeed = canonical['wind_speed']
    ? envFromCanonical(canonical['wind_speed'], 'Open-Meteo ECMWF')
    : envFromOcean(ocean, 'wind_speed_kmh', 'Open-Meteo ECMWF');
  const windGust = envFromOcean(ocean, 'wind_gust_kmh', 'Open-Meteo ECMWF');
  const windDirection = envFromOcean(ocean, 'wind_direction_deg', 'Open-Meteo ECMWF');

  const currentSpeed = canonical['current_speed']
    ? envFromCanonical(canonical['current_speed'], 'OSCAR / ROMS')
    : envFromOcean(ocean, 'current_speed_ms', 'OSCAR / ROMS');
  const currentDirection = envFromOcean(ocean, 'current_dir_deg', 'OSCAR / ROMS');

  const sst = canonical['sea_surface_temperature']
    ? envFromCanonical(canonical['sea_surface_temperature'], 'NOAA Coral Reef Watch')
    : envFromOcean(ocean, 'sst_c', 'NOAA Coral Reef Watch');

  const chl = canonical['chlorophyll']
    ? envFromCanonical(canonical['chlorophyll'], 'INCOIS OCM-3')
    : envFromOcean(ocean, 'chlorophyll_mg_m3', 'INCOIS OCM-3');

  const pressure = envFromOcean(ocean, 'air_pressure_hpa', 'MET Norway');
  const visibility = envFromOcean(ocean, 'visibility_km', 'MET Norway');

  // Cyclone advisories come from osint_sector_intelligence if present.
  const advisories = response?.osint_sector_intelligence?.active_security_advisories ?? [];
  const cycloneAdvisory = advisories.find((a) => a.type.toUpperCase().includes('CYCLONE'));

  const warnings = advisories.map((a) => ({
    id: a.incident_id,
    severity: a.severity,
    type: a.type,
    description: a.description,
    source: a.source,
    lat: a.lat,
    lon: a.lon,
    radiusKm: a.radius_km,
    timestamp: a.timestamp,
  }));

  // Route segmentation: backend only exposes one risk_score. We
  // surface the waypoints but mark every segment with the same global
  // score (no fabricated per-segment values). Visualisation in
  // RouteRiskSegments can later switch to per-segment data if the
  // backend adds it.
  const routeWaypoints = (response?.route?.waypoints ?? []) as Array<[number, number]>;
  const segmentRisk: RouteSegmentRisk[] = routeWaypoints.map((wp, idx) => ({
    index: idx,
    waypoint: wp,
    risk: response?.risk_score ?? null,
    state: classifyRiskScore(response?.risk_score ?? null),
  }));

  const encounter = computeEncounter(
    opts.vessel.headingDeg,
    ocean?.swell_wave_direction_deg ?? null,
    opts.vessel.lengthM,
    ocean?.swell_wave_period_s ?? ocean?.wave_period_s ?? null,
  );

  const generatedAt = provenanceRecord?.timestamp
    ? provenanceRecord.timestamp * 1000
    : Date.now();

  return {
    timestamp: Date.now(),
    forecastValidAt: response?.world_model?.provenance?.valid_until
      ? new Date(response.world_model.provenance.valid_until).getTime()
      : null,
    location: response?.coordinate ?? opts.requested,
    requestedLocation: opts.requested,
    actualDataLocation: opts.actual,
    waveHeight,
    wavePeriod,
    waveDirection,
    waveSteepness: { value: null, source: response?.risk?.risk_equation ? 'Risk Engine' : undefined },
    swellHeight,
    swellPeriod,
    swellDirection,
    windSpeed,
    windGust,
    windDirection,
    currentSpeed,
    currentDirection,
    seaSurfaceTemperature: sst,
    chlorophyll: chl,
    pressure,
    visibility,
    rainfall: { value: null, source: undefined },
    cyclone: {
      present: Boolean(cycloneAdvisory),
      name: cycloneAdvisory?.description,
      centerLat: cycloneAdvisory?.lat,
      centerLon: cycloneAdvisory?.lon,
      category: cycloneAdvisory?.severity,
      source: cycloneAdvisory?.source,
    },
    warnings,
    vessel: opts.vessel,
    route: {
      waypoints: routeWaypoints,
      segmentRisk,
      totalDistanceKm: response?.route?.total_distance_km ?? 0,
      estimatedMins: response?.route?.estimated_travel_mins ?? 0,
      fuelLiters: response?.route?.fuel_consumption_est_liters ?? 0,
    },
    risk: {
      score: response?.risk_score ?? null,
      confidence: response?.risk?.data_confidence ?? null,
      uncertainty: response?.risk?.risk_uncertainty ?? null,
      circuitBreakerTriggered: Boolean(response?.circuit_breaker_triggered),
      dataConfidence: response?.risk?.data_confidence ?? null,
      dataQualityScore: response?.risk?.data_quality_score ?? null,
      riskLabel: response?.risk_label ?? response?.verdict ?? null,
    },
    encounter,
    provenance: {
      id: provenanceRecord?.id ?? 'OFFLINE',
      source: provenanceRecord?.source ?? 'OFFLINE — backend unreachable',
      confidence: provenanceRecord?.confidence ?? 0,
      isSimulated: provenanceRecord?.is_simulated ?? false,
      freshness: provenanceRecord?.data_freshness ?? 'UNKNOWN',
      generatedAt,
      validUntil: provenanceRecord?.valid_until
        ? new Date(provenanceRecord.valid_until).getTime()
        : null,
    },
    isOffline,
    isDemo,
  };
}

export function classifyRiskScore(score: number | null): RouteSegmentRisk['state'] {
  if (score == null || Number.isNaN(score)) return 'UNKNOWN';
  if (score >= 90) return 'CRITICAL';
  if (score >= 75) return 'HIGH_RISK';
  if (score >= 50) return 'WARNING';
  if (score >= 25) return 'CAUTION';
  return 'SAFE';
}

/**
 * Convenience accessor for "is there *any* real data to render against?".
 * Components should render an explicit "DATA UNAVAILABLE" pill when
 * this is false.
 */
export function hasLiveOcean(env: EnvironmentalVisualizationState): boolean {
  return (
    env.waveHeight.value != null ||
    env.windSpeed.value != null ||
    env.currentSpeed.value != null ||
    env.seaSurfaceTemperature.value != null
  );
}