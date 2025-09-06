import React from 'react';

interface StudioLoaderProps {
  progress?: number; // 0-100
  message?: string;
}

export const StudioLoader: React.FC<StudioLoaderProps> = ({ progress = 0, message }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-synapse-background/80 backdrop-blur-sm">
      <div className="w-[min(540px,90vw)] bg-synapse-surface border border-synapse-border rounded-xl p-6 shadow-synapse-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-synapse-primary" />
          <div>
            <div className="text-sm text-text-secondary">Loading</div>
            <div className="text-lg font-semibold text-text-primary">Synapse Studio</div>
          </div>
        </div>
        <div className="h-2 w-full bg-synapse-surface-hover rounded-full overflow-hidden border border-synapse-border">
          <div
            className="h-full bg-synapse-primary transition-all"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-xs text-text-tertiary">
          <span>{message || 'Preparing editor, timeline, and assets…'}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};
