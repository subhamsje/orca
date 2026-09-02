import React from 'react';

interface DataRowProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  /** Renders as a definition list row when wrapped in a parent `<dl>`. */
  as?: 'div' | 'dt' | 'dd';
  className?: string;
}

export const DataRow: React.FC<DataRowProps> = ({
  label,
  value,
  hint,
  className = '',
}) => (
  <div className={['flex items-baseline justify-between gap-3 py-2', className].join(' ')}>
    <span className="text-[11px] uppercase tracking-wider text-ink-muted font-semibold min-w-0 truncate">
      {label}
    </span>
    <span className="text-sm font-semibold text-white text-right min-w-0 truncate">
      {value}
    </span>
    {hint && <span className="sr-only">{hint}</span>}
  </div>
);

interface DataListProps {
  children: React.ReactNode;
  className?: string;
}

export const DataList: React.FC<DataListProps> = ({ children, className = '' }) => (
  <dl className={['divide-y divide-ocean-800', className].join(' ')}>{children}</dl>
);