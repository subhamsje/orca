import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import { tokens } from '../design/tokens';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Initial element to focus when the modal opens. */
  initialFocusRef?: React.RefObject<HTMLElement>;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const SIZE_CLASSES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  initialFocusRef,
  footer,
  children,
}) => {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const fallbackFocusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const focusTarget = initialFocusRef?.current ?? fallbackFocusRef.current;
    focusTarget?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
      previousFocus?.focus?.();
    };
  }, [isOpen, onClose, initialFocusRef]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={[
          'bg-ocean-975 border border-ocean-800 rounded-t-3xl sm:rounded-3xl w-full shadow-card-lg',
          'animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200',
          SIZE_CLASSES[size],
        ].join(' ')}
      >
        <div ref={fallbackFocusRef} tabIndex={-1} className="outline-none" />

        <header className="flex items-start justify-between gap-3 p-5 border-b border-ocean-800">
          <div>
            <h2 id={titleId} className="text-base font-bold text-white">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-[11px] text-ink-muted mt-1">
                {description}
              </p>
            )}
          </div>
          <IconButton
            label={`Close ${title}`}
            icon={<X />}
            variant="ghost"
            size="sm"
            onClick={onClose}
          />
        </header>

        <div className="p-5">{children}</div>

        {footer && (
          <footer className="px-5 py-4 border-t border-ocean-800 bg-ocean-975/50 rounded-b-3xl">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};

// Re-export tokens for the modal consumers
export { tokens as _modalTokens };