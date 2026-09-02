import React, { useEffect, useState } from 'react';
import { Anchor, Bell, ChevronDown, MapPin, Search, UserCircle2 } from 'lucide-react';
import { IconButton } from '../../ui/IconButton';
import { Select } from '../../ui/Select';
import { Tooltip } from '../../ui/Tooltip';
import { OperationalState } from '../../design/states';
import { StatusIndicator } from '../../ui/StatusIndicator';
import { OperationalStateMeta } from '../../design/states';

interface GlobalHeaderProps {
  /** Primary identity / branding zone. */
  productName: string;
  productTagline: string;
  /** e.g. "Operations · Demo Workspace" */
  operationalContext?: string;
  /** Active harbor or sector label (used as the primary context chip). */
  contextLabel?: string;
  contextHint?: string;
  connectivity: OperationalState;
  /** Optional callback for the user menu. */
  onOpenSessionMenu?: () => void;
  /** Optional callback for the notifications panel. */
  onOpenNotifications?: () => void;
  /** Number of unread notifications (drives the badge). */
  notificationCount?: number;
  /** Children rendered into the right-side action area. */
  actions?: React.ReactNode;
}

const OperationalStateMap: Record<OperationalState, OperationalStateMeta['tone']> = {
  NORMAL: 'safe',
  INFO: 'info',
  CAUTION: 'caution',
  WARNING: 'warning',
  HIGH_RISK: 'danger',
  CRITICAL: 'danger',
  OFFLINE: 'offline',
  STALE: 'caution',
  UNKNOWN: 'neutral',
};

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  productName,
  productTagline,
  operationalContext,
  contextLabel,
  contextHint,
  connectivity,
  onOpenSessionMenu,
  onOpenNotifications,
  notificationCount = 0,
  actions,
}) => {
  // Compact class for the inner max-width container — matches shell.
  return (
    <div className="bg-ocean-975/95 backdrop-blur-md border-b border-ocean-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="h-14 flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-cyan-600 p-1.5 rounded-lg text-white shrink-0">
              <Anchor className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-sm font-bold text-white tracking-tight truncate">
                {productName}
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-ink-muted truncate">
                {productTagline}
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center pl-3 ml-1 border-l border-ocean-800 min-w-0">
            {operationalContext && (
              <p className="text-[11px] text-ink-muted truncate">
                {operationalContext}
              </p>
            )}
          </div>

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-2">
            {actions}
            <StatusIndicator state={connectivity} />
          </div>

          <div className="flex items-center gap-1">
            <Tooltip content="Search (coming in Phase 02)">
              <IconButton
                label="Search"
                icon={<Search />}
                variant="ghost"
                size="md"
                aria-disabled="true"
                className="hidden md:inline-flex opacity-60"
                tabIndex={-1}
                onClick={() => {
                  /* Phase 02 — global command palette */
                }}
              />
            </Tooltip>
            <Tooltip
              content={
                notificationCount > 0
                  ? `${notificationCount} unread notification${notificationCount === 1 ? '' : 's'}`
                  : 'Notifications'
              }
            >
              <span className="relative inline-flex">
                <IconButton
                  label="Notifications"
                  icon={<Bell />}
                  variant="ghost"
                  size="md"
                  onClick={onOpenNotifications}
                />
                {notificationCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0.5 right-0.5 inline-flex items-center justify-center min-w-[1rem] h-4 px-1 rounded-full bg-cyan-500 text-[10px] font-bold text-white"
                  >
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </span>
            </Tooltip>
            <Tooltip content="Session menu">
              <IconButton
                label="Session menu"
                icon={<UserCircle2 />}
                variant="ghost"
                size="md"
                onClick={onOpenSessionMenu}
              />
            </Tooltip>
          </div>
        </div>

        {(contextLabel || actions) && (
          <div className="hidden md:flex h-10 items-center justify-between gap-3 -mt-1 pb-2">
            {contextLabel ? (
              <p className="flex items-center gap-1.5 text-xs text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                <span className="font-semibold truncate">{contextLabel}</span>
                {contextHint && (
                  <span className="text-ink-subtle truncate">· {contextHint}</span>
                )}
              </p>
            ) : (
              <span />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Re-exported for downstream consumers
export { Select, ChevronDown };
export type { OperationalState };
export { OperationalStateMap as _toneFor };