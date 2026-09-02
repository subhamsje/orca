import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CheckCircle2, Info, AlertTriangle, ShieldAlert, WifiOff, X } from 'lucide-react';
import { IconButton } from './IconButton';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger' | 'offline';

export interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastContextValue {
  notify: (toast: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

const TONE_CLASSES: Record<ToastTone, string> = {
  info: 'border-cyan-800 bg-cyan-950 text-cyan-100',
  success: 'border-emerald-800 bg-emerald-950 text-emerald-100',
  warning: 'border-amber-800 bg-amber-950 text-amber-100',
  danger: 'border-red-800 bg-red-950 text-red-100',
  offline: 'border-slate-700 bg-slate-900 text-slate-200',
};

const TONE_ICON: Record<ToastTone, React.ReactNode> = {
  info: <Info className="w-4 h-4" aria-hidden="true" />,
  success: <CheckCircle2 className="w-4 h-4" aria-hidden="true" />,
  warning: <AlertTriangle className="w-4 h-4" aria-hidden="true" />,
  danger: <ShieldAlert className="w-4 h-4" aria-hidden="true" />,
  offline: <WifiOff className="w-4 h-4" aria-hidden="true" />,
};

interface ToastProviderProps {
  children: React.ReactNode;
  /** Default lifetime in ms for a toast. Defaults to 5000. */
  defaultDurationMs?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  defaultDurationMs = 5000,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      counterRef.current += 1;
      const id = `toast-${counterRef.current}`;
      const duration = toast.durationMs ?? defaultDurationMs;
      const next: Toast = { id, ...toast };
      setToasts((current) => [...current, next]);
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss, defaultDurationMs],
  );

  const ctx = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <ol
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-20 right-3 left-3 sm:left-auto sm:bottom-6 sm:right-6 z-[60] flex flex-col gap-2 max-w-sm mx-auto sm:mx-0"
      >
        {toasts.map((t) => (
          <li
            key={t.id}
            role="status"
            className={[
              'flex items-start gap-3 rounded-xl border shadow-card-lg p-3 animate-in slide-in-from-right-2 fade-in duration-200',
              TONE_CLASSES[t.tone],
            ].join(' ')}
          >
            <span className="mt-0.5 shrink-0">{TONE_ICON[t.tone]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && (
                <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{t.description}</p>
              )}
            </div>
            <IconButton
              label={`Dismiss ${t.title}`}
              icon={<X />}
              variant="ghost"
              size="sm"
              onClick={() => dismiss(t.id)}
              className="-mr-2 -mt-1 text-current opacity-80 hover:opacity-100"
            />
          </li>
        ))}
      </ol>
    </ToastContext.Provider>
  );
};

/** Convenience wrapper for one-off toasts outside React tree (not used now). */
export function useAutoToast(
  trigger: unknown,
  toast: Omit<Toast, 'id'> | null,
) {
  const { notify } = useToast();
  useEffect(() => {
    if (toast) notify(toast);
  }, [trigger]); // eslint-disable-line react-hooks/exhaustive-deps
}