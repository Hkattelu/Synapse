import React from 'react';

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <label
      className={`text-sm font-medium text-synapse-text-secondary ${className}`}
      {...props}
    >
      {children}
    </label>
  );
};
