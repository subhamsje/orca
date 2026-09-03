import { describe, it, expect } from 'vitest';
import {
  waveRamp,
  windRamp,
  currentRamp,
  riskRamp,
  sstRamp,
  chlRamp,
  bathymetryRamp,
  rgbaString,
  normaliseWaveHeight,
  normaliseWindSpeed,
  normaliseCurrentSpeed,
  normaliseRisk,
  normaliseSST,
  normaliseChlorophyll,
} from '../colorRamps';

describe('colour ramps', () => {
  it('returns RGBA tuples in [0,1] for normalise functions', () => {
    expect(normaliseWaveHeight(null)).toBe(0);
    expect(normaliseWaveHeight(2)).toBeGreaterThan(0);
    expect(normaliseWaveHeight(2)).toBeLessThanOrEqual(1);
    expect(normaliseWaveHeight(99)).toBe(1);
    expect(normaliseWindSpeed(40)).toBeGreaterThan(0.3);
    expect(normaliseCurrentSpeed(0.75)).toBe(0.5);
    expect(normaliseRisk(50)).toBe(0.5);
    expect(normaliseRisk(null)).toBe(0);
    expect(normaliseSST(28)).toBeGreaterThan(0.5);
    expect(normaliseChlorophyll(1)).toBeGreaterThan(0);
  });

  it('ramps interpolate between 0 and 1 without throwing', () => {
    const ramps = [waveRamp, windRamp, currentRamp, riskRamp, sstRamp, chlRamp, bathymetryRamp];
    for (const r of ramps) {
      const a = r(0);
      const b = r(1);
      expect(a.length).toBe(4);
      expect(b.length).toBe(4);
      expect(a[3]).toBeGreaterThanOrEqual(0);
      expect(b[3]).toBeGreaterThanOrEqual(0);
    }
  });

  it('rgbaString produces a valid CSS colour string', () => {
    expect(rgbaString([1, 2, 3, 0.5])).toBe('rgba(1.0,2.0,3.0,0.50)');
  });

  it('riskRamp at 1 is more red than at 0', () => {
    const low = riskRamp(0);
    const high = riskRamp(1);
    expect(high[0]).toBeGreaterThan(low[0]);
  });
});