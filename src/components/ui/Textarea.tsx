import React from 'react';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea: React.FC<TextareaProps> = ({
  className = '',
  ...props
}) => {
  return (
    <textarea
      className={`w-full px-3 py-2 rounded-md border border-synapse-border bg-synapse-surface text-synapse-text-primary placeholder-synapse-text-muted shadow-synapse-sm focus:outline-none focus:ring-2 focus:ring-synapse-border-focus focus:ring-offset-2 focus:ring-offset-synapse-background resize-vertical ${className}`}
      {...props}
    />
  );
};
