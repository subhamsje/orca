import React from 'react';
import { tokens } from '../design/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required for accessibility — describe what the icon does. */
  label: string;
  icon: React.ReactNode;
  variant?: Variant;
  size?: Size;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-500/60 focus-visible:ring-cyan-400',
  secondary:
    'bg-ocean-800 hover:bg-ocean-700 text-slate-100 border-ocean-700 focus-visible:ring-cyan-400',
  ghost:
    'bg-transparent hover:bg-ocean-800/60 text-slate-200 border-transparent focus-visible:ring-cyan-400',
  danger:
    'bg-red-600 hover:bg-red-500 text-white border-red-500/60 focus-visible:ring-red-400',
  warning:
    'bg-amber-600 hover:bg-amber-500 text-white border-amber-500/60 focus-visible:ring-amber-400',
  success:
    'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/60 focus-visible:ring-emerald-400',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'w-7 h-7 rounded-md',
  md: 'w-9 h-9 rounded-lg',
  lg: 'w-11 h-11 rounded-xl',
};

const ICON_SIZE_CLASSES: Record<Size, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, icon, variant = 'secondary', size = 'md', className = '', children, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={[
        'inline-flex items-center justify-center border transition',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-[0.97]',
        tokens.focus.ringClass,
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ].join(' ')}
      {...rest}
    >
      <span aria-hidden="true" className={ICON_SIZE_CLASSES[size]}>
        {icon}
      </span>
      {children}
    </button>
  ),
);
IconButton.displayName = 'IconButton';