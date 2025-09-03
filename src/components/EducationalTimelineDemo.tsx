import React, { useState } from 'react';
import { EducationalTimeline } from './EducationalTimeline';

export function EducationalTimelineDemo() {
  const [mode, setMode] = useState<'simplified' | 'advanced'>('simplified');

  return (
    <div className="educational-timeline-demo h-screen flex flex-col bg-background-primary">
      <div className="p-4 bg-background-secondary border-b border-border-subtle">
        <h1 className="text-xl font-bold text-text-primary mb-2">
          Educational Timeline Demo
        </h1>
        <p className="text-sm text-text-secondary">
          This demo showcases the Educational Timeline component with fixed 4-track layout,
          smart content placement, and mode switching between simplified and advanced views.
        </p>
        <div className="mt-3 flex items-center space-x-4">
          <span className="text-sm text-text-secondary">Current Mode:</span>
          <span className="text-sm font-medium text-text-primary capitalize">
            {mode}
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <EducationalTimeline 
          mode={mode}
          onModeChange={setMode}
          className="h-full"
        />
      </div>
      
      <div className="p-4 bg-background-secondary border-t border-border-subtle">
        <div className="text-xs text-text-tertiary space-y-1">
          <p><strong>Features demonstrated:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Fixed 4-track layout: Code (purple), Visual (green), Narration (amber), You (red)</li>
            <li>Mode switching between Simplified and Advanced views</li>
            <li>Smart content placement suggestions with drag-and-drop</li>
            <li>Educational track-specific styling and previews</li>
            <li>Integrated zoom controls and snap-to-grid functionality</li>
          </ul>
        </div>
      </div>
    </div>
  );
}