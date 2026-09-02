/**
 * ORCA Phase 02 Map Feature Domain Models
 *
 * Pure data shapes consumed by map renderers and the detail panel.
 * These types MUST NOT contain rendered markup, Leaflet objects, or domain
 * logic — they describe what the rest of ORCA emits to the map.
 *
 * Demo vs real data: every feature exposes `isDemoData` so the renderer
 * can label simulated features explicitly. Adapters MUST set this to true
 * for any value that did not come from authoritative backend / dataset
 * sources.
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
  /** Source attribution — e.g. "INCOIS OCM-3", "Sentinel-1 SAR". */
  readonly source?: string;
}

export type VesselType =
  | 'FISHING_CRAFT'
  | 'PATROL_VESSEL'
  | 'CARGO'
  | 'DARK_TRAWLER'
  | 'UNKNOWN';

export interface VesselFeature extends BaseFeature {
  readonly type: 'VESSEL';
  readonly vesselId: string;
  readonly headingDeg: number | null;
  readonly speedKnots: number | null;
  readonly vesselType: VesselType;
  /** 0-100. Optional — only present when the source provided one. */
  readonly riskScore?: number;
  readonly lengthM?: number;
  readonly engineHp?: number;
  readonly callSign?: string;
}

export type ZoneType =
  | 'IMBL'
  | 'NAVAL_RESTRICTED'
  | 'MARINE_RESERVE'
  | 'PFZ_GROUND'
  | 'ENVIRONMENTAL_HAZARD';

export interface VectorZoneFeature extends BaseFeature {
  readonly type: 'ZONE' | 'IMBL';
  readonly zoneType: ZoneType;
  /**
   * Closed polygon ring in [lat, lon] pairs. For IMBL this is rendered as
   * a polyline; for polygons as a filled area. Must come from a real
   * authoritative dataset — adapters MUST NOT invent geometry.
   */
  readonly polygonCoordinates: ReadonlyArray<[number, number]>;
  readonly hsiScore?: number;
  readonly targetSpecies?: ReadonlyArray<string>;
  readonly radiusKm?: number;
  readonly distanceKm?: number;
}

export interface H3CellFeature extends BaseFeature {
  readonly type: 'H3_CELL';
  /** Real Uber-H3 cell index (e.g. "8928308280fffff"). Adapters must
   *  NEVER invent indexes — if the backend does not provide one, do not
   *  render an H3 layer. */
  readonly h3Index: string;
  readonly resolution: number;
  /**
   * Six-vertex [lat, lon] polygon boundary derived via h3-js
   * `cellToBoundary(h3Index)`. Adapters compute this from the index,
   * never from scratch.
   */
  readonly cellBoundary: ReadonlyArray<[number, number]>;
  readonly hsiValue?: number;
  readonly vesselCount?: number;
  readonly anomalyScore?: number;
}

export interface RouteFeature extends BaseFeature {
  readonly type: 'ROUTE';
  readonly routeType: 'PRIMARY_ASTAR' | 'ALTERNATIVE';
  readonly waypoints: ReadonlyArray<[number, number]>;
  readonly distanceKm: number;
  readonly durationMins: number;
  readonly fuelLiters: number;
  readonly avoidedHazards: ReadonlyArray<string>;
}

export interface IncidentFeature extends BaseFeature {
  readonly type: 'INCIDENT';
  readonly incidentType: 'SAR_DRIFT' | 'SECURITY_ALERT' | 'DISTRESS_BEACON';
  readonly severity: 'HIGH' | 'CRITICAL' | 'MODERATE';
  readonly searchRadiusKm?: number;
  readonly description: string;
}

export type MapFeature =
  | VesselFeature
  | VectorZoneFeature
  | H3CellFeature
  | RouteFeature
  | IncidentFeature;