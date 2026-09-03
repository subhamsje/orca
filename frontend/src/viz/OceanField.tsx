import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import {
  EnvironmentalVisualizationState,
  hasLiveOcean,
} from './envState';
import {
  VisualizationConfig,
  configForTier,
  QualityTier,
} from './vizConfig';
import {
  rgbaString,
  waveRamp,
  windRamp,
  currentRamp,
  riskRamp,
  normaliseWaveHeight,
  normaliseWindSpeed,
  normaliseCurrentSpeed,
  normaliseRisk,
} from './colorRamps';

/**
 * OceanField — the single canvas overlay that paints:
  *   1. Wave-propagation particles (from swell direction)
  *   2. Wind particle streaks (from 10 m wind)
  *   3. Current particle advection (from surface current)
  *   4. Risk-field radial gradient (when risk score is available)
 *
 * The canvas is sized to the Leaflet container, redrawn on `move`/`zoom`,
 * and only animates when there is at least one real env value. If the
 * backend is offline, the canvas renders an explicit "DATA UNAVAILABLE"
 * pill instead of inventing particles.
 */

interface OceanFieldProps {
  env: EnvironmentalVisualizationState;
  tier: QualityTier;
  reducedMotion: boolean;
  /** Override the config (useful for the legend tester). */
  configOverride?: Partial<VisualizationConfig>;
}

const currentRampLocal = (t: number): readonly [number, number, number, number] => {
  const c = currentRamp(t);
  return [c[0], c[1], c[2], c[3]];
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  seed: number;
}

interface LayerParticles {
  list: Particle[];
  /** Length of fade-out trail in pixels. */
  trail: number;
  /** Meters-per-pixel scaling factor at current zoom — pre-computed. */
  speedScale: number;
  /** Stroke colour. */
  stroke: string;
}

function degToVec(deg: number): { dx: number; dy: number } {
  // Meteorological "from" → vector *towards* (we render particles
  // moving *in* the direction the wind/wave is going).
  const rad = ((deg + 180) % 360) * (Math.PI / 180);
  return { dx: Math.sin(rad), dy: -Math.cos(rad) };
}

function seedParticles(count: number, w: number, h: number, speedScale: number, dirRad: number, baseSpeed: number): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = dirRad + (Math.random() - 0.5) * 0.6; // small spread
    const speed = baseSpeed * (0.7 + Math.random() * 0.6) * speedScale;
    out.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: Math.sin(angle) * speed,
      vy: -Math.cos(angle) * speed,
      life: Math.random(),
      seed: Math.random() * 1000,
    });
  }
  return out;
}

