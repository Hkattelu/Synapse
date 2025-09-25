import React from 'react';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ children, ...props }) => {
  return <div className="select-wrapper">{children}</div>;
};

export const SelectTrigger: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, className = '', ...props }) => {
  return (
    <button
      className={`flex items-center justify-between px-3 py-2 border border-synapse-border rounded-md bg-synapse-surface text-synapse-text-primary hover:bg-synapse-surface-hover focus:outline-none focus:ring-2 focus:ring-synapse-border-focus focus:ring-offset-2 focus:ring-offset-synapse-background ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const SelectValue: React.FC<{ placeholder?: string }> = ({
  placeholder,
}) => {
  return <span className="text-synapse-text-muted">{placeholder}</span>;
};

export const SelectContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="z-10 mt-1 bg-synapse-surface border border-synapse-border rounded-md shadow-synapse-lg">
      {children}
    </div>
  );
};

export const SelectItem: React.FC<{
  value: string;
  children: React.ReactNode;
}> = ({ children, value }) => {
  return (
    <div
      className="px-3 py-2 hover:bg-synapse-surface-hover cursor-pointer text-synapse-text-primary"
      data-value={value}
    >
      {children}
    </div>
  );
};
