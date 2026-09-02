/**
 * ORCA Phase 02 Development & Simulation Fixtures
 * 
 * IMPORTANT: Every simulated dataset in this file is explicitly tagged with
 * `isDemoData: true` and labeled `[DEMO / SIMULATION]`.
 */

import { MapFeature, VesselFeature, IncidentFeature, VectorZoneFeature } from '../types/feature';
import { createH3CellGeometry } from '../adapters/h3Adapter';

export const DEMO_SIMULATION_FEATURES: MapFeature[] = [
  // 1. Dark Fleet Sentinel-1 SAR Radar Matcher Anomaly Contact
  {
    id: 'demo_dark_trawler_01',
    type: 'VESSEL',
    name: '[DEMO / SIMULATION] Unregistered Dark Trawler Contact',
    vesselId: 'SIM-DARK-994',
    position: [16.12, 73.28],
    headingDeg: 195.0,
    speedKnots: 11.2,
    vesselType: 'DARK_TRAWLER',
    state: 'CRITICAL',
    freshness: 'RECENT',
    riskScore: 95,
    lengthM: 28.0,
    callSign: 'UNREGISTERED',
    lastUpdatedText: 'Sentinel-1 C-Band SAR Radar match vs AIS (AIS Off)',
    isDemoData: true,
  } as VesselFeature,

  // 2. Coast Guard Patrol Vessel Contact
  {
    id: 'demo_patrol_vessel_cg',
    type: 'VESSEL',
    name: '[DEMO / SIMULATION] ICGS Samrat (Coast Guard Patrol)',
    vesselId: 'CG-PATROL-01',
    position: [15.85, 73.40],
    headingDeg: 310.0,
    speedKnots: 18.0,
    vesselType: 'PATROL_VESSEL',
    state: 'NORMAL',
    freshness: 'LIVE',
    riskScore: 5,
    lengthM: 45.0,
    callSign: 'ICGS-SAMRAT',
    lastUpdatedText: 'Coast Guard Encrypted AIS Mesh',
    isDemoData: true,
  } as VesselFeature,

  // 3. Search & Rescue 1,000-Particle Monte Carlo Drift Centroid
  {
    id: 'demo_sar_drift_centroid',
    type: 'INCIDENT',
    name: '[DEMO / SIMULATION] SAR Drift Particle Centroid (6h Drift)',
    position: [15.998, 73.610],
    state: 'HIGH_RISK',
    freshness: 'LIVE',
    incidentType: 'SAR_DRIFT',
    severity: 'HIGH',
    searchRadiusKm: 0.94,
    description: 'Stokes drift (0.05m/s) + 3% wind leeway Monte Carlo particle centroid',
    source: '1,000-Particle Monte Carlo SAR Drift Engine',
    lastUpdatedText: 'Simulated 5 mins ago',
    isDemoData: true,
  } as IncidentFeature,

  // 4. Environmental Hazard: Harmful Algal Bloom (HAB) Zone
  {
    id: 'demo_algal_bloom_zone',
    type: 'ZONE',
    name: '[DEMO / SIMULATION] Noctiluca Scintillans Algal Bloom Hazard',
    position: [15.75, 73.15],
    state: 'WARNING',
    freshness: 'RECENT',
    zoneType: 'MARINE_RESERVE',
    polygonCoordinates: createH3CellGeometry('hab_demo', 15.75, 73.15).boundary,
    radiusKm: 6.0,
    lastUpdatedText: 'NASA MODIS Chlorophyll Anomaly Proxy',
    isDemoData: true,
  } as VectorZoneFeature,
];
