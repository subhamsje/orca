import { describe, it, expect } from 'vitest';
import { configForTier, QualityTier } from '../vizConfig';

const TIERS: QualityTier[] = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'];

describe('configForTier', () => {
  it('reduces particle counts monotonically as tier decreases', () => {
    const low = configForTier('LOW', false);
    const med = configForTier('MEDIUM', false);
    const high = configForTier('HIGH', false);
    const ultra = configForTier('ULTRA', false);
    expect(low.maxCurrentParticles).toBeLessThan(med.maxCurrentParticles);
    expect(med.maxCurrentParticles).toBeLessThan(high.maxCurrentParticles);
    expect(high.maxCurrentParticles).toBeLessThan(ultra.maxCurrentParticles);
  });

  it('reduced motion further reduces particle counts and clamps FPS', () => {
    const base = configForTier('HIGH', false);
    const reduced = configForTier('HIGH', true);
    expect(reduced.reducedMotion).toBe(true);
    expect(reduced.maxCurrentParticles).toBeLessThan(base.maxCurrentParticles);
    expect(reduced.targetFps).toBeLessThanOrEqual(30);
  });

  it('returns sane defaults for every tier', () => {
    for (const tier of TIERS) {
      const c = configForTier(tier, false);
      expect(c.maxCurrentParticles).toBeGreaterThan(0);
      expect(c.maxWindParticles).toBeGreaterThan(0);
      expect(c.maxWaveParticles).toBeGreaterThan(0);
      expect(c.targetFps).toBeGreaterThan(0);
      expect(c.foamThresholdMeters).toBeGreaterThan(0);
    }
  });
});