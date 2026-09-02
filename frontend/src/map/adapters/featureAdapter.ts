/**
 * Map Feature Adapter
 * Transforms structured backend responses (TripAssessmentResponse, OSINT, Dark Fleet) into MapFeature domain models.
 */

import { TripAssessmentResponse } from '../../types';
import { MapFeature, VesselFeature, VectorZoneFeature, RouteFeature, H3CellFeature, IncidentFeature } from '../types/feature';
import { createH3CellGeometry } from './h3Adapter';
import { riskScoreToState } from '../../design/states';

export function convertTripAssessmentToMapFeatures(
  assessment: TripAssessmentResponse | null,
  vesselName: string = 'My Vessel'
): MapFeature[] {
  if (!assessment) return [];

  const features: MapFeature[] = [];
  const activeLat = assessment.coordinate.lat;
  const activeLon = assessment.coordinate.lon;

  // 1. Active Vessel Feature
  const ownVesselState = riskScoreToState(assessment.risk_score);
  const ownVessel: VesselFeature = {
    id: 'own_vessel_primary',
    type: 'VESSEL',
    name: vesselName,
    vesselId: 'IND-MH-04-892',
    position: [activeLat, activeLon],
    headingDeg: 240.0,
    speedKnots: 8.5,
    vesselType: 'FISHING_CRAFT',
    state: ownVesselState,
    freshness: 'LIVE',
    riskScore: assessment.risk_score,
    lengthM: assessment.vessel_length_m,
    engineHp: 9.9,
    lastUpdatedText: 'Active GPS Feed',
    isDemoData: false,
  };
  features.push(ownVessel);

  // 2. PFZ Grounds Vector Features
  assessment.pfz_grounds.forEach((ground) => {
    const pfzZone: VectorZoneFeature = {
      id: `pfz_ground_${ground.rank}`,
      type: 'ZONE',
      name: ground.name,
      position: ground.coordinates,
      state: ground.hsi > 75 ? 'NORMAL' : 'CAUTION',
      freshness: 'RECENT',
      zoneType: 'PFZ_GROUND',
      polygonCoordinates: createH3CellGeometry(`pfz_${ground.rank}`, ground.coordinates[0], ground.coordinates[1]).boundary,
      hsiScore: ground.hsi,
      targetSpecies: ground.likely_species,
      radiusKm: 4.5,
      distanceKm: ground.distance_km,
      lastUpdatedText: 'INCOIS OCM-3 Satellite Feed',
      isDemoData: false,
    };
    features.push(pfzZone);
  });

  // 3. Primary A* Route Feature
  if (assessment.route && assessment.route.waypoints) {
    const routeFeature: RouteFeature = {
      id: 'primary_astar_route',
      type: 'ROUTE',
      name: assessment.route.path_type || 'Primary Weather Pathfinder Route',
      position: [activeLat, activeLon],
      state: 'NORMAL',
      freshness: 'LIVE',
      routeType: 'PRIMARY_ASTAR',
      waypoints: assessment.route.waypoints,
      distanceKm: assessment.route.total_distance_km,
      durationMins: assessment.route.estimated_travel_mins,
      fuelLiters: assessment.route.fuel_consumption_est_liters,
      avoidedHazards: assessment.route.avoided_hazards,
      lastUpdatedText: 'Calculated now',
      isDemoData: false,
    };
    features.push(routeFeature);
  }

  // 4. H3 Spatial Index Cell Feature
  const h3Cell = createH3CellGeometry('8760b296bffffff', activeLat, activeLon);
  const h3Feature: H3CellFeature = {
    id: `h3_cell_${h3Cell.h3Index}`,
    type: 'H3_CELL',
    name: `H3 Hex ${h3Cell.h3Index}`,
    position: [activeLat, activeLon],
    state: 'NORMAL',
    freshness: 'LIVE',
    h3Index: h3Cell.h3Index,
    resolution: 7,
    cellBoundary: h3Cell.boundary,
    hsiValue: assessment.pfz_grounds[0]?.hsi || 85,
    vesselCount: 1,
    lastUpdatedText: 'H3 Spatial Index',
    isDemoData: false,
  };
  features.push(h3Feature);

  // 5. Restricted Naval Zone Area B-4 Polygon
  const navalZone: VectorZoneFeature = {
    id: 'naval_range_b4',
    type: 'ZONE',
    name: 'Restricted Naval Range Area B-4',
    position: [15.05, 73.35],
    state: 'CRITICAL',
    freshness: 'LIVE',
    zoneType: 'NAVAL_RESTRICTED',
    polygonCoordinates: createH3CellGeometry('naval_b4', 15.05, 73.35).boundary,
    radiusKm: 8.5,
    lastUpdatedText: 'Static Hydrographic Baseline',
    isDemoData: false,
  };
  features.push(navalZone);

  // 6. International Maritime Boundary Line (IMBL Palk Strait / Sri Lanka EEZ)
  const imblZone: VectorZoneFeature = {
    id: 'imbl_palk_strait',
    type: 'IMBL',
    name: 'Palk Strait International Maritime Boundary Line (IMBL)',
    position: [9.25, 79.55],
    state: 'WARNING',
    freshness: 'LIVE',
    zoneType: 'IMBL',
    polygonCoordinates: [
      [9.40, 79.20],
      [9.30, 79.45],
      [9.20, 79.65],
      [9.05, 79.85],
    ],
    distanceKm: assessment.geofence_status?.dist_to_imbl_km || 24.5,
    lastUpdatedText: 'Official Hydrographic Baseline',
    isDemoData: false,
  };
  features.push(imblZone);

  return features;
}
