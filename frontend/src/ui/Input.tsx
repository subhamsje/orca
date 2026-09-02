import React, { useId } from 'react';
import { tokens } from '../design/tokens';

type InputSize = 'sm' | 'md';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  inputSize?: InputSize;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const SIZE_CLASSES: Record<InputSize, string> = {
  sm: 'text-xs py-1.5 pl-7 pr-3 rounded-md',
  md: 'text-sm py-2 pl-9 pr-3 rounded-lg',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      inputSize = 'md',
      leadingIcon,
      trailingIcon,
      id,
      className = '',
      ...rest
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-bold uppercase tracking-wider text-ink-muted"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leadingIcon && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-ink-muted"
            >
              {leadingIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={hint || error ? `${inputId}-desc` : undefined}
            className={[
              'w-full bg-ocean-950 border text-slate-100 outline-none transition',
              'placeholder:text-ink-subtle',
              error
                ? 'border-red-700 focus-visible:ring-red-400 focus:border-red-500'
                : 'border-ocean-800 focus-visible:ring-cyan-400 focus:border-cyan-500',
              tokens.focus.ringClass,
              SIZE_CLASSES[inputSize],
              leadingIcon ? '' : 'pl-3',
              className,
            ].join(' ')}
            {...rest}
          />
          {trailingIcon && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-ink-muted"
            >
              {trailingIcon}
            </span>
          )}
        </div>
        {(hint || error) && (
          <p
            id={`${inputId}-desc`}
            className={`text-[11px] ${error ? 'text-red-300' : 'text-ink-subtle'}`}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';