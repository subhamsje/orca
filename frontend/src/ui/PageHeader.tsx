import React from 'react';

interface PageHeaderProps {
  /** Optional breadcrumb / context strip rendered above the title. */
  context?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional inline status pills (e.g. operational state). */
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  context,
  title,
  description,
  meta,
  actions,
  className = '',
}) => (
  <header className={['space-y-2', className].join(' ')}>
    {context && (
      <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted font-bold">
        {context}
      </p>
    )}
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1 min-w-0">
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-ink-muted leading-relaxed max-w-prose">
            {description}
          </p>
        )}
        {meta && <div className="flex flex-wrap items-center gap-2 pt-1">{meta}</div>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  </header>
);