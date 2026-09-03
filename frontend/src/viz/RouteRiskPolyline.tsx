import React, { useMemo } from 'react';
import { Polyline, Tooltip } from 'react-leaflet';
import type { RouteSegmentRisk } from './envState';

/**
 * RouteRiskPolyline — renders the planned route as a colour-graded
 * polyline where each segment is shaded by its own risk score.
 *
 * NOTE: today the backend exposes a single global risk_score and does
 * not return per-segment risk. We therefore colour every segment with
 * the same value (no fabrication of varying values), and the component
 * already accepts per-segment data so when the backend adds it the UI
 * upgrades without further changes.
 */

interface RouteRiskPolylineProps {
  segmentRisk: RouteSegmentRisk[];
}

const STATE_COLOUR: Record<RouteSegmentRisk['state'], { color: string; weight: number; opacity: number }> = {
  SAFE: { color: '#10b981', weight: 4, opacity: 0.85 },
  CAUTION: { color: '#f59e0b', weight: 5, opacity: 0.9 },
  WARNING: { color: '#fb923c', weight: 6, opacity: 0.92 },
  HIGH_RISK: { color: '#ef4444', weight: 7, opacity: 0.95 },
  CRITICAL: { color: '#dc2626', weight: 8, opacity: 1 },
  UNKNOWN: { color: '#94a3b8', weight: 3, opacity: 0.5 },
};

export const RouteRiskPolyline: React.FC<RouteRiskPolylineProps> = ({ segmentRisk }) => {
  const segments = useMemo(() => {
    if (segmentRisk.length < 2) return [];
    const out: Array<{
      positions: [[number, number], [number, number]];
      style: (typeof STATE_COLOUR)[RouteSegmentRisk['state']];
      risk: RouteSegmentRisk;
      next: RouteSegmentRisk;
    }> = [];
    for (let i = 0; i < segmentRisk.length - 1; i++) {
      const a = segmentRisk[i];
      const b = segmentRisk[i + 1];
      const state = a.state;
      out.push({
        positions: [a.waypoint, b.waypoint],
        style: STATE_COLOUR[state],
        risk: a,
        next: b,
      });
    }
    return out;
  }, [segmentRisk]);

  if (segments.length === 0) return null;

  return (
    <>
      {segments.map((seg, i) => (
        <Polyline
          key={`route-seg-${i}`}
          positions={seg.positions}
          pathOptions={{
            color: seg.style.color,
            weight: seg.style.weight,
            opacity: seg.style.opacity,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: seg.risk.state === 'SAFE' ? undefined : '8,6',
          }}
        >
          <Tooltip direction="top" offset={[0, -4]} opacity={0.95} sticky>
            <div className="text-[10px] font-mono leading-snug">
              <strong>Segment {seg.risk.index} → {seg.next.index}</strong>
              <br />
              Risk: {seg.risk.risk != null ? `${seg.risk.risk.toFixed(0)} / 100` : '—'}
              <br />
              State: {seg.risk.state}
            </div>
          </Tooltip>
        </Polyline>
      ))}
    </>
  );
};

RouteRiskPolyline.displayName = 'RouteRiskPolyline';