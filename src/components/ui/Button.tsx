import React from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseClass =
    'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-synapse-border-focus focus:ring-offset-synapse-background disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    // Primary/filled
    default:
      'bg-synapse-primary text-synapse-text-inverse hover:bg-synapse-primary-hover active:bg-synapse-primary-active',
    // Outline
    outline:
      'border border-synapse-border bg-synapse-surface text-synapse-text-primary hover:bg-synapse-surface-hover',
    // Ghost
    ghost: 'text-synapse-text-secondary hover:bg-synapse-surface-hover',
  } as const;

  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-6 py-3 text-base rounded-md',
    icon: 'p-2 rounded-md',
  } as const;

  const classes = `${baseClass} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};
