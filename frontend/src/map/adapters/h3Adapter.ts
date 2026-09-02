/**
 * ORCA H3 adapter
 *
 * Renders genuine Uber-H3 cells via the official `h3-js` library.
 *
 * RULE: this adapter NEVER invents H3 indexes. Real cell indexes are
 * emitted by the backend H3 pipeline. When no indexes are provided, the
 * H3 layer simply renders nothing — never a placeholder grid.
 *
 * Geometry conversion: `latLngToCell` accepts (lat, lon, resolution) and
 * returns the canonical H3 index for that location. `cellToBoundary`
 * returns the cell's true vertex coordinates which we flip from
 * [lng, lat] (h3-js default) to [lat, lon] for Leaflet.
 */

import { latLngToCell, cellToBoundary, cellToLatLng } from 'h3-js';
import { H3CellFeature } from '../types/feature';

export interface ResolvedH3Cell {
  readonly feature: H3CellFeature;
  readonly h3Index: string;
  readonly center: [number, number];
  readonly boundary: ReadonlyArray<[number, number]>;
}

/**
 * Convert an H3 index to a feature with correct Leaflet-ordered boundary.
 * Throws if the index is malformed — call sites should validate upstream.
 */
export function resolveH3Cell(
  h3Index: string,
  meta: Pick<H3CellFeature, 'id' | 'name' | 'state' | 'freshness' | 'lastUpdatedText' | 'source' | 'hsiValue' | 'vesselCount' | 'anomalyScore'>,
): ResolvedH3Cell {
  // h3-js exports cellToBoundary as [lng, lat] pairs in CCW order.
  const rawBoundary = cellToBoundary(h3Index, true) as unknown as Array<[number, number]>;
  const boundary: ReadonlyArray<[number, number]> = rawBoundary.map(
    ([lng, lat]) => [lat, lng] as [number, number],
  );
  const [centerLng, centerLat] = cellToLatLng(h3Index);
  const resolution = Number(h3Index.charAt(0)) || 0;

  return {
    h3Index,
    center: [centerLat, centerLng],
    boundary,
    feature: {
      ...meta,
      type: 'H3_CELL',
      h3Index,
      resolution,
      cellBoundary: boundary,
      position: [centerLat, centerLng],
    },
  };
}

/**
 * Convenience for adapters: given a center coordinate and resolution,
 * resolve the canonical H3 cell that contains it. Returns `null` for
 * unsupported resolutions.
 */
export function resolveCellFromCenter(
  centerLat: number,
  centerLon: number,
  resolution: number,
  featureMeta: Omit<H3CellFeature, 'position' | 'cellBoundary' | 'h3Index' | 'resolution' | 'type'>,
): ResolvedH3Cell | null {
  if (resolution < 0 || resolution > 15) return null;
  const h3Index = latLngToCell(centerLat, centerLon, resolution);
  return resolveH3Cell(h3Index, {
    id: featureMeta.id,
    name: featureMeta.name,
    state: featureMeta.state,
    freshness: featureMeta.freshness,
    lastUpdatedText: featureMeta.lastUpdatedText,
    source: featureMeta.source,
    hsiValue: featureMeta.hsiValue,
    vesselCount: featureMeta.vesselCount,
    anomalyScore: featureMeta.anomalyScore,
  });
}