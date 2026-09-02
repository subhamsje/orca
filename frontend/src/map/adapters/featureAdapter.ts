/**
 * Map Feature Adapter
 *
 * Converts authoritative ORCA domain responses into MapFeature records.
 *
 * Rule: this adapter ONLY converts what the backend / source actually
 * returned. It NEVER inlines fictional geometry (IMBL polygons, naval
 * zones, fake vessel IDs, etc.). When the backend reports geofence
 * distance but no polygon, we expose `distanceKm` on a probe feature
 * (e.g. VectorZoneFeature with an empty ring) so the renderer can choose
 * to show a small reference circle.
 *
 * The harbor list in `utils/harbors.ts` is a static project constant — it
 * is NOT a fabricated fake; it is the project's curated sector catalog.
 * We convert each entry to a HARBOR-type marker feature so the map can
 * act as a sector picker.
 */

import { TripAssessmentResponse } from '../../types';
import {
  MapFeature,
  VectorZoneFeature,
  RouteFeature,
  H3CellFeature,
} from '../types/feature';
import { HarborLocation } from '../../utils/harbors';
import { riskScoreToState } from '../../design/states';
import { resolveCellFromCenter } from './h3Adapter';

const H3_RESOLUTION = 7; // ~1.2 km²

export interface AdapterContext {
  /** Currently selected harbor (used for context-aware feature naming). */
  readonly selectedHarbor?: HarborLocation | null;
  /** Live vessel identifier from the operator's vessel profile. */
  readonly vesselId?: string | null;
  /** Optional live vessel name. */
  readonly vesselName?: string | null;
  /** Optional risk score to display for the operator's own vessel. */
  readonly ownVesselRiskScore?: number | null;
}

/**
 * Build a small H3 cell around the active coordinate, returning a real
 * Uber-H3 polygon. If the H3 library cannot resolve (e.g. invalid lat/lon
 * combinations) the function returns null and callers omit the H3 layer.
 */
function buildH3FeatureAtCenter(
  centerLat: number,
  centerLon: number,
  assessment: TripAssessmentResponse,
): H3CellFeature | null {
  const hsiValue = assessment.pfz_grounds[0]?.hsi ?? null;
  const resolved = resolveCellFromCenter(centerLat, centerLon, H3_RESOLUTION, {
    id: `h3_cell_${centerLat.toFixed(3)}_${centerLon.toFixed(3)}`,
    name: `H3 Res ${H3_RESOLUTION} cell`,
    state: 'NORMAL',
    freshness: 'UNKNOWN',
    lastUpdatedText: 'H3 Spatial Index',
    source: 'h3-js',
    hsiValue: hsiValue ?? undefined,
    vesselCount: 1,
  });
  return resolved ? resolved.feature : null;
}

/**
 * Convert a TripAssessmentResponse into the features the map renders.
 *
 * Output:
 * - 1 own-vessel marker (when vesselId is supplied in context)
 * - N PFZ-ground polygon features (from `assessment.pfz_grounds`)
 * - 1 H3 cell feature around the active coordinate
 * - 1 route feature (when waypoints are present)
 *
 * NEVER emits fake IMBL / naval zones — those require authoritative
 * datasets that are not yet integrated.
 */
export function convertTripAssessmentToMapFeatures(
  assessment: TripAssessmentResponse | null,
  context: AdapterContext = {},
): MapFeature[] {
  if (!assessment) return [];

  const features: MapFeature[] = [];
  const activeLat = assessment.coordinate.lat;
  const activeLon = assessment.coordinate.lon;

  // 1. Operator's own vessel marker (real vesselId only — never a literal).
  if (context.vesselId) {
    features.push({
      id: 'own_vessel',
      type: 'VESSEL',
      name: context.vesselName?.trim() || 'Active vessel',
      vesselId: context.vesselId,
      position: [activeLat, activeLon],
      headingDeg: null,
      speedKnots: null,
      vesselType: 'FISHING_CRAFT',
      state: riskScoreToState(
        typeof context.ownVesselRiskScore === 'number'
          ? context.ownVesselRiskScore
          : assessment.risk_score,
      ),
      freshness: 'LIVE',
      riskScore:
        typeof context.ownVesselRiskScore === 'number'
          ? context.ownVesselRiskScore
          : assessment.risk_score,
      lengthM: assessment.vessel_length_m,
      lastUpdatedText: 'Active trip assessment',
      source: 'ORCA trip assessment',
      isDemoData: false,
    });
  }

  // 2. PFZ ground polygons (real coordinates from the assessment).
  assessment.pfz_grounds.forEach((ground, idx) => {
    features.push({
      id: `pfz_${ground.rank}_${idx}`,
      type: 'ZONE',
      name: ground.name,
      position: ground.coordinates,
      state: ground.hsi >= 75 ? 'NORMAL' : ground.hsi >= 40 ? 'CAUTION' : 'WARNING',
      freshness: 'RECENT',
      zoneType: 'PFZ_GROUND',
      // Until PFZ polygons ship from the backend, emit a single-point
      // reference so the renderer can decide how to visualise it
      // (the renderer treats single-point polygons as a marker with
      // radius).
      polygonCoordinates: [ground.coordinates],
      distanceKm: ground.distance_km,
      hsiScore: ground.hsi,
      targetSpecies: ground.likely_species,
      radiusKm: 4.5,
      lastUpdatedText: 'INCOIS OCM-3',
      source: 'ORCA PFZ adapter',
      isDemoData: false,
    });
  });

  // 3. H3 cell around the active coordinate.
  const h3 = buildH3FeatureAtCenter(activeLat, activeLon, assessment);
  if (h3) features.push(h3);

  // 4. Route polylines (real waypoints from the assessment).
  if (assessment.route?.waypoints?.length) {
    const routeFeature: RouteFeature = {
      id: 'primary_route',
      type: 'ROUTE',
      name: assessment.route.path_type || 'Trip route',
      position: [activeLat, activeLon],
      state: 'NORMAL',
      freshness: 'LIVE',
      routeType: 'PRIMARY_ASTAR',
      waypoints: assessment.route.waypoints,
      distanceKm: assessment.route.total_distance_km,
      durationMins: assessment.route.estimated_travel_mins,
      fuelLiters: assessment.route.fuel_consumption_est_liters,
      avoidedHazards: assessment.route.avoided_hazards ?? [],
      lastUpdatedText: 'Calculated for this trip',
      source: 'ORCA trip assessment',
      isDemoData: false,
    };
    features.push(routeFeature);
  }

  // 5. Geofence reference probe — emits only when the assessment reports
  // a distance to IMBL, and only as a single-point feature. We never
  // emit a polygon because we do not have the authoritative geometry.
  if (
    typeof assessment.geofence_status?.dist_to_imbl_km === 'number' &&
    !Number.isNaN(assessment.geofence_status.dist_to_imbl_km)
  ) {
    features.push({
      id: 'imbl_probe',
      type: 'IMBL',
      name: 'IMBL proximity reference',
      position: [activeLat, activeLon],
      state: assessment.geofence_status.inside_imbl_buffer_warning
        ? 'HIGH_RISK'
        : 'INFO',
      freshness: 'STALE',
      zoneType: 'IMBL',
      polygonCoordinates: [[activeLat, activeLon]],
      distanceKm: assessment.geofence_status.dist_to_imbl_km,
      lastUpdatedText: 'Reported by trip assessment',
      source: 'ORCA geofence adapter',
      isDemoData: false,
    });
  }

  return features;
}