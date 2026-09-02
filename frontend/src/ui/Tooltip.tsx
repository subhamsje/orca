import React, { useId, useState } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const SIDE_CLASSES = {
  top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
  bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
  left: 'right-full mr-2 top-1/2 -translate-y-1/2',
  right: 'left-full ml-2 top-1/2 -translate-y-1/2',
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = 'top',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const id = useId();

  // Clone the child to inject the event handlers + a11y attributes.
  const trigger = React.cloneElement(children, {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
    'aria-describedby': open ? id : undefined,
  } as React.HTMLAttributes<HTMLElement>);

  return (
    <span className="relative inline-flex">
      {trigger}
      {open && (
        <span
          id={id}
          role="tooltip"
          className={[
            'absolute z-50 px-2 py-1 rounded-md text-[11px] font-medium',
            'bg-ocean-975 border border-ocean-700 text-slate-100 shadow-card-lg',
            'pointer-events-none whitespace-nowrap max-w-xs',
            SIDE_CLASSES[side],
            className,
          ].join(' ')}
        >
          {content}
        </span>
      )}
    </span>
  );
};