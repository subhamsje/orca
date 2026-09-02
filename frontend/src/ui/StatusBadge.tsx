import React from 'react';

export type StatusTone = 'safe' | 'caution' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  tone: StatusTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const TONE_CLASSES: Record<StatusTone, string> = {
  safe: 'bg-emerald-950 text-emerald-300 border-emerald-800',
  caution: 'bg-amber-950 text-amber-300 border-amber-800',
  danger: 'bg-red-950 text-red-300 border-red-800',
  info: 'bg-cyan-950 text-cyan-300 border-cyan-800',
  neutral: 'bg-ocean-800 text-slate-200 border-ocean-700',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  tone,
  icon,
  children,
  className = '',
}) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${TONE_CLASSES[tone]} ${className}`}
  >
    {icon}
    {children}
  </span>
);