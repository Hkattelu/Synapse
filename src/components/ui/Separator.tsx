import React from 'react';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export const Separator: React.FC<SeparatorProps> = ({
  orientation = 'horizontal',
  className = '',
  ...props
}) => {
  const baseClass = 'bg-gray-200';
  const orientationClass = orientation === 'vertical' ? 'w-px' : 'h-px w-full';

  return (
    <div
      className={`${baseClass} ${orientationClass} ${className}`}
      {...props}
    />
  );
};
