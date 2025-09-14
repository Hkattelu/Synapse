import React from 'react';

interface StudioLoaderProps {
  progress?: number; // 0-100
  message?: string;
  tasks?: string[];
}

export const StudioLoader: React.FC<StudioLoaderProps> = ({
  progress = 0,
  message,
  tasks,
}) => {
  const pct = Math.max(0, Math.min(100, progress));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-synapse-background/80 backdrop-blur-sm">
      <div className="w-[min(560px,92vw)] bg-synapse-surface border border-synapse-border rounded-xl p-6 shadow-synapse-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-synapse-primary" />
          <div>
            <div className="text-sm text-text-secondary">Loading</div>
            <div className="text-lg font-semibold text-text-primary">Synapse Studio</div>
          </div>
        </div>
        <div className="h-2 w-full bg-synapse-surface-hover rounded-full overflow-hidden border border-synapse-border">
          <div className="h-full bg-synapse-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 flex justify-between text-xs text-text-tertiary">
          <span>{message || 'Preparing editor, timeline, and assets…'}</span>
          <span>{Math.round(pct)}%</span>
        </div>
        {tasks && tasks.length > 0 && (
          <ul className="mt-4 space-y-2">
            {tasks.map((t, i) => {
              const threshold = Math.round(((i + 1) / tasks.length) * 100);
              const done = pct >= threshold;
              return (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span
                    className={`inline-flex w-5 h-5 rounded-full border ${done ? 'bg-synapse-primary border-synapse-primary text-synapse-text-inverse' : 'border-synapse-border text-text-tertiary'}`}
                    aria-hidden
                    style={{ alignItems: 'center', justifyContent: 'center', display: 'inline-flex' }}
                  >
                    {done ? '✓' : ''}
                  </span>
                  <span className={`text-text-${done ? 'primary' : 'secondary'}`}>{t}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
