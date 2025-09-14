import React, { useState, useEffect } from 'react';

interface OnboardingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTutorial: () => void;
  onOpenGuide: () => void;
}

const STEPS = [
  {
    title: 'Welcome to the Educational Interface',
    body: 'This simplified view is designed to help you create high-quality educational videos faster with four dedicated tracks: Code, Visual, Narration, and You.',
  },
  {
    title: 'Add Content Quickly',
    body: 'Use the Add Code, Add Video, and Add Assets buttons to start creating. Each workflow provides helpful defaults and guidance.',
  },
  {
    title: 'Smart Track Placement',
    body: 'Drag items from the Media Bin onto the timeline. We’ll suggest the best educational track and warn about mismatches.',
  },
  {
    title: 'Learn by Doing',
    body: 'Start an interactive tour that highlights key areas, or open the Best Practices guide to learn what great educational content looks like.',
  },
];

export function OnboardingDialog({
  isOpen,
  onClose,
  onStartTutorial,
  onOpenGuide,
}: OnboardingDialogProps) {
  const [step, setStep] = useState(0);
  const total = STEPS.length;

  useEffect(() => {
    if (!isOpen) setStep(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-purple-200/60">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {current.title}
              </h2>
              <p className="text-gray-600">
                Step {step + 1} of {total}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close onboarding"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="mt-2 mb-6">
            <p className="text-gray-700 leading-relaxed">{current.body}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {Array.from({ length: total }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-8 rounded-full ${i <= step ? 'bg-purple-600' : 'bg-purple-200'}`}
                />
              ))}
            </div>
            <div className="flex items-center space-x-2">
              {step === 0 ? (
                <button
                  onClick={onOpenGuide}
                  className="px-3 py-2 text-sm rounded-md border border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  Best Practices
                </button>
              ) : (
                <button
                  onClick={() => setStep(Math.max(0, step - 1))}
                  className="px-3 py-2 text-sm rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
              )}

              {step < total - 1 ? (
                <button
                  onClick={() => setStep(Math.min(total - 1, step + 1))}
                  className="px-4 py-2 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700"
                >
                  Next
                </button>
              ) : (
                <>
                  <button
                    onClick={onStartTutorial}
                    className="px-3 py-2 text-sm rounded-md border border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    Start Interactive Tour
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
