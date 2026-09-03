/**
 * ORCA 4.0 — Scientific colour ramps.
 *
 * Pure utility — no env truth. Each ramp maps a normalised 0..1 input
 * to an RGBA tuple. Used by canvas particle layers, the risk field
 * gradient, and the SST / chlorophyll layers (when data arrives).
 *
 * The ramps are tuned to remain legible on the dark ocean background
 * (rgba(2,10,20,...)) without going neon. They are NOT Tailwind utilities.
 */

export type RGBA = readonly [number, number, number, number];

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function mix(c1: RGBA, c2: RGBA, t: number): RGBA {
  return [
    lerp(c1[0], c2[0], t),
    lerp(c1[1], c2[1], t),
    lerp(c1[2], c2[2], t),
    lerp(c1[3], c2[3], t),
  ];
}

function ramp(stops: Array<{ t: number; c: RGBA }>, t: number): RGBA {
  const x = Math.max(0, Math.min(1, t));
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (x >= a.t && x <= b.t) {
      const local = (x - a.t) / Math.max(b.t - a.t, 1e-6);
      return mix(a.c, b.c, local);
    }
  }
  return stops[stops.length - 1].c;
}

/** Sea-surface-temperature ramp (cool → warm). */
export const sstRamp = (t: number): RGBA =>
  ramp(
    [
      { t: 0.0, c: [3, 38, 76, 0.75] },
      { t: 0.25, c: [22, 84, 136, 0.7] },
      { t: 0.5, c: [56, 168, 195, 0.65] },
      { t: 0.75, c: [248, 196, 113, 0.65] },
      { t: 1.0, c: [220, 70, 60, 0.75] },
    ],
    t,
  );

/** Wave height ramp (calm → extreme). */
export const waveRamp = (t: number): RGBA =>
  ramp(
    [
      { t: 0.0, c: [120, 200, 220, 0.45] },
      { t: 0.35, c: [110, 180, 200, 0.5] },
      { t: 0.6, c: [240, 200, 90, 0.55] },
      { t: 0.85, c: [240, 130, 60, 0.6] },
      { t: 1.0, c: [220, 60, 60, 0.7] },
    ],
    t,
  );

/** Risk field ramp (safe → danger). */
export const riskRamp = (t: number): RGBA =>
  ramp(
    [
      { t: 0.0, c: [16, 185, 129, 0.0] },
      { t: 0.25, c: [110, 200, 120, 0.18] },
      { t: 0.5, c: [245, 158, 11, 0.32] },
      { t: 0.75, c: [239, 68, 68, 0.45] },
      { t: 1.0, c: [220, 38, 38, 0.6] },
    ],
    t,
  );

/** Chlorophyll ramp (oligotrophic → eutrophic). */
export const chlRamp = (t: number): RGBA =>
  ramp(
    [
      { t: 0.0, c: [4, 20, 40, 0.6] },
      { t: 0.4, c: [40, 130, 160, 0.6] },
      { t: 0.75, c: [120, 220, 120, 0.6] },
      { t: 1.0, c: [240, 220, 60, 0.65] },
    ],
    t,
  );

/** Bathymetry ramp (deep → shallow). */
export const bathymetryRamp = (t: number): RGBA =>
  ramp(
    [
      { t: 0.0, c: [6, 14, 28, 0.7] },
      { t: 0.4, c: [10, 50, 80, 0.55] },
      { t: 0.7, c: [40, 110, 130, 0.45] },
      { t: 0.9, c: [120, 200, 180, 0.35] },
      { t: 1.0, c: [220, 220, 160, 0.25] },
    ],
    t,
  );

/** Wind particle streak ramp (calm → gale). */
export const windRamp = (t: number): RGBA =>
  ramp(
    [
      { t: 0.0, c: [148, 163, 184, 0.18] },
      { t: 0.5, c: [180, 180, 200, 0.32] },
      { t: 0.85, c: [228, 223, 244, 0.55] },
      { t: 1.0, c: [255, 235, 200, 0.65] },
    ],
    t,
  );

/** Current particle streak ramp (slack → strong). */
export const currentRamp = (t: number): RGBA =>
  ramp(
    [
      { t: 0.0, c: [22, 211, 238, 0.18] },
      { t: 0.4, c: [112, 181, 238, 0.5] },
      { t: 0.75, c: [232, 131, 178, 0.62] },
      { t: 1.0, c: [232, 41, 78, 0.7] },
    ],
    t,
  );

export function rgbaString(c: RGBA): string {
  return `rgba(${c[0].toFixed(1)},${c[1].toFixed(1)},${c[2].toFixed(1)},${c[3].toFixed(2)})`;
}

/** Map a numeric env value to a 0..1 normalised position using sensible
 *  physical bounds. Pure UI mapping; not "truth". */
export function normaliseWaveHeight(h: number | null): number {
  if (h == null) return 0;
  return Math.max(0, Math.min(1, h / 4));
}

export function normaliseWindSpeed(kmh: number | null): number {
  if (kmh == null) return 0;
  return Math.max(0, Math.min(1, kmh / 80));
}

export function normaliseCurrentSpeed(ms: number | null): number {
  if (ms == null) return 0;
  return Math.max(0, Math.min(1, ms / 1.5));
}

export function normaliseRisk(score: number | null): number {
  if (score == null) return 0;
  return Math.max(0, Math.min(1, score / 100));
}

export function normaliseSST(c: number | null): number {
  if (c == null) return 0;
  // SST bounds cover frozen (-2) to tropical (35).
  return Math.max(0, Math.min(1, (c + 2) / 37));
}

export function normaliseChlorophyll(mgm3: number | null): number {
  if (mgm3 == null) return 0;
  return Math.max(0, Math.min(1, Math.log10(mgm3 + 0.01) / Math.log10(20)));
}