export const OceanField: React.FC<OceanFieldProps> = ({
  env,
  tier,
  reducedMotion,
  configOverride,
}) => {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const boundsRef = useRef<L.LatLngBounds | null>(null);
  const config = useMemo<VisualizationConfig>(
    () => ({ ...configForTier(tier, reducedMotion), ...configOverride }),
    [tier, reducedMotion, configOverride],
  );

  // Stop animation entirely if no live data; do not fabricate particles.
  const hasAnyData =
    hasLiveOcean(env) ||
    env.windSpeed.value != null ||
    env.currentSpeed.value != null ||
    env.risk.score != null;
  const showRiskField = config.riskFieldEnabled && env.risk.score != null;

  // ---- Setup canvas & sizing -----------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = map.getContainer();
    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    const onMove = () => {
      boundsRef.current = map.getBounds();
    };
    map.on('move zoom moveend zoomend', onMove);
    onMove();
    return () => {
      ro.disconnect();
      map.off('move zoom moveend zoomend', onMove);
    };
  }, [map]);

  // ---- Animation loop -------------------------------------------------
  useEffect(() => {
    if (!hasAnyData) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let waveLayer: LayerParticles | null = null;
    let windLayer: LayerParticles | null = null;
    let currentLayer: LayerParticles | null = null;

    // Zoom-aware meters/pixel scale. At zoom z, a Mercator tile is
    // ~ 156543 m / 2^z per pixel.
    const metresPerPixel = () => (156543.03392 * Math.cos((map.getCenter().lat * Math.PI) / 180)) / Math.pow(2, map.getZoom());

    const setupLayer = (
      enabled: boolean,
      speedValue: number | null,
      dirDeg: number | null,
      count: number,
      rampFn: (t: number) => readonly [number, number, number, number],
      normaliseFn: (v: number | null) => number,
    ): LayerParticles | null => {
      if (!enabled) return null;
      if (speedValue == null || dirDeg == null) return null;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const mpp = metresPerPixel();
      const baseSpeedPx = Math.max(0.4, (speedValue * 1000) / 3600 / mpp); // m/s → px/s
      const dirRad = ((dirDeg + 180) % 360) * (Math.PI / 180);
      const list = seedParticles(count, w, h, 1, dirRad, baseSpeedPx);
      const t = normaliseFn(speedValue);
      const c = rampFn(t);
      return {
        list,
        trail: 18,
        speedScale: 1,
        stroke: `rgba(${c[0].toFixed(0)},${c[1].toFixed(0)},${c[2].toFixed(0)},${Math.max(0.18, c[3]).toFixed(2)})`,
      };
    };

    const teardown = () => {
      waveLayer = null;
      windLayer = null;
      currentLayer = null;
    };

    const drawRiskField = () => {
      if (!showRiskField) return;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const centre = map.latLngToContainerPoint([env.vessel.lat, env.vessel.lon]);
      const radiusPx = Math.max(60, Math.min(w, h) * 0.42);
      const t = normaliseRisk(env.risk.score);
      const c = riskRamp(t);
      const grad = ctx.createRadialGradient(centre.x, centre.y, radiusPx * 0.05, centre.x, centre.y, radiusPx);
      grad.addColorStop(0, rgbaString([c[0], c[1], c[2], c[3] * config.riskFieldOpacity]));
      grad.addColorStop(0.55, rgbaString([c[0], c[1], c[2], c[3] * 0.35 * config.riskFieldOpacity]));
      grad.addColorStop(1, rgbaString([c[0], c[1], c[2], 0]));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(centre.x, centre.y, radiusPx, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawParticles = (layer: LayerParticles, dt: number) => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = layer.stroke;
      ctx.lineCap = 'round';
      for (const p of layer.list) {
        p.life += dt * 0.4;
        const nx = p.x + p.vx * dt;
        const ny = p.y + p.vy * dt;
        // wrap horizontally with margin so trails look continuous
        const margin = 24;
        if (nx < -margin) p.x = w + margin;
        else if (nx > w + margin) p.x = -margin;
        else p.x = nx;
        if (ny < -margin) p.y = h + margin;
        else if (ny > h + margin) p.y = -margin;
        else p.y = ny;
        const len = layer.trail * (0.6 + 0.4 * Math.sin(p.seed + p.life * 2));
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * len * 0.04, p.y - p.vy * len * 0.04);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const rebuildLayers = () => {
      waveLayer = setupLayer(
        config.swellFieldEnabled,
        env.swellPeriod.value ?? env.wavePeriod.value,
        env.swellDirection.value ?? env.windDirection.value,
        config.maxWaveParticles,
        (t) => waveRamp(normaliseWaveHeight(env.waveHeight.value) * 0.5 + t * 0.5),
        (v) => Math.min(1, (v ?? 0) / 18),
      );
      windLayer = setupLayer(
        config.windFieldEnabled,
        env.windSpeed.value,
        env.windDirection.value,
        config.maxWindParticles,
        (t) => {
          const c = windRamp(t);
          return [c[0], c[1], c[2], c[3]];
        },
        normaliseWindSpeed,
      );
      currentLayer = setupLayer(
        config.currentFieldEnabled,
        env.currentSpeed.value,
        env.currentDirection.value,
        config.maxCurrentParticles,
        currentRampLocal,
        normaliseCurrentSpeed,
      );
    };

    rebuildLayers();
    lastFrameRef.current = performance.now();

    const tick = (now: number) => {
      const last = lastFrameRef.current;
      const dt = Math.min(0.05, (now - last) / 1000);
      lastFrameRef.current = now;
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      drawRiskField();
      if (waveLayer) drawParticles(waveLayer, dt);
      if (windLayer) drawParticles(windLayer, dt);
      if (currentLayer) drawParticles(currentLayer, dt);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    const onMoveEnd = () => {
      rebuildLayers();
    };
    map.on('moveend zoomend', onMoveEnd);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      map.off('moveend zoomend', onMoveEnd);
      teardown();
    };
  }, [map, env, config, hasAnyData, showRiskField]);

  if (!hasAnyData) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[400]"
      aria-hidden="true"
      data-testid="ocean-field-canvas"
    />
  );
};

OceanField.displayName = 'OceanField';