import React, { useEffect, useMemo, useState } from 'react';

interface Tip {
  id: string;
  targetSelector: string;
  title: string;
  body: string;
  offset?: { x: number; y: number };
}

interface HelpTipsOverlayProps {
  active: boolean;
  onClose: () => void;
}

export function HelpTipsOverlay({ active, onClose }: HelpTipsOverlayProps) {
  const [positions, setPositions] = useState<Record<string, DOMRect | null>>(
    {}
  );

  const tips: Tip[] = useMemo(
    () => [
      {
        id: 'add-code',
        targetSelector: '[data-help-id="add-code-btn"]',
        title: 'Add Code',
        body: 'Create a code clip with syntax highlighting and educational animations like typewriter or diff highlight.',
        offset: { x: 0, y: 8 },
      },
      {
        id: 'add-video',
        targetSelector: '[data-help-id="add-video-btn"]',
        title: 'Add Video',
        body: 'Add a screen recording or talking-head clip. Smart placement puts it on the Visual track.',
        offset: { x: 0, y: 8 },
      },
      {
        id: 'add-assets',
        targetSelector: '[data-help-id="add-assets-btn"]',
        title: 'Add Assets',
        body: 'Upload supporting images, audio, or diagrams and drop them onto the right educational track.',
        offset: { x: 0, y: 8 },
      },
      {
        id: 'timeline-mode',
        targetSelector: '[data-help-id="timeline-mode-toggle"]',
        title: 'Simplified vs. Advanced',
        body: 'Switch modes anytime. Simplified focuses on the 4-track educational workflow. Advanced unlocks full timeline controls.',
        offset: { x: 0, y: 8 },
      },
      {
        id: 'snap-toggle',
        targetSelector: '[data-help-id="snap-toggle"]',
        title: 'Snap to Grid',
        body: 'Keep clips aligned for clean pacing. Adjust the grid in settings to match your desired rhythm.',
        offset: { x: 0, y: 8 },
      },
    ],
    []
  );

  useEffect(() => {
    if (!active) return;

    const update = () => {
      const next: Record<string, DOMRect | null> = {};
      for (const tip of tips) {
        const el = document.querySelector(
          tip.targetSelector
        ) as HTMLElement | null;
        next[tip.id] = el ? el.getBoundingClientRect() : null;
      }
      setPositions(next);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(document.body);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    const interval = setInterval(update, 500);

    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
      clearInterval(interval);
    };
  }, [active, tips]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Scrim and Close */}
      <div className="absolute inset-0 bg-black/30" />
      <button
        className="absolute top-4 right-4 z-50 pointer-events-auto px-3 py-2 text-sm rounded-md bg-white text-gray-800 border border-gray-200 shadow"
        onClick={onClose}
      >
        Close Tips
      </button>

      {tips.map((tip) => {
        const rect = positions[tip.id];
        if (!rect) return null;
        const left = rect.left + (tip.offset?.x ?? 0);
        const top = rect.bottom + (tip.offset?.y ?? 0);
        return (
          <div
            key={tip.id}
            className="absolute max-w-sm p-4 rounded-lg shadow-xl bg-white border border-purple-200 text-sm"
            style={{
              left: Math.max(8, left),
              top: Math.min(top, window.innerHeight - 100),
            }}
          >
            <div className="font-semibold text-gray-900 mb-1">{tip.title}</div>
            <div className="text-gray-700 leading-relaxed">{tip.body}</div>
          </div>
        );
      })}
    </div>
  );
}
