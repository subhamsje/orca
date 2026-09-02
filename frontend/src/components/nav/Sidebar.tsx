import React from 'react';
import { Tooltip } from '../../ui/Tooltip';
import { NAV_ITEMS, NAV_SECTIONS, NavSectionId } from './navManifest';

interface SidebarProps {
  activeId: string;
  onSelect: (id: string) => void;
  /** Footer slot (e.g. sign-out, build hash, version pill). */
  footer?: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeId, onSelect, footer }) => (
  <aside
    aria-label="Primary"
    className="hidden lg:flex w-60 shrink-0 flex-col bg-ocean-975 border-r border-ocean-800"
  >
    <div className="px-4 pt-5 pb-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400 font-bold">
        ORCA · Operations
      </p>
      <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
        Universal Marine Operating System
      </p>
    </div>

    <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-4">
      {NAV_SECTIONS.map((section) => {
        const items = NAV_ITEMS.filter((it) => it.section === section.id);
        if (items.length === 0) return null;
        return (
          <div key={section.id}>
            <p className="px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-ink-subtle font-bold">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const isActive = item.id === activeId;
                const isLive = item.status === 'live';
                return (
                  <li key={item.id}>
                    <Tooltip
                      side="right"
                      content={
                        isLive
                          ? item.label
                          : `${item.label} — planned for a future release`
                      }
                    >
                      <button
                        type="button"
                        onClick={() => isLive && onSelect(item.id)}
                        disabled={!isLive}
                        aria-current={isActive ? 'page' : undefined}
                        className={[
                          'group w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
                          isActive
                            ? 'bg-ocean-800 text-white border border-ocean-700'
                            : isLive
                              ? 'text-ink-muted hover:text-slate-100 hover:bg-ocean-900/60 border border-transparent'
                              : 'text-ink-subtle hover:text-ink-muted border border-transparent cursor-not-allowed',
                        ].join(' ')}
                      >
                        <item.Icon
                          className={[
                            'w-4 h-4 shrink-0',
                            isActive ? 'text-cyan-400' : 'text-current opacity-70',
                          ].join(' ')}
                          aria-hidden="true"
                        />
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        {!isLive && (
                          <span
                            className="text-[9px] uppercase tracking-wider font-bold text-ink-subtle"
                            aria-hidden="true"
                          >
                            Soon
                          </span>
                        )}
                      </button>
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>

    {footer && (
      <div className="px-4 py-3 border-t border-ocean-800 text-[11px] text-ink-muted">
        {footer}
      </div>
    )}
  </aside>
);

export type { NavSectionId };