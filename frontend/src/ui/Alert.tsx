import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  ShieldX,
} from 'lucide-react';

type Tone = 'info' | 'success' | 'caution' | 'warning' | 'danger';

interface AlertProps {
  tone: Tone;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
  /** Use compact variant for inline messages. */
  variant?: 'default' | 'compact';
}

const TONE_CLASSES: Record<Tone, string> = {
  info: 'border-cyan-800 bg-cyan-950 text-cyan-100',
  success: 'border-emerald-800 bg-emerald-950 text-emerald-100',
  caution: 'border-amber-800 bg-amber-950 text-amber-100',
  warning: 'border-amber-700 bg-amber-950 text-amber-50',
  danger: 'border-red-800 bg-red-950 text-red-100',
};

const TONE_ICON: Record<Tone, React.ReactNode> = {
  info: <Info className="w-4 h-4" aria-hidden="true" />,
  success: <CheckCircle2 className="w-4 h-4" aria-hidden="true" />,
  caution: <AlertTriangle className="w-4 h-4" aria-hidden="true" />,
  warning: <ShieldAlert className="w-4 h-4" aria-hidden="true" />,
  danger: <ShieldX className="w-4 h-4" aria-hidden="true" />,
};

export const Alert: React.FC<AlertProps> = ({
  tone,
  title,
  description,
  action,
  onDismiss,
  variant = 'default',
}) => {
  const role = tone === 'danger' || tone === 'warning' ? 'alert' : 'status';

  if (variant === 'compact') {
    return (
      <div
        role={role}
        className={[
          'flex items-start gap-2 rounded-lg border p-2.5 text-xs leading-relaxed',
          TONE_CLASSES[tone],
        ].join(' ')}
      >
        <span className="mt-0.5 shrink-0">{TONE_ICON[tone]}</span>
        <div className="flex-1 min-w-0">
          <span className="font-bold">{title}</span>
          {description && <span className="block mt-0.5 opacity-90">{description}</span>}
        </div>
      </div>
    );
  }

  return (
    <div
      role={role}
      className={[
        'rounded-2xl border p-4 flex items-start gap-3',
        TONE_CLASSES[tone],
      ].join(' ')}
    >
      <span className="mt-0.5 shrink-0">{TONE_ICON[tone]}</span>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-bold">{title}</p>
        {description && (
          <p className="text-xs leading-relaxed opacity-90">{description}</p>
        )}
        {action && <div className="pt-1">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-current opacity-70 hover:opacity-100 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-current rounded"
        >
          Dismiss
        </button>
      )}
    </div>
  );
};

export type AlertBannerProps = Omit<AlertProps, 'variant'>;

/** Full-width banner variant for system-wide messages (e.g. demo mode). */
export const AlertBanner: React.FC<AlertBannerProps> = (props) => (
  <div className="px-4">
    <Alert {...props} />
  </div>
);