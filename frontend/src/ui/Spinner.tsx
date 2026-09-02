import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-[3px]',
};

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => (
  <span
    role="status"
    aria-live="polite"
    className={`inline-block rounded-full border-current border-t-transparent animate-spin ${SIZE_CLASSES[size]} ${className}`}
  />
);

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  height?: string;
  width?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  height = '1rem',
  width = '100%',
  rounded = 'md',
  className = '',
  style,
  ...rest
}) => {
  const roundedClass = {
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-xl',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      aria-hidden="true"
      className={`bg-ocean-800/70 animate-pulse ${roundedClass} ${className}`}
      style={{ height, width, ...style }}
      {...rest}
    />
  );
};