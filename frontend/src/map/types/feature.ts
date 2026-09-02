/**
 * ORCA Phase 02 Map Feature Domain Models
 * Clean abstractions for map features consumed by renderers & detail panels.
 */

import { OperationalState } from '../../design/states';

export type FeatureType =
  | 'VESSEL'
  | 'ZONE'
  | 'IMBL'
  | 'ROUTE'
  | 'H3_CELL'
  | 'INCIDENT'
  | 'ENVIRONMENTAL';

export type FreshnessState = 'LIVE' | 'RECENT' | 'STALE' | 'OFFLINE' | 'UNKNOWN';

export interface BaseFeature {
  readonly id: string;
  readonly type: FeatureType;
  readonly name: string;
  readonly position: [number, number]; // [lat, lon]
  readonly state: OperationalState;
  readonly freshness: FreshnessState;
  readonly lastUpdatedText?: string;
  readonly isDemoData?: boolean;
}

export interface VesselFeature extends BaseFeature {
  readonly type: 'VESSEL';
  readonly vesselId: string;
  readonly headingDeg: number;
  readonly speedKnots: number;
  readonly vesselType: 'FISHING_CRAFT' | 'PATROL_VESSEL' | 'CARGO' | 'DARK_TRAWLER';
  readonly riskScore: number;
  readonly lengthM: number;
  readonly engineHp?: number;
  readonly callSign?: string;
}

export interface VectorZoneFeature extends BaseFeature {
  readonly type: 'ZONE' | 'IMBL';
  readonly zoneType: 'IMBL' | 'NAVAL_RESTRICTED' | 'MARINE_RESERVE' | 'PFZ_GROUND';
  readonly polygonCoordinates: [number, number][]; // Array of [lat, lon] vertices
  readonly hsiScore?: number;
  readonly targetSpecies?: string[];
  readonly radiusKm?: number;
  readonly distanceKm?: number;
}

export interface H3CellFeature extends BaseFeature {
  readonly type: 'H3_CELL';
  readonly h3Index: string;
  readonly resolution: number;
  readonly cellBoundary: [number, number][]; // 6 vertices [lat, lon]
  readonly hsiValue?: number;
  readonly vesselCount?: number;
  readonly anomalyScore?: number;
}

export interface RouteFeature extends BaseFeature {
  readonly type: 'ROUTE';
  readonly routeType: 'PRIMARY_ASTAR' | 'ALTERNATIVE';
  readonly waypoints: [number, number][];
  readonly distanceKm: number;
  readonly durationMins: number;
  readonly fuelLiters: number;
  readonly avoidedHazards: string[];
}

export interface IncidentFeature extends BaseFeature {
  readonly type: 'INCIDENT';
  readonly incidentType: 'SAR_DRIFT' | 'SECURITY_ALERT' | 'DISTRESS_BEACON';
  readonly severity: 'HIGH' | 'CRITICAL' | 'MODERATE';
  readonly searchRadiusKm?: number;
  readonly description: string;
  readonly source: string;
}

export type MapFeature =
  | VesselFeature
  | VectorZoneFeature
  | H3CellFeature
  | RouteFeature
  | IncidentFeature;
