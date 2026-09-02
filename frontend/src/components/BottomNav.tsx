import React from 'react';
import {
  Activity,
  Compass,
  Eye,
  Mic,
  Radio,
  ShieldCheck,
} from 'lucide-react';

export type TabKey =
  | 'today'
  | 'chart'
  | 'ask'
  | 'authority'
  | 'osint'
  | 'diagnostics';

interface TabDescriptor {
  key: TabKey;
  label: string;
  short: string;
  Icon: React.ComponentType<{ className?: string }>;
  /** accent for the active state — only "today" deviates */
  accent: 'cyan' | 'purple' | 'red' | 'amber';
}

const TABS: TabDescriptor[] = [
  { key: 'today', label: "Today's Trip", short: 'Today', Icon: ShieldCheck, accent: 'cyan' },
  { key: 'chart', label: 'Living Map', short: 'Map', Icon: Compass, accent: 'cyan' },
  { key: 'ask', label: 'Ask ORCA', short: 'Ask', Icon: Mic, accent: 'cyan' },
  { key: 'authority', label: 'Authority', short: 'CG', Icon: Radio, accent: 'cyan' },
  { key: 'osint', label: 'OSINT Hub', short: 'OSINT', Icon: Eye, accent: 'purple' },
  { key: 'diagnostics', label: 'Diagnostics', short: 'Diag', Icon: Activity, accent: 'cyan' },
];

interface BottomNavProps {
  active: TabKey;
  onSelect: (key: TabKey) => void;
}

const ACCENT_ACTIVE: Record<TabDescriptor['accent'], string> = {
  cyan: 'text-cyan-400',
  purple: 'text-purple-400',
  red: 'text-red-400',
  amber: 'text-amber-400',
};

export const BottomNav: React.FC<BottomNavProps> = ({ active, onSelect }) => {
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-30 bg-ocean-975/95 backdrop-blur-md border-t border-ocean-800"
    >
      <ul
        role="tablist"
        aria-orientation="horizontal"
        className="max-w-5xl mx-auto grid grid-cols-6 px-1 sm:px-2 py-1.5 gap-1"
      >
        {TABS.map(({ key, label, short, Icon, accent }) => {
          const isActive = active === key;
          return (
            <li key={key} role="presentation" className="min-w-0">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelect(key)}
                className={[
                  'group w-full flex flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-semibold transition',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
                  isActive
                    ? `${ACCENT_ACTIVE[accent]} bg-ocean-800/80`
                    : 'text-ink-muted hover:text-slate-100 hover:bg-ocean-900/60',
                ].join(' ')}
              >
                <Icon
                  className={[
                    'w-4 h-4 sm:w-5 sm:h-5 transition',
                    isActive ? 'scale-110' : '',
                  ].join(' ')}
                  aria-hidden="true"
                />
                <span className="hidden sm:inline truncate w-full text-center">
                  {label}
                </span>
                <span className="sm:hidden truncate w-full text-center">{short}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export { TABS as BOTTOM_NAV_TABS };