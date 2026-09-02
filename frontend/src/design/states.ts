/**
 * ORCA design system — semantic operational states.
 *
 * IMPORTANT: These are the only states the UI should use to communicate
 * operational condition. Color is never the only carrier — every state
 * must also expose an icon, a label, and (for critical) a screen-reader cue.
 */

export type OperationalState =
  | 'NORMAL'
  | 'INFO'
  | 'CAUTION'
  | 'WARNING'
  | 'HIGH_RISK'
  | 'CRITICAL'
  | 'OFFLINE'
  | 'STALE'
  | 'UNKNOWN';

export interface OperationalStateMeta {
  /** Tailwind utility classes (background + border + foreground). */
  readonly tone: 'safe' | 'info' | 'caution' | 'warning' | 'danger' | 'neutral' | 'offline';
  /** Stable id for the Lucide icon used by StatusIndicator. */
  readonly icon:
    | 'check-circle'
    | 'info'
    | 'alert-triangle'
    | 'alert-octagon'
    | 'shield-alert'
    | 'shield-x'
    | 'wifi-off'
    | 'clock'
    | 'help-circle';
  /** Short label used inline (caps-tracked, uppercase). */
  readonly label: string;
  /** Long-form description for accessibility / aria-description. */
  readonly description: string;
  /** Whether the state should pulse on screen to draw attention. */
  readonly attention: 'none' | 'subtle' | 'strong';
}

export const OPERATIONAL_STATE_META: Record<OperationalState, OperationalStateMeta> = {
  NORMAL: {
    tone: 'safe',
    icon: 'check-circle',
    label: 'Normal',
    description: 'Operating within nominal parameters.',
    attention: 'none',
  },
  INFO: {
    tone: 'info',
    icon: 'info',
    label: 'Info',
    description: 'Informational notice. No action required.',
    attention: 'none',
  },
  CAUTION: {
    tone: 'caution',
    icon: 'alert-triangle',
    label: 'Caution',
    description: 'Conditions warrant attention. Review before action.',
    attention: 'subtle',
  },
  WARNING: {
    tone: 'warning',
    icon: 'alert-triangle',
    label: 'Warning',
    description: 'Material risk detected. Confirm intent before proceeding.',
    attention: 'subtle',
  },
  HIGH_RISK: {
    tone: 'danger',
    icon: 'shield-alert',
    label: 'High Risk',
    description: 'Serious risk. Do not proceed without mitigation.',
    attention: 'strong',
  },
  CRITICAL: {
    tone: 'danger',
    icon: 'shield-x',
    label: 'Critical',
    description: 'Critical condition. Safety override in effect.',
    attention: 'strong',
  },
  OFFLINE: {
    tone: 'offline',
    icon: 'wifi-off',
    label: 'Offline',
    description: 'No network connectivity. Cached data only.',
    attention: 'none',
  },
  STALE: {
    tone: 'caution',
    icon: 'clock',
    label: 'Stale',
    description: 'Data is older than the freshness threshold. Refresh recommended.',
    attention: 'subtle',
  },
  UNKNOWN: {
    tone: 'neutral',
    icon: 'help-circle',
    label: 'Unknown',
    description: 'State cannot be determined. Awaiting data.',
    attention: 'none',
  },
};

/** Map a numeric score (0–100) to an operational state. */
export function riskScoreToState(score: number): OperationalState {
  if (Number.isNaN(score)) return 'UNKNOWN';
  if (score >= 90) return 'CRITICAL';
  if (score >= 75) return 'HIGH_RISK';
  if (score >= 50) return 'WARNING';
  if (score >= 25) return 'CAUTION';
  return 'NORMAL';
}

/** Map ISO timestamp + threshold (ms) to a freshness state. */
export function freshnessToState(
  timestamp: string | number | Date | null | undefined,
  maxAgeMs: number,
): OperationalState {
  if (!timestamp) return 'UNKNOWN';
  const ts = new Date(timestamp).getTime();
  if (Number.isNaN(ts)) return 'UNKNOWN';
  const age = Date.now() - ts;
  if (age < 0) return 'NORMAL';
  if (age > maxAgeMs * 2) return 'STALE';
  if (age > maxAgeMs) return 'CAUTION';
  return 'NORMAL';
}

/** Map navigator.onLine to OFFLINE / NORMAL. */
export function connectivityToState(isOnline: boolean): OperationalState {
  return isOnline ? 'NORMAL' : 'OFFLINE';
}