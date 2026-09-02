export interface Coordinate {
  lat: number;
  lon: number;
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

export interface HarborComparison {
  harbor_name: string;
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
  provenance_summary: {
    satellites: string[];
    ocean_models: string[];
    data_freshness: string;
    confidence_score: number;
  };
}

export interface TripAssessmentResponse {
  coordinate: Coordinate;
  vessel_length_m: number;
  language: string;
  verdict: string;
  risk_score: number;
  circuit_breaker_triggered: boolean;
  override_reason?: string;
  pfz_grounds: PFZGround[];
  species_matrix: Record<string, number>;
  route: RouteResult;
  economics: EconomicResult;
  geofence_status: {
    dist_to_imbl_km: number;
    inside_imbl_buffer_warning: boolean;
    inside_naval_zone_violation: boolean;
  };
  explanation: ExplanationResult;
  provenance: {
    satellites: string[];
    ocean_models: string[];
    data_freshness: string;
    confidence_score: number;
  };
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
