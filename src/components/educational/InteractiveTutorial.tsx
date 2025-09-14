import React, { useState, useEffect, useRef } from 'react';

interface TutorialStep {
  id: string;
  target: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'hover' | 'type' | 'drag';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    target: '[data-tutorial="timeline-toolbar"]',
    title: 'Welcome to Synapse Studio',
    description:
      'This tutorial will guide you through creating your first educational video using the educational interface.',
    position: 'bottom',
  },
  {
    id: 'add-code',
    target: '[data-tutorial="add-code"]',
    title: 'Add Your First Code Snippet',
    description:
      'Click the Add Code button to create a code clip with syntax highlighting and educational animations.',
    position: 'bottom',
    action: 'click',
  },
  {
    id: 'timeline-tracks',
    target: '[data-tutorial="educational-timeline"]',
    title: 'Four Educational Tracks',
    description:
      'Notice the four specialized tracks: Code (purple), Visual (green), Narration (blue), and You (orange). Each is optimized for different content types.',
    position: 'top',
  },
  {
    id: 'smart-placement',
    target: '[data-tutorial="media-bin"]',
    title: 'Smart Track Placement',
    description:
      "Drag assets from the Media Bin to the timeline. We'll suggest the best educational track based on content type.",
    position: 'left',
    action: 'drag',
  },
  {
    id: 'mode-switch',
    target: '[data-tutorial="mode-toggle"]',
    title: 'Simplified vs Advanced',
    description:
      'Toggle between simplified (educational) and advanced modes based on your workflow needs.',
    position: 'bottom',
  },
  {
    id: 'preview',
    target: '[data-tutorial="preview-area"]',
    title: 'Real-time Preview',
    description:
      'See your educational content rendered in real-time as you build. The preview updates instantly as you make changes.',
    position: 'bottom',
  },
];

interface InteractiveTutorialProps {
  isActive: boolean;
  onComplete: () => void;
  onClose: () => void;
}

export function InteractiveTutorial({
  isActive,
  onComplete,
  onClose,
}: InteractiveTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep >= TUTORIAL_STEPS.length - 1;

  // Update highlight position
  useEffect(() => {
    if (!isActive || !step) return;

    const updateHighlight = () => {
      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        setHighlightRect(element.getBoundingClientRect());
      }
    };

    updateHighlight();

    // Observe changes in the target element
    const element = document.querySelector(step.target) as HTMLElement;
    if (element) {
      observerRef.current = new ResizeObserver(updateHighlight);
      observerRef.current.observe(element);
    }

    // Update on scroll and resize
    window.addEventListener('scroll', updateHighlight, true);
    window.addEventListener('resize', updateHighlight);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      window.removeEventListener('scroll', updateHighlight, true);
      window.removeEventListener('resize', updateHighlight);
    };
  }, [isActive, step]);

  // Handle next step
  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  // Handle skip
  const handleSkip = () => {
    onClose();
  };

  if (!isActive || !step) return null;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!highlightRect) return {};

    const position = step.position || 'bottom';
    const offset = 12;

    switch (position) {
      case 'top':
        return {
          left: highlightRect.left + highlightRect.width / 2,
          top: highlightRect.top - offset,
          transform: 'translate(-50%, -100%)',
        };
      case 'bottom':
        return {
          left: highlightRect.left + highlightRect.width / 2,
          top: highlightRect.bottom + offset,
          transform: 'translate(-50%, 0)',
        };
      case 'left':
        return {
          left: highlightRect.left - offset,
          top: highlightRect.top + highlightRect.height / 2,
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        return {
          left: highlightRect.right + offset,
          top: highlightRect.top + highlightRect.height / 2,
          transform: 'translate(0, -50%)',
        };
      default:
        return {};
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Highlight cutout */}
      {highlightRect && (
        <>
          <div
            className="absolute bg-white rounded-lg shadow-lg"
            style={{
              left: highlightRect.left - 4,
              top: highlightRect.top - 4,
              width: highlightRect.width + 8,
              height: highlightRect.height + 8,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
            }}
          />
        </>
      )}

      {/* Tooltip */}
      <div
        className="absolute pointer-events-auto bg-white rounded-lg shadow-xl border border-purple-200 p-4 max-w-sm z-50"
        style={getTooltipStyle()}
      >
        <div className="mb-2">
          <h3 className="font-semibold text-gray-900 text-sm">{step.title}</h3>
          <div className="text-xs text-gray-500 mt-1">
            Step {currentStep + 1} of {TUTORIAL_STEPS.length}
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-4 leading-relaxed">
          {step.description}
        </p>

        {step.action && (
          <div className="mb-4 px-3 py-2 bg-purple-50 rounded-md border border-purple-200">
            <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">
              {step.action === 'click' && 'Click to continue'}
              {step.action === 'hover' && 'Hover to continue'}
              {step.action === 'type' && 'Type to continue'}
              {step.action === 'drag' && 'Drag an item to continue'}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleSkip}
              className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip Tutorial
            </button>
          </div>

          <button
            onClick={handleNext}
            className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
          >
            {isLastStep ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <div className="bg-white rounded-full px-4 py-2 shadow-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            {TUTORIAL_STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
