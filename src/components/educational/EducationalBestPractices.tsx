import React from 'react';

interface EducationalBestPracticesProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EducationalBestPractices({
  isOpen,
  onClose,
}: EducationalBestPracticesProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 border border-purple-200/60">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Educational Content Best Practices
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close guide"
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

          <div className="space-y-6 text-gray-800">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Structure matters
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Open with a clear goal and why it matters (30–60s).</li>
                <li>Break concepts into small, focused segments.</li>
                <li>Alternate Code and Visual tracks to reinforce learning.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Design for clarity
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Use large fonts and high contrast for code.</li>
                <li>Highlight only the lines you’re discussing.</li>
                <li>Prefer zoom/callouts over busy motion.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Narration tips
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Keep sentences short; avoid filler.</li>
                <li>Pause between steps; let visuals breathe.</li>
                <li>Duck background music under speech by 12–18 dB.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Pacing and timing
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Target 120–150 wpm for technical content.</li>
                <li>Align visual changes to narration beats.</li>
                <li>Use Snap to Grid to keep timing consistent.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Finish strong
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Summarize what was built and learned.</li>
                <li>Show the final result; provide a next step.</li>
                <li>Invite feedback and questions.</li>
              </ul>
            </section>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
