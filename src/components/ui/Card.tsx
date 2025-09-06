import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-synapse-surface border border-synapse-border rounded-lg shadow-synapse-sm text-synapse-text-primary ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
