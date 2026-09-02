import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  side?: 'right' | 'bottom';
  width?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  side = 'right',
  width = 'sm:max-w-md',
  footer,
  children,
}) => {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
      previousFocus?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isRight = side === 'right';

  return (
    <div
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={[
          'absolute bg-ocean-975 border-ocean-800 shadow-card-lg outline-none',
          isRight
            ? `top-0 right-0 bottom-0 w-full ${width} border-l animate-in slide-in-from-right-4 fade-in duration-200`
            : 'left-0 right-0 bottom-0 max-h-[85vh] border-t rounded-t-3xl animate-in slide-in-from-bottom-4 fade-in duration-200',
        ].join(' ')}
      >
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

        <div className="p-5 overflow-y-auto h-[calc(100%-9rem)]">{children}</div>

        {footer && (
          <footer className="absolute inset-x-0 bottom-0 px-5 py-4 border-t border-ocean-800 bg-ocean-975/80 backdrop-blur">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};