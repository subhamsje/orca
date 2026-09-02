import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
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
  success:
    'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/60 focus-visible:ring-emerald-400',
  warning:
    'bg-amber-600 hover:bg-amber-500 text-white border-amber-500/60 focus-visible:ring-amber-400',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-3.5 py-2 rounded-xl gap-2',
  lg: 'text-sm px-4 py-2.5 rounded-xl gap-2',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      leadingIcon,
      trailingIcon,
      fullWidth = false,
      className = '',
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={[
          'inline-flex items-center justify-center font-semibold border transition',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-950',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.98]',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          fullWidth ? 'w-full' : '',
          className,
        ].join(' ')}
        {...rest}
      >
        {leadingIcon}
        {children}
        {trailingIcon}
      </button>
    );
  },
);
Button.displayName = 'Button';