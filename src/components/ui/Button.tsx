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
    'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    outline:
      'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-blue-500',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-6 py-3 text-base rounded-md',
    icon: 'p-2 rounded-md',
  };

  const classes = `${baseClass} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};
