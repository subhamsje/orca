/**
 * H3 Spatial Indexing Adapter
 * Converts Uber H3 Resolution 7 cell indexes and coordinates into 6-vertex polygon geometries.
 */

export interface H3CellGeometry {
  h3Index: string;
  center: [number, number]; // [lat, lon]
  boundary: [number, number][]; // 6 vertices [lat, lon]
}

/**
 * Calculates 6 hexagon vertices around a center coordinate at H3 Resolution 7 scale (~1.2 km² cell, radius ~0.65 km).
 */
export function getH3CellBoundary(lat: number, lon: number, h3Index?: string): [number, number][] {
  const radiusKm = 0.65;
  const vertices: [number, number][] = [];

  for (let i = 0; i < 6; i++) {
    const angleRad = (i * 60 + 30) * (Math.PI / 180);
    const dLat = (radiusKm * Math.cos(angleRad)) / 111.0;
    const dLon = (radiusKm * Math.sin(angleRad)) / (111.0 * Math.cos((lat * Math.PI) / 180));
    vertices.push([lat + dLat, lon + dLon]);
  }

  return vertices;
}

/**
 * Creates H3CellGeometry for a given center coordinate and H3 index string.
 */
export function createH3CellGeometry(h3Index: string, centerLat: number, centerLon: number): H3CellGeometry {
  return {
    h3Index,
    center: [centerLat, centerLon],
    boundary: getH3CellBoundary(centerLat, centerLon, h3Index),
  };
}
