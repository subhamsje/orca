import React from 'react';
import { Card } from './Card';
import { Spinner } from './Spinner';

interface LoadingStateProps {
  label?: string;
  description?: string;
  variant?: 'inline' | 'panel';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Loading…',
  description,
  variant = 'inline',
}) => {
  if (variant === 'panel') {
    return (
      <Card padding="lg" role="status" aria-live="polite">
        <div className="flex flex-col items-center text-center gap-2">
          <Spinner size="md" />
          <p className="text-sm font-semibold text-white">{label}</p>
          {description && <p className="text-xs text-ink-muted">{description}</p>}
        </div>
      </Card>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 text-xs text-ink-muted"
    >
      <Spinner size="sm" />
      <span>{label}</span>
    </div>
  );
};