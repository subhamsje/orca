import React from 'react';
import { Activity, Compass, Eye, Mic, Radio, ShieldCheck } from 'lucide-react';

export type TabKey = 'today' | 'chart' | 'ask' | 'authority' | 'osint' | 'diagnostics';

interface TabDescriptor {
  key: TabKey; label: string; short: string;
  Icon: React.ComponentType<{ className?: string }>; accent: string;
}

const TABS: TabDescriptor[] = [
  { key: 'today', label: "Today's Trip", short: 'Today', Icon: ShieldCheck, accent: 'cyan' },
  { key: 'chart', label: 'Living Map', short: 'Map', Icon: Compass, accent: 'cyan' },
  { key: 'ask', label: 'Ask ORCA', short: 'Ask', Icon: Mic, accent: 'cyan' },
  { key: 'authority', label: 'Authority', short: 'CG', Icon: Radio, accent: 'red' },
  { key: 'osint', label: 'OSINT Hub', short: 'OSINT', Icon: Eye, accent: 'purple' },
  { key: 'diagnostics', label: 'Diagnostics', short: 'Diag', Icon: Activity, accent: 'amber' },
];

interface BottomNavProps { active: TabKey; onSelect: (key: TabKey) => void; }

export const BottomNav: React.FC<BottomNavProps> = ({ active, onSelect }) => (
  <nav aria-label="Primary Navigation"
    className="fixed bottom-0 inset-x-0 z-50 glass-dark border-t border-cyan-500/10 shadow-[0_-8px_40px_rgba(0,0,0,0.6)]"
  >
    <ul role="tablist" aria-orientation="horizontal" className="max-w-5xl mx-auto grid grid-cols-6 px-2 py-2 gap-1">
      {TABS.map(({ key, label, short, Icon }) => {
        const isActive = active === key;
        return (
          <li key={key} role="presentation" className="min-w-0">
            <button type="button" role="tab" aria-selected={isActive}
              onClick={() => onSelect(key)}
              className={`group relative w-full flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-[10px] font-bold transition-all duration-300 ${
                isActive
                  ? 'glass-card text-cyan-300 border-cyan-700/40 neon-glow-cyan'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-ocean-900/40'
              }`}
            >
              {/* Active glow pill */}
              {isActive && (
                <span className="absolute -top-1 w-8 h-1 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600 shadow-[0_0_12px_#22d3ee]" />
              )}
              <Icon className={`w-5 h-5 transition-all duration-300 ${
                isActive ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'group-hover:scale-105'
              }`} aria-hidden="true" />
              <span className="hidden sm:inline truncate w-full text-center tracking-tight">{label}</span>
              <span className="sm:hidden truncate w-full text-center">{short}</span>
              {/* Active radial glow underneath */}
              {isActive && (
                <span className="absolute inset-0 rounded-xl bg-gradient-radial from-cyan-500/10 to-transparent pointer-events-none" />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  </nav>
);

export { TABS as BOTTOM_NAV_TABS };