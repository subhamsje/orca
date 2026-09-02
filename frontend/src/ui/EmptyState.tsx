import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div
    className={`flex flex-col items-center justify-center text-center py-10 px-4 space-y-3 ${className}`}
  >
    {icon && (
      <div className="bg-ocean-900 border border-ocean-800 p-3 rounded-full text-ink-muted">
        {icon}
      </div>
    )}
    <h4 className="text-sm font-semibold text-white">{title}</h4>
    {description && (
      <p className="text-xs text-ink-muted max-w-sm leading-relaxed">{description}</p>
    )}
    {action}
  </div>
);