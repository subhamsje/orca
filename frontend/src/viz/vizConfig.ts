/**
 * ORCA 4.0 — Visualization rendering configuration.
 *
 * IMPORTANT: this file holds *rendering parameters only*. No
 * environmental truth (wave height, wind, risk, etc.) is permitted here.
 * Every animated value must derive from the live backend state.
 *
 * Three quality tiers adapt particle / effect counts to device capability.
 * The `reducedMotion` flag turns off the particle advection and dampens
 * motion; it is wired to `prefers-reduced-motion` and to the user's
 * in-app quality setting.
 */

export type QualityTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';

export interface VisualizationConfig {
  /** Maximum canvas particles for ocean-current field. */
  maxCurrentParticles: number;
  /** Maximum canvas particles for wind field. */
  maxWindParticles: number;
  /** Maximum canvas particles for wave-propagation field. */
  maxWaveParticles: number;
  /** Wake-history length (in pixels) behind a moving vessel. */
  maxWakeSamples: number;
  /** Max FPS target; the renderer will throttle if device is slower. */
  targetFps: number;
  /** Whether wave height drives ocean displacement amplitude (Hawaii-style
   * crest exaggeration). 1 = literal, 0 = flat. */
  waveAmplitudeScale: number;
  /** Opacity multiplier for the risk-field gradient. */
  riskFieldOpacity: number;
  /** Foam density threshold; Hs >= this triggers foam particles. */
  foamThresholdMeters: number;
  /** Cloud opacity for the global cloud drift layer. */
  cloudOpacity: number;
  /** Whether to render wake behind moving vessels. */
  wakeEnabled: boolean;
  /** Whether to render the risk gradient halo. */
  riskFieldEnabled: boolean;
  /** Whether to render the swell vector field. */
  swellFieldEnabled: boolean;
  /** Whether to render wind streaks. */
  windFieldEnabled: boolean;
  /** Whether to render current streaks. */
  currentFieldEnabled: boolean;
  /** Reduced-motion fallback. */
  reducedMotion: boolean;
}

const BASE_CONFIG: VisualizationConfig = {
  maxCurrentParticles: 600,
  maxWindParticles: 350,
  maxWaveParticles: 220,
  maxWakeSamples: 220,
  targetFps: 60,
  waveAmplitudeScale: 1.0,
  riskFieldOpacity: 0.55,
  foamThresholdMeters: 2.5,
  cloudOpacity: 0.18,
  wakeEnabled: true,
  riskFieldEnabled: true,
  swellFieldEnabled: true,
  windFieldEnabled: true,
  currentFieldEnabled: true,
  reducedMotion: false,
};

const TIER_PRESETS: Record<QualityTier, VisualizationConfig> = {
  LOW: {
    ...BASE_CONFIG,
    maxCurrentParticles: 120,
    maxWindParticles: 80,
    maxWaveParticles: 60,
    maxWakeSamples: 60,
    targetFps: 30,
    riskFieldOpacity: 0.35,
    cloudOpacity: 0.1,
  },
  MEDIUM: {
    ...BASE_CONFIG,
    maxCurrentParticles: 280,
    maxWindParticles: 180,
    maxWaveParticles: 110,
    maxWakeSamples: 120,
    targetFps: 45,
  },
  HIGH: {
    ...BASE_CONFIG,
    maxCurrentParticles: 600,
    maxWindParticles: 350,
    maxWaveParticles: 220,
    maxWakeSamples: 220,
    targetFps: 60,
  },
  ULTRA: {
    ...BASE_CONFIG,
    maxCurrentParticles: 1100,
    maxWindParticles: 700,
    maxWaveParticles: 380,
    maxWakeSamples: 380,
    targetFps: 60,
    riskFieldOpacity: 0.7,
    cloudOpacity: 0.28,
  },
};

export function configForTier(tier: QualityTier, reducedMotion: boolean): VisualizationConfig {
  const preset = TIER_PRESETS[tier];
  if (!reducedMotion) return preset;
  return {
    ...preset,
    reducedMotion: true,
    maxCurrentParticles: Math.round(preset.maxCurrentParticles * 0.25),
    maxWindParticles: Math.round(preset.maxWindParticles * 0.25),
    maxWaveParticles: Math.round(preset.maxWaveParticles * 0.25),
    maxWakeSamples: Math.round(preset.maxWakeSamples * 0.25),
    targetFps: 30,
  };
}

/**
 * Recommend a quality tier based on a coarse device-capability signal:
 * navigator.deviceMemory, hardwareConcurrency, and UA.
 */
export function recommendQualityTier(): QualityTier {
  if (typeof navigator === 'undefined') return 'MEDIUM';
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  if (cores >= 12 && mem >= 8) return 'ULTRA';
  if (cores >= 8 && mem >= 4) return 'HIGH';
  if (cores >= 4 && mem >= 2) return 'MEDIUM';
  return 'LOW';
}