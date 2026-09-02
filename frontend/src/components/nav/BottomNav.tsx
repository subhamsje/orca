import React from 'react';
import { liveNavItems } from './navManifest';
import { OperationalState } from '../../design/states';
import { tokens } from '../../design/tokens';

export type BottomNavTabId = string;

interface BottomNavProps {
  activeId: BottomNavTabId;
  onSelect: (id: BottomNavTabId) => void;
  /** Optional state for the most important operational condition (added to aria-live). */
  operationalState?: OperationalState;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeId,
  onSelect,
  operationalState,
}) => {
  const items = liveNavItems();

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-30 bg-ocean-975/95 backdrop-blur-md border-t border-ocean-800 lg:hidden"
    >
      {operationalState && operationalState !== 'NORMAL' && (
        <p className="sr-only" aria-live="polite">
          Operational state: {operationalState.replace('_', ' ').toLowerCase()}.
        </p>
      )}
      <ul
        role="tablist"
        aria-orientation="horizontal"
        className="max-w-5xl mx-auto grid px-1 py-1.5 gap-1"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li key={item.id} role="presentation" className="min-w-0">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelect(item.id)}
                className={[
                  'group w-full flex flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-semibold transition',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
                  tokens.focus.ringClass,
                  isActive
                    ? 'text-cyan-400 bg-ocean-900/80'
                    : 'text-ink-muted hover:text-slate-100 hover:bg-ocean-900/60',
                ].join(' ')}
              >
                <item.Icon
                  className={[
                    'w-4 h-4 transition',
                    isActive ? 'scale-110' : '',
                  ].join(' ')}
                  aria-hidden="true"
                />
                <span className="truncate w-full text-center">{item.short}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};