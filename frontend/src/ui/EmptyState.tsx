import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  /** @deprecated Prefer primaryAction / secondaryAction. Renders as the primary CTA. */
  action?: React.ReactNode;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  primaryAction,
  secondaryAction,
  className = '',
}) => (
  <Card
    padding="lg"
    tone="subtle"
    role="status"
    className={['text-center', className].join(' ')}
  >
    <div className="flex flex-col items-center gap-3">
      <div className="bg-ocean-900 border border-ocean-800 p-3 rounded-full text-ink-muted">
        {icon ?? <Inbox className="w-5 h-5" aria-hidden="true" />}
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {description && (
        <p className="text-xs text-ink-muted leading-relaxed max-w-md">{description}</p>
      )}
      {(action || primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {action}
          {primaryAction && (
            <Button variant="primary" size="sm" onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" size="sm" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  </Card>
);