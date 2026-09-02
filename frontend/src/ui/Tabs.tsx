import React, { useEffect, useId, useRef, useState } from 'react';

interface TabDescriptor {
  id: string;
  label: React.ReactNode;
  /** Used for tab activation — must match `value`. */
  value: string;
  badge?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: ReadonlyArray<TabDescriptor>;
  value: string;
  onChange: (value: string) => void;
  variant?: 'underline' | 'pill';
  size?: 'sm' | 'md';
  ariaLabel: string;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
};

export const Tabs: React.FC<TabsProps> = ({
  items,
  value,
  onChange,
  variant = 'underline',
  size = 'md',
  ariaLabel,
  className = '',
}) => {
  const baseId = useId();
  const tablistRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(() =>
    Math.max(
      0,
      items.findIndex((it) => it.value === value),
    ),
  );

  useEffect(() => {
    const idx = items.findIndex((it) => it.value === value);
    if (idx >= 0) setFocusedIndex(idx);
  }, [value, items]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (index + 1) % items.length;
      setFocusedIndex(next);
      const button = tablistRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]',
      )[next];
      button?.focus();
      if (!items[next].disabled) onChange(items[next].value);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (index - 1 + items.length) % items.length;
      setFocusedIndex(prev);
      const button = tablistRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]',
      )[prev];
      button?.focus();
      if (!items[prev].disabled) onChange(items[prev].value);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFocusedIndex(0);
      const button = tablistRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]',
      )[0];
      button?.focus();
      if (!items[0].disabled) onChange(items[0].value);
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = items.length - 1;
      setFocusedIndex(last);
      const button = tablistRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]',
      )[last];
      button?.focus();
      if (!items[last].disabled) onChange(items[last].value);
    }
  };

  return (
    <div
      ref={tablistRef}
      role="tablist"
      aria-label={ariaLabel}
      className={[
        'flex items-center gap-1 overflow-x-auto',
        variant === 'underline'
          ? 'border-b border-ocean-800'
          : 'bg-ocean-900 border border-ocean-800 rounded-xl p-1',
        className,
      ].join(' ')}
    >
      {items.map((item, index) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${baseId}-tab-${item.id}`}
            aria-selected={isActive}
            aria-controls={`${baseId}-panel-${item.id}`}
            aria-disabled={item.disabled || undefined}
            tabIndex={isActive ? 0 : focusedIndex === index ? 0 : -1}
            disabled={item.disabled}
            onClick={() => !item.disabled && onChange(item.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={[
              'inline-flex items-center justify-center font-semibold whitespace-nowrap transition rounded-md',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-975',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              SIZE_CLASSES[size],
              variant === 'underline'
                ? isActive
                  ? 'text-white border-b-2 border-cyan-400 -mb-1'
                  : 'text-ink-muted hover:text-slate-100 border-b-2 border-transparent -mb-1'
                : isActive
                  ? 'bg-ocean-800 text-white'
                  : 'text-ink-muted hover:text-slate-100',
            ].join(' ')}
          >
            <span>{item.label}</span>
            {item.badge && <span className="ml-1">{item.badge}</span>}
          </button>
        );
      })}
    </div>
  );
};