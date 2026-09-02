import React from 'react';
import { AlertOctagon } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

interface ErrorStateProps {
  title?: string;
  error?: unknown;
  description?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}

const defaultTitle = 'Something went wrong';

function describeError(error: unknown): string {
  if (!error) return '';
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred.';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = defaultTitle,
  error,
  description,
  onRetry,
  className = '',
}) => {
  const detail = describeError(error);
  return (
    <Card padding="lg" className={['border-red-900', className].join(' ')} role="alert">
      <div className="flex items-start gap-4">
        <div className="bg-red-950 border border-red-800 p-2 rounded-full text-red-300 shrink-0">
          <AlertOctagon className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {description ? (
            <p className="text-xs text-ink-muted leading-relaxed">{description}</p>
          ) : detail ? (
            <p className="text-xs text-ink-muted leading-relaxed">{detail}</p>
          ) : null}
        </div>
        {onRetry && (
          <Button variant="danger" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    </Card>
  );
};