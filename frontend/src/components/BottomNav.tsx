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
  accent: 'cyan' | 'purple' | 'red' | 'amber';
}

const TABS: TabDescriptor[] = [
  { key: 'today', label: "Today's Trip", short: 'Today', Icon: ShieldCheck, accent: 'cyan' },
  { key: 'chart', label: 'Living Map', short: 'Map', Icon: Compass, accent: 'cyan' },
  { key: 'ask', label: 'Ask ORCA', short: 'Ask', Icon: Mic, accent: 'cyan' },
  { key: 'authority', label: 'Authority', short: 'CG', Icon: Radio, accent: 'red' },
  { key: 'osint', label: 'OSINT Hub', short: 'OSINT', Icon: Eye, accent: 'purple' },
  { key: 'diagnostics', label: 'Diagnostics', short: 'Diag', Icon: Activity, accent: 'amber' },
];

interface BottomNavProps {
  active: TabKey;
  onSelect: (key: TabKey) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ active, onSelect }) => {
  return (
    <nav
      aria-label="Primary Navigation"
      className="fixed bottom-0 inset-x-0 z-50 bg-ocean-950/95 backdrop-blur-xl border-t border-ocean-800/80 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
    >
      <ul
        role="tablist"
        aria-orientation="horizontal"
        className="max-w-5xl mx-auto grid grid-cols-6 px-2 py-2 gap-1.5"
      >
        {TABS.map(({ key, label, short, Icon }) => {
          const isActive = active === key;
          return (
            <li key={key} role="presentation" className="min-w-0">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelect(key)}
                className={`group w-full flex flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[11px] font-bold transition-all duration-300 relative ${
                  isActive
                    ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-800 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-ocean-900/60'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isActive ? 'scale-110 text-cyan-400' : 'group-hover:scale-105'
                  }`}
                  aria-hidden="true"
                />
                <span className="hidden sm:inline truncate w-full text-center tracking-tight">
                  {label}
                </span>
                <span className="sm:hidden truncate w-full text-center">{short}</span>

                {/* Active Indicator Glow Pill */}
                {isActive && (
                  <span className="absolute -top-1 w-6 h-1 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export { TABS as BOTTOM_NAV_TABS };