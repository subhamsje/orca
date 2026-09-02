import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  ShieldAlert,
  ShieldX,
  WifiOff,
} from 'lucide-react';
import {
  OperationalState,
  OPERATIONAL_STATE_META,
} from '../design/states';

const ICON_BY_KEY: Record<string, React.ComponentType<{ className?: string }>> = {
  'check-circle': CheckCircle2,
  info: Info,
  'alert-triangle': AlertTriangle,
  'alert-octagon': AlertOctagon,
  'shield-alert': ShieldAlert,
  'shield-x': ShieldX,
  'wifi-off': WifiOff,
  clock: Clock,
  'help-circle': HelpCircle,
};

const TONE_CLASSES: Record<OperationalStateMetaTone, string> = {
  safe: 'bg-emerald-950 border-emerald-800 text-emerald-300',
  info: 'bg-cyan-950 border-cyan-800 text-cyan-300',
  caution: 'bg-amber-950 border-amber-800 text-amber-300',
  warning: 'bg-amber-950 border-amber-700 text-amber-200',
  danger: 'bg-red-950 border-red-800 text-red-300',
  neutral: 'bg-ocean-800 border-ocean-700 text-slate-200',
  offline: 'bg-slate-900 border-slate-700 text-slate-300',
};

type OperationalStateMetaTone = 'safe' | 'info' | 'caution' | 'warning' | 'danger' | 'neutral' | 'offline';

const ATTENTION_CLASSES = {
  none: '',
  subtle: 'motion-safe:animate-pulse-soft',
  strong: 'motion-safe:animate-pulse-soft ring-1 ring-current/40',
};

interface StatusIndicatorProps {
  state: OperationalState;
  /** Override the label text shown next to the icon. */
  label?: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  state,
  label,
  size = 'sm',
  showIcon = true,
  className = '',
}) => {
  const meta = OPERATIONAL_STATE_META[state];
  const Icon = ICON_BY_KEY[meta.icon] ?? Info;
  const tone = TONE_CLASSES[meta.tone];

  const sizeClasses =
    size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1.5' : 'text-xs px-2.5 py-1 gap-2';

  const iconClass = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span
      role="status"
      aria-label={`${meta.label}${label ? `: ${label}` : ''}`}
      title={meta.description}
      className={[
        'inline-flex items-center rounded-full border font-bold uppercase tracking-wider',
        tone,
        sizeClasses,
        ATTENTION_CLASSES[meta.attention],
        className,
      ].join(' ')}
    >
      {showIcon && <Icon className={iconClass} aria-hidden="true" />}
      <span>{label ?? meta.label}</span>
    </span>
  );
};