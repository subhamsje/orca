import {
  Activity,
  Anchor,
  Compass,
  Eye,
  Mic,
  Radio,
  ShieldCheck,
  BarChart3,
  Ship,
  Map as MapIcon,
  Triangle,
  Cpu,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';

export type NavSectionId = 'workspace' | 'operations' | 'platform';

export interface NavItem {
  id: string;
  label: string;
  /** Short label for compact bottom nav (≤6 chars). */
  short: string;
  Icon: LucideIcon;
  /** Section this item belongs to (used by Sidebar grouping). */
  section: NavSectionId;
  /** Whether the route is implemented in the current build. */
  status: 'live' | 'planned';
  /** Optional badge content (e.g. status pill). */
  badge?: string;
}

export interface NavSection {
  id: NavSectionId;
  label: string;
  description?: string;
}

export const NAV_SECTIONS: ReadonlyArray<NavSection> = [
  { id: 'workspace', label: 'Workspace', description: 'Day-to-day operator views' },
  { id: 'operations', label: 'Operations', description: 'Cross-mission operational tooling' },
  { id: 'platform', label: 'Platform', description: 'System, analytics, governance' },
];

/**
 * Full navigation surface. Future ORCA modules appear here in the
 * "planned" state and are not exposed to end-users until implemented.
 * The shell supports them today without faking their content.
 */
export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  // Workspace (live)
  { id: 'today', label: "Today's Trip", short: 'Today', Icon: ShieldCheck, section: 'workspace', status: 'live' },
  { id: 'chart', label: 'Living Map', short: 'Map', Icon: Compass, section: 'workspace', status: 'live' },
  { id: 'ask', label: 'Ask ORCA', short: 'Ask', Icon: Mic, section: 'workspace', status: 'live' },

  // Operations (live)
  { id: 'authority', label: 'Authority', short: 'CG', Icon: Radio, section: 'operations', status: 'live' },
  { id: 'osint', label: 'OSINT Hub', short: 'OSINT', Icon: Eye, section: 'operations', status: 'live' },

  // Platform (live)
  { id: 'diagnostics', label: 'Diagnostics', short: 'Diag', Icon: Activity, section: 'platform', status: 'live' },

  // Future workspace surfaces (planned — not rendered as real screens yet)
  { id: 'vessels', label: 'Vessels', short: 'Vessels', Icon: Ship, section: 'workspace', status: 'planned' },
  { id: 'trips', label: 'Trips', short: 'Trips', Icon: Anchor, section: 'workspace', status: 'planned' },
  { id: 'incidents', label: 'Incidents', short: 'Inc.', Icon: Triangle, section: 'workspace', status: 'planned' },

  // Future operations surfaces (planned)
  { id: 'marine-map', label: 'Marine Map', short: 'Map', Icon: MapIcon, section: 'operations', status: 'planned' },
  { id: 'sar', label: 'SAR', short: 'SAR', Icon: Compass, section: 'operations', status: 'planned' },

  // Future platform surfaces (planned)
  { id: 'analytics', label: 'Analytics', short: 'Stats', Icon: BarChart3, section: 'platform', status: 'planned' },
  { id: 'infrastructure', label: 'Infrastructure', short: 'Infra', Icon: Cpu, section: 'platform', status: 'planned' },
  { id: 'docs', label: 'Documentation', short: 'Docs', Icon: BookOpen, section: 'platform', status: 'planned' },
];

export function liveNavItems(): NavItem[] {
  return NAV_ITEMS.filter((it) => it.status === 'live');
}