/**
 * ORCA Viewport State & Bounds Domain Model
 */

export interface ViewportState {
  readonly center: [number, number]; // [lat, lon]
  readonly zoom: number;
  readonly bounds?: {
    readonly northEast: [number, number];
    readonly southWest: [number, number];
  };
}

export interface MapSearchQuery {
  readonly query: string;
  readonly searchType?: 'COORDINATE' | 'HARBOR' | 'VESSEL' | 'H3_CELL';
}
