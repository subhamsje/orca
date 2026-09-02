/**
 * Map theme — central place for any colour values Leaflet needs.
 *
 * Leaflet's `pathOptions` does NOT understand Tailwind classes, so we
 * keep raw hex values here instead of inlining them across renderers.
 * Keep these aligned with the Tailwind tokens in `tailwind.config.js`
 * (e.g. emerald-400 is `#34d399`, cyan-400 is `#22d3ee`).
 */

import { OperationalState } from '../design/states';

export const MAP_THEME = {
  vessel: {
    NORMAL: '#34d399',
    INFO: '#22d3ee',
    CAUTION: '#fbbf24',
    WARNING: '#f59e0b',
    HIGH_RISK: '#ef4444',
    CRITICAL: '#ef4444',
    OFFLINE: '#64748b',
    STALE: '#94a3b8',
    UNKNOWN: '#94a3b8',
  },
  zone: {
    PFZ_GROUND: '#10b981',
    NAVAL_RESTRICTED: '#ef4444',
    MARINE_RESERVE: '#22d3ee',
    ENVIRONMENTAL_HAZARD: '#f59e0b',
    IMBL: '#f59e0b',
  },
  route: {
    PRIMARY_ASTAR: '#22d3ee',
    ALTERNATIVE: '#a855f7',
  },
  incident: {
    SAR_DRIFT: '#ef4444',
    SECURITY_ALERT: '#f59e0b',
    DISTRESS_BEACON: '#fbbf24',
  },
  selection: '#22d3ee',
} as const;

export function vesselColor(state: OperationalState): string {
  return MAP_THEME.vessel[state] ?? MAP_THEME.vessel.NORMAL;
}