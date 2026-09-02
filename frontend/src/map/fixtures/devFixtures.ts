/**
 * ORCA Phase 02 — Development fixtures
 *
 * EVERY entry in this file is a clearly-labeled simulated dataset used
 * for layout/visualisation work while authoritative feeds are offline.
 *
 * Strict rules:
 *  - `isDemoData` is always `true` on emitted features.
 *  - `name` includes the literal token `[DEMO / SIMULATION]`.
 *  - Renderers MUST surface a visible "DEMO" badge on these features.
 *  - Do not import this module from production paths. Use the explicit
 *    `?demoFixtures=1` query flag or a development env guard before
 *    wiring it into the workspace.
 *
 * These fixtures do NOT represent real ORCA intelligence. They exist
 * only so the map can be visually exercised before every backend feed
 * ships.
 */

import { latLngToCell } from 'h3-js';
import {
  MapFeature,
  VesselFeature,
  IncidentFeature,
  VectorZoneFeature,
} from '../types/feature';
import { resolveH3Cell } from '../adapters/h3Adapter';

const FIXTURE_CENTER = { lat: 15.75, lon: 73.15 } as const;

function buildSimulatedAlgalBloomZone(): VectorZoneFeature {
  // Use h3-js to compute the cell index — never invent one — so the
  // geometry is genuinely H3-derived even though the dataset is
  // simulated.
  const h3Index = latLngToCell(FIXTURE_CENTER.lat, FIXTURE_CENTER.lon, 6);
  const resolved = resolveH3Cell(h3Index, {
    id: 'demo_algal_bloom_zone',
    name: '[DEMO / SIMULATION] Harmful algal bloom hazard',
    state: 'WARNING',
    freshness: 'RECENT',
    lastUpdatedText: 'Simulated MODIS chlorophyll anomaly',
    source: 'ORCA development fixture',
  });
  return {
    id: resolved.feature.id,
    type: 'ZONE',
    name: resolved.feature.name,
    position: resolved.center,
    state: resolved.feature.state,
    freshness: resolved.feature.freshness,
    zoneType: 'MARINE_RESERVE',
    polygonCoordinates: resolved.boundary,
    radiusKm: 6,
    lastUpdatedText: resolved.feature.lastUpdatedText,
    source: resolved.feature.source,
    isDemoData: true,
  };
}

export const DEMO_SIMULATION_FEATURES: ReadonlyArray<MapFeature> = [
  // 1. Unregistered dark-vessel contact (simulated SAR detection)
  {
    id: 'demo_dark_vessel_01',
    type: 'VESSEL',
    name: '[DEMO / SIMULATION] Unregistered dark vessel contact',
    vesselId: 'SIM-DARK-001',
    position: [FIXTURE_CENTER.lat + 0.37, FIXTURE_CENTER.lon + 0.13],
    headingDeg: 195,
    speedKnots: 11.2,
    vesselType: 'DARK_TRAWLER',
    state: 'CRITICAL',
    freshness: 'RECENT',
    riskScore: 95,
    lengthM: 28,
    callSign: 'UNREGISTERED',
    lastUpdatedText: 'Simulated Sentinel-1 SAR radar match',
    source: 'ORCA development fixture',
    isDemoData: true,
  } as VesselFeature,

  // 2. Simulated coast guard patrol (not real AIS data)
  {
    id: 'demo_patrol_vessel_cg',
    type: 'VESSEL',
    name: '[DEMO / SIMULATION] Coast guard patrol (placeholder)',
    vesselId: 'SIM-CG-001',
    position: [FIXTURE_CENTER.lat + 0.10, FIXTURE_CENTER.lon + 0.25],
    headingDeg: 310,
    speedKnots: 18,
    vesselType: 'PATROL_VESSEL',
    state: 'NORMAL',
    freshness: 'LIVE',
    riskScore: 5,
    lengthM: 45,
    callSign: 'SIM-CG-1',
    lastUpdatedText: 'Simulated AIS mesh',
    source: 'ORCA development fixture',
    isDemoData: true,
  } as VesselFeature,

  // 3. Simulated SAR drift centroid
  {
    id: 'demo_sar_drift_centroid',
    type: 'INCIDENT',
    name: '[DEMO / SIMULATION] SAR drift particle centroid',
    position: [FIXTURE_CENTER.lat + 0.248, FIXTURE_CENTER.lon + 0.460],
    state: 'HIGH_RISK',
    freshness: 'LIVE',
    incidentType: 'SAR_DRIFT',
    severity: 'HIGH',
    searchRadiusKm: 0.94,
    description:
      'Simulated stokes drift + wind leeway Monte Carlo particle centroid for development.',
    source: 'ORCA development fixture',
    lastUpdatedText: 'Simulated 5 mins ago',
    isDemoData: true,
  } as IncidentFeature,

  // 4. Simulated algal-bloom zone with genuine H3 geometry
  buildSimulatedAlgalBloomZone(),
];

/**
 * Whether demo fixtures should render in the current session. The flag is
 * opt-in so production builds never accidentally show simulated data.
 */
export function shouldRenderDemoFeatures(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    new URLSearchParams(window.location.search).get('demoFixtures') === '1' ||
    import.meta.env.DEV === true
  );
}