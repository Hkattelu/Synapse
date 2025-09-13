import React from 'react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  inline?: boolean;
  className?: string;
}

const sizeMap: Record<
  NonNullable<LoadingSpinnerProps['size']>,
  { spinner: string; gap: string; text: string; border: string }
> = {
  xs: {
    spinner: 'w-4 h-4 border-2',
    gap: 'gap-1',
    text: 'text-xs',
    border: 'border-t-transparent',
  },
  sm: {
    spinner: 'w-5 h-5 border-2',
    gap: 'gap-2',
    text: 'text-sm',
    border: 'border-t-transparent',
  },
  md: {
    spinner: 'w-8 h-8 border-4',
    gap: 'gap-3',
    text: 'text-sm',
    border: 'border-t-transparent',
  },
  lg: {
    spinner: 'w-10 h-10 border-4',
    gap: 'gap-3',
    text: 'text-base',
    border: 'border-t-transparent',
  },
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label,
  size = 'sm',
  inline = false,
  className = '',
}) => {
  const s = sizeMap[size];
  const content = (
    <div
      className={`flex items-center ${s.gap} ${inline ? '' : 'justify-center'} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`${s.spinner} rounded-full border-synapse-primary/60 border-l-synapse-primary ${s.border} animate-spin`}
      />
      {label && (
        <span className={`text-text-secondary ${s.text}`}>{label}</span>
      )}
    </div>
  );

  if (inline) return content;
  return (
    <div className="w-full h-full flex items-center justify-center">
      {content}
    </div>
  );
};
