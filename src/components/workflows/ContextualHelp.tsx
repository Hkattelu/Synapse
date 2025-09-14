import React, { useState } from 'react';

interface ContextualHelpProps {
  type: 'code' | 'video' | 'assets';
  className?: string;
}

interface HelpContent {
  title: string;
  description: string;
  tips: string[];
  bestPractices: string[];
  examples: string[];
}

const HELP_CONTENT: Record<string, HelpContent> = {
  code: {
    title: 'Code Content Best Practices',
    description:
      'Create engaging code demonstrations that help learners understand programming concepts effectively.',
    tips: [
      'Use syntax highlighting to improve readability',
      'Keep code snippets focused on one concept at a time',
      'Add comments to explain complex logic',
      'Use consistent indentation and formatting',
      'Choose appropriate font sizes for video content',
    ],
    bestPractices: [
      'Start with simple examples before complex ones',
      'Show the output or result of code execution',
      'Use meaningful variable and function names',
      'Break long code into smaller, digestible segments',
      'Highlight changes when showing code evolution',
    ],
    examples: [
      'Function definitions with clear examples',
      'Step-by-step algorithm implementations',
      'Before/after code refactoring demonstrations',
      'API usage examples with real data',
      'Error handling and debugging scenarios',
    ],
  },
  video: {
    title: 'Video Content Guidelines',
    description:
      'Create professional educational videos that engage learners and effectively demonstrate concepts.',
    tips: [
      'Ensure good lighting and clear audio quality',
      'Use a clean, distraction-free background',
      'Maintain consistent framing and positioning',
      'Speak clearly and at an appropriate pace',
      'Plan your content structure before recording',
    ],
    bestPractices: [
      'Record in segments for easier editing',
      'Use screen recording for software demonstrations',
      'Include talking head segments for personal connection',
      'Provide clear introductions and summaries',
      'Use visual cues to highlight important information',
    ],
    examples: [
      'Software tutorial with step-by-step instructions',
      'Concept explanation with visual aids',
      'Live coding session with commentary',
      'Problem-solving walkthrough',
      'Course introduction and overview',
    ],
  },
  assets: {
    title: 'Educational Assets Guide',
    description:
      'Select and organize visual and audio assets that enhance learning and support your educational content.',
    tips: [
      'Use high-quality images and graphics',
      'Ensure assets are relevant to your content',
      'Maintain consistent visual style',
      'Optimize file sizes for smooth playback',
      'Consider accessibility and color contrast',
    ],
    bestPractices: [
      'Create visual hierarchies with images',
      'Use diagrams to explain complex concepts',
      'Include background music at appropriate volumes',
      'Add sound effects to enhance engagement',
      'Organize assets by topic or lesson',
    ],
    examples: [
      'Flowcharts and process diagrams',
      'Screenshots with annotations',
      'Background music for different moods',
      'Transition sound effects',
      'Reference images and illustrations',
    ],
  },
};

export function ContextualHelp({ type, className = '' }: ContextualHelpProps) {
  const [activeTab, setActiveTab] = useState<'tips' | 'practices' | 'examples'>(
    'tips'
  );
  const content = HELP_CONTENT[type];

  if (!content) return null;

  return (
    <div
      className={`bg-gray-700 rounded-lg border border-gray-600 ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-600">
        <div className="flex items-center space-x-2">
          <svg
            className="w-5 h-5 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-sm font-semibold text-white">{content.title}</h3>
        </div>
        <p className="text-xs text-gray-300 mt-1">{content.description}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-600">
        <button
          onClick={() => setActiveTab('tips')}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === 'tips'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-600'
              : 'text-gray-300 hover:text-white hover:bg-gray-600'
          }`}
        >
          Quick Tips
        </button>
        <button
          onClick={() => setActiveTab('practices')}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === 'practices'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-600'
              : 'text-gray-300 hover:text-white hover:bg-gray-600'
          }`}
        >
          Best Practices
        </button>
        <button
          onClick={() => setActiveTab('examples')}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === 'examples'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-600'
              : 'text-gray-300 hover:text-white hover:bg-gray-600'
          }`}
        >
          Examples
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <ul className="space-y-2">
          {(activeTab === 'tips'
            ? content.tips
            : activeTab === 'practices'
              ? content.bestPractices
              : content.examples
          ).map((item, index) => (
            <li
              key={index}
              className="flex items-start space-x-2 text-xs text-gray-300"
            >
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
