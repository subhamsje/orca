import React from 'react';

interface SectionHeaderProps {
  /** Overline / kicker text rendered above the title. */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  level?: 2 | 3;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  icon,
  actions,
  level = 3,
  className = '',
}) => {
  const HeadingTag = (`h${level}` as unknown) as 'h2' | 'h3';
  const titleSize = level === 2 ? 'text-lg' : 'text-sm';

  return (
    <div
      className={[
        'flex flex-wrap items-start justify-between gap-3',
        className,
      ].join(' ')}
    >
      <div className="space-y-1 min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400">
            {eyebrow}
          </p>
        )}
        <HeadingTag
          className={[
            'font-semibold text-white tracking-tight flex items-center gap-2',
            titleSize,
          ].join(' ')}
        >
          {icon}
          <span className="truncate">{title}</span>
        </HeadingTag>
        {description && (
          <p className="text-xs text-ink-muted leading-relaxed">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
};