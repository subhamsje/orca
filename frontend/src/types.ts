export interface Coordinate {
  lat: number;
  lon: number;
}

export interface ProvenanceRecord {
  id: string;
  timestamp: number;
  source: string;
  generated_at: string;
  valid_until: string;
  data_freshness: string;
  model_version: string;
  confidence: number;
  uncertainty: number;
  spatial_reference: string;
  status: string;
  is_simulated: boolean;
}

export interface VesselTwin {
  vessel_id: string;
  vessel_name: string;
  vessel_type: string;
  length_m: number;
  beam_m: number;
  draft_m: number;
  engine_hp: number;
  fuel_capacity_l: number;
  fuel_current_l: number;
  max_wave_height_m: number;
  seaworthiness_score: number;
}

export interface OceanState {
  sst_c: number;
  chlorophyll_mg_m3: number;
  current_speed_ms: number;
  current_dir_deg: number;
  wave_height_m: number;
  wave_period_s: number;
  salinity_psu: number;
  wind_speed_kmh: number;
  wind_gust_kmh: number;
  wind_direction_deg: number;
  wind_direction_cardinal: string;
  swell_wave_height_m: number;
  swell_wave_period_s: number;
  swell_wave_direction_deg: number;
  air_pressure_hpa: number;
  air_temperature_c: number;
  cloud_cover_pct: number;
  visibility_km: number;
}

export interface RiskState {
  weather_risk_score: number;
  wave_steepness_ratio: number;
  capsizing_risk: boolean;
  collision_cpa_nm: number;
  grounding_depth_m: number;
  dist_to_imbl_km: number;
  dist_to_naval_zone_km: number;
}

export interface WorldModel {
  coordinate: Coordinate;
  h3_index_res7: string;
  vessel_twin: VesselTwin;
  ocean_state: OceanState;
  risk_state: RiskState;
  provenance: ProvenanceRecord;
}

export interface PFZGround {
  rank: number;
  name: string;
  distance_km: number;
  bearing_deg?: number;
  hsi: number;
  likely_species: string[];
  coordinates: [number, number];
}

export interface RouteResult {
  path_type: string;
  total_distance_km: number;
  estimated_travel_mins: number;
  waypoints: [number, number][];
  avoided_hazards: string[];
  fuel_consumption_est_liters: number;
}

export interface MultiObjectiveCandidate {
  strategy: 'SAFEST_DETOUR' | 'LOWEST_FUEL' | 'HIGHEST_NET_VALUE' | string;
  description: string;
  distance_km: number;
  estimated_mins: number;
  fuel_liters: number;
  safety_score: number;
  waypoints: [number, number][];
}

export interface MultiObjectiveRoutes {
  origin: [number, number];
  destination: [number, number];
  recommended_strategy: string;
  candidate_routes: MultiObjectiveCandidate[];
  legal_constraints_checked: string[];
  optimization_version: string;
}

export interface CollisionGuard {
  initial_range_nm: number;
  relative_speed_knots: number;
  cpa_nautical_miles: number;
  tcpa_minutes: number;
  collision_risk_alert: boolean;
  recommended_action: string;
}

export interface HarborComparison {
  harbor_name: string;
  latitude?: number;
  longitude?: number;
  gross_revenue_inr: number;
  total_fuel_cost_inr: number;
  net_profit_inr: number;
  unit_price_per_kg: number;
  extra_distance_km: number;
  recommended?: boolean;
}

export interface EconomicResult {
  best_docking_harbor: string;
  max_expected_profit_inr: number;
  estimated_catch_kg: number;
  target_species: string;
  fuel_cost_total_inr: number;
  harbor_comparisons: HarborComparison[];
}

export interface ExplanationResult {
  plain_language_text: string;
  wave_description: string;
  language: string;
  voice_code: string;
  provenance_summary: {
    satellites: string[];
    ocean_models: string[];
    data_freshness: string;
    confidence_score: number;
    audit_hash: string;
  };
}

export interface OsintAdvisory {
  incident_id: string;
  type: string;
  source: string;
  lat: number;
  lon: number;
  radius_km: number;
  severity: string;
  description: string;
  timestamp: number;
}

export interface AgmarknetPort {
  Bangda?: number;
  Surmai?: number;
  Tarli?: number;
  Poplet?: number;
  updated_at?: string;
  [species: string]: number | string | undefined;
}

export interface OsintIntelligence {
  sector_coordinate: [number, number];
  h3_index: string;
  osint_data_sources: string[];
  active_security_advisories: OsintAdvisory[];
  viirs_nightlight_trawlers_detected: number;
  agmarknet_wholesale_summary: Record<string, AgmarknetPort>;
  data_freshness: string;
}

export interface RestrictedZoneNearby {
  name: string;
  distance_km: number;
}

export interface GeofenceStatus {
  is_plausible: boolean;
  dist_to_imbl_km: number;
  nearest_imbl_name: string;
  dist_to_naval_zone_km: number;
  inside_imbl_buffer_warning: boolean;
  inside_naval_zone_violation: boolean;
  turn_back_bearing_deg: number;
  restricted_zones_nearby: RestrictedZoneNearby[];
}

export interface InterAgentEvent {
  sender: string;
  event_type: string;
  confidence: number;
  timestamp: number;
  payload: Record<string, unknown>;
}

export interface TripAssessmentResponse {
  coordinate: Coordinate;
  vessel_length_m: number;
  language: string;
  verdict: string;
  risk_score: number;
  circuit_breaker_triggered: boolean;
  override_reason?: string | null;
  world_model?: WorldModel;
  pfz_grounds: PFZGround[];
  species_matrix: Record<string, number>;
  route: RouteResult;
  multi_objective_routes?: MultiObjectiveRoutes;
  economics: EconomicResult;
  collision_guard?: CollisionGuard;
  osint_sector_intelligence?: OsintIntelligence;
  geofence_status: GeofenceStatus;
  explanation: ExplanationResult;
  provenance: ProvenanceRecord;
  inter_agent_event_bus?: InterAgentEvent[];
  telemetry: {
    execution_ms: number;
    services_triggered: string[];
  };
}

export interface VesselProfile {
  vessel_id: string;
  vessel_name: string;
  length_m: number;
  engine_hp: number;
  fuel_capacity_l: number;
}

export type VerdictTone = 'safe' | 'caution' | 'danger';

export function verdictTone(risk: number, breaker: boolean): VerdictTone {
  if (breaker || risk >= 75) return 'danger';
  if (risk >= 40) return 'caution';
  return 'safe';
}