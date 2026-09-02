import React from 'react';
import { OperationalState } from '../../design/states';
import { StatusIndicator } from '../../ui/StatusIndicator';

interface SystemStatusBarProps {
  connectivity: OperationalState;
  dataFreshness: OperationalState;
  /** Optional operational state for the system overall. */
  operationalState?: OperationalState;
  /** e.g. "Updated 2 min ago" or "No recent data" */
  dataFreshnessLabel?: string;
  /** Optional custom message rendered alongside the pills. */
  message?: React.ReactNode;
}

/**
 * Slim status strip rendered directly under the header. Uses semantic
 * indicators (icon + label + colour) so colour is never the only signal.
 */
export const SystemStatusBar: React.FC<SystemStatusBarProps> = ({
  connectivity,
  dataFreshness,
  operationalState,
  dataFreshnessLabel,
  message,
}) => (
  <div
    role="region"
    aria-label="System status"
    className="bg-ocean-975 border-b border-ocean-800"
  >
    <div className="max-w-7xl mx-auto px-4 py-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
      <StatusIndicator state={connectivity} label={`Net ${connectivity.toLowerCase()}`} />
      <StatusIndicator
        state={dataFreshness}
        label={dataFreshnessLabel ?? `Data ${dataFreshness.toLowerCase()}`}
      />
      {operationalState && (
        <StatusIndicator
          state={operationalState}
          label={`Ops ${operationalState.replace('_', ' ').toLowerCase()}`}
        />
      )}
      {message && (
        <span className="ml-auto text-ink-muted truncate max-w-full">{message}</span>
      )}
    </div>
  </div>
);