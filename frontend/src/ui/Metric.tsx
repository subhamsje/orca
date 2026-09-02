import React from 'react';

interface MetricProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    value: string;
  };
  hint?: string;
  /** Optional sub-label under the value (e.g. "Updated 2 min ago"). */
  meta?: React.ReactNode;
  align?: 'start' | 'end';
}

const TREND_CLASSES = {
  up: 'text-emerald-300',
  down: 'text-red-300',
  flat: 'text-ink-muted',
};

const TREND_ARROWS = {
  up: '↑',
  down: '↓',
  flat: '·',
};

export const Metric: React.FC<MetricProps> = ({
  label,
  value,
  unit,
  trend,
  hint,
  meta,
  align = 'start',
}) => (
  <div
    className={[
      'flex flex-col gap-1.5 min-w-0',
      align === 'end' ? 'items-end text-right' : 'items-start text-left',
    ].join(' ')}
  >
    <p className="text-[11px] uppercase tracking-wider text-ink-muted font-bold">{label}</p>
    <p className="text-2xl font-bold text-white leading-none truncate">
      {value}
      {unit && (
        <span className="text-sm text-ink-muted font-medium ml-1.5">{unit}</span>
      )}
    </p>
    {(trend || meta || hint) && (
      <p className={['text-[11px]', trend ? TREND_CLASSES[trend.direction] : 'text-ink-subtle'].join(' ')}>
        {trend && (
          <span aria-label={`Trend ${trend.direction} ${trend.value}`}>
            {TREND_ARROWS[trend.direction]} {trend.value}
          </span>
        )}
        {trend && (meta || hint) && ' · '}
        {meta || hint}
      </p>
    )}
  </div>
);