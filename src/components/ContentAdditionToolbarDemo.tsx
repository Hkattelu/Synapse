import React from 'react';
import { ContentAdditionToolbar } from './ContentAdditionToolbar';

/**
 * Demo component to showcase the ContentAdditionToolbar functionality
 * This component demonstrates the educational content addition workflow
 */
export function ContentAdditionToolbarDemo() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Educational Content Addition Toolbar Demo
          </h1>
          <p className="text-gray-300 text-lg">
            This toolbar provides prominent buttons for adding educational
            content types with smart track placement.
          </p>
        </div>

        {/* Demo Toolbar */}
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl">
          <ContentAdditionToolbar />
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Add Code</h3>
            </div>
            <p className="text-gray-300">
              Instantly create code snippets with syntax highlighting.
              Automatically placed on the Code track with educational-focused
              defaults.
            </p>
          </div>

          <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Add Video</h3>
            </div>
            <p className="text-gray-300">
              Choose between screen recordings (Visual track) or talking head
              videos (You track) with smart placement and optimization.
            </p>
          </div>

          <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Add Assets</h3>
            </div>
            <p className="text-gray-300">
              Upload images, graphics, and audio files with automatic
              categorization and appropriate track placement.
            </p>
          </div>
        </div>

        {/* Educational Workflow Guide */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">
            Educational Workflow
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded-full bg-purple-600"></div>
              <span className="text-gray-300">Code → Code Track</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded-full bg-green-600"></div>
              <span className="text-gray-300">
                Screen Recordings → Visual Track
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded-full bg-amber-600"></div>
              <span className="text-gray-300">Audio → Narration Track</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded-full bg-red-600"></div>
              <span className="text-gray-300">Personal Videos → You Track</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
