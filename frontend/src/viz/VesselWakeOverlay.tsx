import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import type { EnvironmentalVisualizationState } from './envState';
import type { VisualizationConfig } from './vizConfig';
import { rgbaString } from './colorRamps';

/**
 * VesselWakeOverlay — Canvas that paints a fading wake behind the
 * active vessel. The wake length scales with vessel speed; the wake
 * angle tracks vessel heading; if the vessel is stopped the wake
 * decays gracefully rather than continuing to grow.
 *
 * No values are invented: every property derives from
 * `env.vessel.speedKnots`, `env.vessel.headingDeg`, and the canvas
 * timestamp.
 */

interface VesselWakeOverlayProps {
  env: EnvironmentalVisualizationState;
  config: VisualizationConfig;
}

interface WakeSample {
  x: number;
  y: number;
  born: number;
}

const MAX_SAMPLES_DEFAULT = 220;

export const VesselWakeOverlay: React.FC<VesselWakeOverlayProps> = ({ env, config }) => {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const samplesRef = useRef<WakeSample[]>([]);
  const lastEmitRef = useRef(0);

  const enabled = config.wakeEnabled && !config.reducedMotion;

  useEffect(() => {
    if (!enabled) return;
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
    return () => ro.disconnect();
  }, [map, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let stopped = false;

    const tick = (now: number) => {
      if (stopped) return;
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      const speedKnots = env.vessel.speedKnots ?? 0;
      const heading = env.vessel.headingDeg ?? 0;
      const lat = env.vessel.lat;
      const lon = env.vessel.lon;
      const onScreen = map.getBounds().contains([lat, lon]);
      const maxSamples = Math.min(config.maxWakeSamples, MAX_SAMPLES_DEFAULT);

      if (onScreen && speedKnots > 0.05) {
        const headingRad = ((heading + 180) % 360) * (Math.PI / 180);
        const stern = map.latLngToContainerPoint([
          lat - Math.cos(headingRad) * 0.00012,
          lon - Math.sin(headingRad) * 0.00012 / Math.max(0.2, Math.cos((lat * Math.PI) / 180)),
        ]);
        // Emit one wake sample every ~80 ms while moving
        if (now - lastEmitRef.current > 80) {
          lastEmitRef.current = now;
          samplesRef.current.push({ x: stern.x, y: stern.y, born: now });
          if (samplesRef.current.length > maxSamples) {
            samplesRef.current.splice(0, samplesRef.current.length - maxSamples);
          }
        }
      }

      // Render trail
      const samples = samplesRef.current;
      if (samples.length > 1) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 1; i < samples.length; i++) {
          const a = samples[i - 1];
          const b = samples[i];
          const age = (now - b.born) / 1000;
          const alpha = Math.max(0, 0.35 - age * 0.06);
          if (alpha <= 0) continue;
          ctx.strokeStyle = rgbaString([125, 211, 252, alpha]);
          ctx.lineWidth = Math.max(1.2, 5.5 - i * 0.02);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      samplesRef.current = [];
    };
  }, [map, env.vessel.speedKnots, env.vessel.headingDeg, env.vessel.lat, env.vessel.lon, enabled, config.maxWakeSamples]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[401]"
      aria-hidden="true"
      data-testid="vessel-wake-canvas"
    />
  );
};

VesselWakeOverlay.displayName = 'VesselWakeOverlay';