import React from 'react';

export const InspectorSkeleton: React.FC = () => (
  <div className="h-full flex flex-col">
    <div className="p-3 border-b border-synapse-border bg-synapse-surface animate-pulse">
      <div className="h-4 w-24 bg-synapse-surface2 rounded" />
    </div>
    <div className="border-b border-synapse-border bg-synapse-surface animate-pulse">
      <div className="flex">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex-1 px-3 py-2">
            <div className={`h-6 ${i===0?'w-20':'w-16'} bg-synapse-surface2 rounded`} />
          </div>
        ))}
      </div>
    </div>
    <div className="flex-1 overflow-auto p-3 space-y-3 bg-synapse-surface animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border border-synapse-border rounded-lg p-3 space-y-2">
          <div className="h-4 w-32 bg-synapse-surface2 rounded" />
          <div className="h-3 w-3/4 bg-synapse-surface2 rounded" />
          <div className="h-3 w-2/3 bg-synapse-surface2 rounded" />
        </div>
      ))}
    </div>
  </div>
);

export const MediaBinSkeleton: React.FC = () => (
  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 animate-pulse">
    {Array.from({ length: 9 }).map((_, i) => (
      <div key={i} className="aspect-video rounded-lg border border-synapse-border bg-synapse-surface2" />
    ))}
  </div>
);

export const TimelineSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="p-4 space-y-3 animate-pulse">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-6 bg-synapse-surface2 rounded" />
    ))}
  </div>
);