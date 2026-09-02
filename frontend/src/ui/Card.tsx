import React from 'react';

type CardTone = 'default' | 'subtle' | 'accent';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const TONE_CLASSES: Record<CardTone, string> = {
  default: 'bg-ocean-900 border-ocean-800',
  subtle: 'bg-ocean-925 border-ocean-800/70',
  accent: 'bg-ocean-900 border-ocean-700',
};

const PADDING_CLASSES = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

export const Card: React.FC<CardProps> = ({
  tone = 'default',
  padding = 'md',
  className = '',
  children,
  ...rest
}) => (
  <div
    className={`rounded-2xl border shadow-card ${TONE_CLASSES[tone]} ${PADDING_CLASSES[padding]} ${className}`}
    {...rest}
  >
    {children}
  </div>
);

interface CardHeaderProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  icon,
  badge,
  description,
  className = '',
}) => (
  <div className={`flex flex-wrap items-start justify-between gap-3 ${className}`}>
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
        {icon}
        <span>{title}</span>
      </h3>
      {description && <p className="text-xs text-ink-muted">{description}</p>}
    </div>
    {badge}
  </div>
);