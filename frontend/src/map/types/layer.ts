/**
 * ORCA Phase 02 Map Layer System Domain Model
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
  readonly isAvailable: boolean; // Indicates if data feed is available vs offline/unavailable
  readonly freshnessStatus?: 'LIVE' | 'RECENT' | 'STALE' | 'OFFLINE' | 'UNKNOWN';
  readonly lastUpdated?: string;
}

export interface LayerGroupState {
  readonly baseMapId: BaseMapId;
  readonly layers: Record<string, MapLayerConfig>;
}

export const DEFAULT_MAP_LAYERS: Record<string, MapLayerConfig> = {
  // Operational
  active_vessels: {
    id: 'active_vessels',
    name: 'Active Vessels',
    category: 'OPERATIONAL',
    description: 'Vessel positions, speed, and operational risk states',
    enabled: true,
    isAvailable: true,
    freshnessStatus: 'LIVE',
    lastUpdated: '10s ago',
  },
  incidents_sar: {
    id: 'incidents_sar',
    name: 'Incidents & SAR Alerts',
    category: 'OPERATIONAL',
    description: 'Search & rescue drift centroids and distress alerts',
    enabled: true,
    isAvailable: true,
    freshnessStatus: 'LIVE',
    lastUpdated: '2m ago',
  },

  // Marine
  pfz_grounds: {
    id: 'pfz_grounds',
    name: 'Fishing Grounds (PFZ)',
    category: 'MARINE',
    description: 'Potential Fishing Zones & HSI suitability contours',
    enabled: true,
    isAvailable: true,
    freshnessStatus: 'RECENT',
    lastUpdated: '15m ago',
  },
  ocean_hazards: {
    id: 'ocean_hazards',
    name: 'Environmental Hazards',
    category: 'MARINE',
    description: 'Algal blooms, oil slicks, and high swell surge areas',
    enabled: false,
    isAvailable: true,
    freshnessStatus: 'RECENT',
    lastUpdated: '1h ago',
  },

  // Boundaries
  imbl_boundary: {
    id: 'imbl_boundary',
    name: 'IMBL & EEZ Lines',
    category: 'BOUNDARIES',
    description: 'International Maritime Boundary Line & 12NM coastal baseline',
    enabled: true,
    isAvailable: true,
    freshnessStatus: 'LIVE',
    lastUpdated: 'Static Hydrographic',
  },
  naval_zones: {
    id: 'naval_zones',
    name: 'Restricted Naval Zones',
    category: 'BOUNDARIES',
    description: 'Naval Range Area B-4 and military exercise buffers',
    enabled: true,
    isAvailable: true,
    freshnessStatus: 'LIVE',
    lastUpdated: 'Static Hydrographic',
  },

  // Routing
  planned_route: {
    id: 'planned_route',
    name: 'Primary A* Route',
    category: 'ROUTING',
    description: 'Cost-weighted detour route avoiding restricted zones',
    enabled: true,
    isAvailable: true,
    freshnessStatus: 'LIVE',
    lastUpdated: 'Calculated now',
  },

  // Analytics
  h3_grid: {
    id: 'h3_grid',
    name: 'H3 Spatial Grid (Res 7)',
    category: 'ANALYTICS',
    description: 'Uber H3 spatial indexing cells (~1.2 km² grid cells)',
    enabled: true,
    isAvailable: true,
    freshnessStatus: 'LIVE',
    lastUpdated: 'Generated',
  },
  dark_fleet_sar: {
    id: 'dark_fleet_sar',
    name: 'Dark Fleet SAR Detections',
    category: 'ANALYTICS',
    description: 'Sentinel-1 C-Band SAR radar cross-section detections',
    enabled: false,
    isAvailable: true,
    freshnessStatus: 'RECENT',
    lastUpdated: '3h ago',
  },
};
