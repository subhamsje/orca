/**
 * ORCA Phase 02 Map Layer System Domain Model
 *
 * Layers describe what the user wants to see. The map workspace reads
 * these descriptors and forwards enabled state to renderers.
 *
 * IMPORTANT: freshness fields MUST reflect what the data source actually
 * reports. If a feed is unavailable, `freshnessStatus` is `UNKNOWN` and
 * `lastUpdated` is left undefined. The renderer never invents freshness.
 */

export type BaseMapId = 'nautical_dark' | 'satellite_esri' | 'osm_standard';

export type LayerCategory =
  | 'BASE_MAP'
  | 'OPERATIONAL'
  | 'MARINE'
  | 'BOUNDARIES'
  | 'ROUTING'
  | 'ANALYTICS';

export interface MapLayerConfig {
  readonly id: string;
  readonly name: string;
  readonly category: LayerCategory;
  readonly description: string;
  readonly enabled: boolean;
  /** Indicates if a data feed exists for this layer at all. */
  readonly isAvailable: boolean;
  /** Provenance for the layer's data — e.g. "INCOIS", "Sentinel-1 SAR". */
  readonly source?: string;
  /** Last successful refresh reported by the upstream data source. */
  readonly freshnessStatus?: 'LIVE' | 'RECENT' | 'STALE' | 'OFFLINE' | 'UNKNOWN';
  /** Human-readable freshness string from upstream (e.g. "Updated 10 min ago"). */
  readonly lastUpdated?: string;
}

export interface LayerGroupState {
  readonly baseMapId: BaseMapId;
  readonly layers: Record<string, MapLayerConfig>;
}

/**
 * Default layer catalog. Each layer starts UNKNOWN with no lastUpdated.
 * The workspace replaces these with authoritative values once a real
 * data adapter reports.
 */
export const DEFAULT_MAP_LAYERS: Record<string, MapLayerConfig> = {
  active_vessels: {
    id: 'active_vessels',
    name: 'Active Vessels',
    category: 'OPERATIONAL',
    description: 'Vessel positions, speed, and operational risk states',
    enabled: true,
    isAvailable: true,
    source: 'Vessel AIS / ORCA ingest',
    freshnessStatus: 'UNKNOWN',
  },
  incidents_sar: {
    id: 'incidents_sar',
    name: 'Incidents & SAR Alerts',
    category: 'OPERATIONAL',
    description: 'Search & rescue drift centroids and distress alerts',
    enabled: true,
    isAvailable: true,
    source: 'Coast Guard incident feed',
    freshnessStatus: 'UNKNOWN',
  },
  pfz_grounds: {
    id: 'pfz_grounds',
    name: 'Fishing Grounds (PFZ)',
    category: 'MARINE',
    description: 'Potential Fishing Zones derived from ocean bio-thermal feeds',
    enabled: true,
    isAvailable: true,
    source: 'INCOIS OCM-3 / ORCA PFZ',
    freshnessStatus: 'UNKNOWN',
  },
  ocean_hazards: {
    id: 'ocean_hazards',
    name: 'Environmental Hazards',
    category: 'MARINE',
    description: 'Algal blooms, oil slicks, and high swell surge areas',
    enabled: false,
    isAvailable: true,
    source: 'NASA MODIS / ORCA environmental',
    freshnessStatus: 'UNKNOWN',
  },
  imbl_boundary: {
    id: 'imbl_boundary',
    name: 'IMBL & EEZ Lines',
    category: 'BOUNDARIES',
    description: 'International Maritime Boundary Line & 12NM coastal baseline',
    enabled: true,
    isAvailable: false,
    source: 'Authoritative hydrographic dataset (not yet integrated)',
    freshnessStatus: 'UNKNOWN',
  },
  naval_zones: {
    id: 'naval_zones',
    name: 'Restricted Naval Zones',
    category: 'BOUNDARIES',
    description: 'Naval exercise buffers and military exclusion zones',
    enabled: true,
    isAvailable: false,
    source: 'Authoritative defence gazette (not yet integrated)',
    freshnessStatus: 'UNKNOWN',
  },
  planned_route: {
    id: 'planned_route',
    name: 'Primary A* Route',
    category: 'ROUTING',
    description: 'Cost-weighted route from the ORCA trip assessment',
    enabled: true,
    isAvailable: true,
    source: 'ORCA routing engine',
    freshnessStatus: 'UNKNOWN',
  },
  h3_grid: {
    id: 'h3_grid',
    name: 'H3 Spatial Grid',
    category: 'ANALYTICS',
    description: 'Uber H3 cells carrying HSI / vessel-count intelligence',
    enabled: false,
    isAvailable: false,
    source: 'Backend H3 pipeline (not yet integrated)',
    freshnessStatus: 'UNKNOWN',
  },
  dark_fleet_sar: {
    id: 'dark_fleet_sar',
    name: 'Dark Fleet SAR Detections',
    category: 'ANALYTICS',
    description: 'Sentinel-1 C-Band SAR radar cross-section detections',
    enabled: false,
    isAvailable: false,
    source: 'ESA Sentinel-1 / dark fleet pipeline',
    freshnessStatus: 'UNKNOWN',
  },
};

export const DEFAULT_BASE_MAP: BaseMapId = 'osm_standard';