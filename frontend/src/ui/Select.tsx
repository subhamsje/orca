import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, options, placeholder, id, className = '', ...rest }, ref) => {
    const autoId = useId();
    const selectId = id ?? autoId;

    return (
      <div className="flex flex-col gap-1.5 min-w-0">
        {label && (
          <label
            htmlFor={selectId}
            className="text-[11px] font-bold uppercase tracking-wider text-ink-muted"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={[
              'w-full appearance-none bg-ocean-800 hover:bg-ocean-700 text-slate-100 text-sm font-medium',
              'border border-ocean-700 rounded-lg pl-3 pr-8 py-2 outline-none cursor-pointer transition',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-975',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              className,
            ].join(' ')}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-ocean-900 text-white">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted"
            aria-hidden="true"
          />
        </div>
        {hint && <p className="text-[11px] text-ink-subtle">{hint}</p>}
      </div>
    );
  },
);
Select.displayName = 'Select';