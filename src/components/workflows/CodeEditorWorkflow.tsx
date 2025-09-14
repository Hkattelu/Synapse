import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTimeline, useMediaAssets } from '../../state/hooks';
import { useNotifications } from '../../state/notifications';
import { getEducationalTrackByName } from '../../lib/educationalTypes';
import { ContextualHelp } from './ContextualHelp';

interface CodeEditorWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
  onCodeAdded: () => void;
}

interface CodeTemplate {
  id: string;
  name: string;
  language: string;
  code: string;
  description: string;
  category: 'basic' | 'intermediate' | 'advanced';
}

const CODE_TEMPLATES: CodeTemplate[] = [
  {
    id: 'hello-world-js',
    name: 'Hello World (JavaScript)',
    language: 'javascript',
    code: '// Welcome to JavaScript!\nconsole.log("Hello, World!");\n\n// Try modifying this message\nconst message = "Learning is fun!";\nconsole.log(message);',
    description: 'Basic JavaScript introduction',
    category: 'basic',
  },
  {
    id: 'function-js',
    name: 'Function Example (JavaScript)',
    language: 'javascript',
    code: '// Function definition\nfunction greetUser(name) {\n  return `Hello, ${name}! Welcome to coding.`;\n}\n\n// Function call\nconst greeting = greetUser("Student");\nconsole.log(greeting);',
    description: 'JavaScript function demonstration',
    category: 'intermediate',
  },
  {
    id: 'hello-world-python',
    name: 'Hello World (Python)',
    language: 'python',
    code: '# Welcome to Python!\nprint("Hello, World!")\n\n# Try modifying this message\nmessage = "Learning Python is awesome!"\nprint(message)',
    description: 'Basic Python introduction',
    category: 'basic',
  },
  {
    id: 'class-python',
    name: 'Class Example (Python)',
    language: 'python',
    code: '# Class definition\nclass Student:\n    def __init__(self, name):\n        self.name = name\n    \n    def introduce(self):\n        return f"Hi, I\'m {self.name}!"\n\n# Create instance\nstudent = Student("Alice")\nprint(student.introduce())',
    description: 'Python class demonstration',
    category: 'intermediate',
  },
  {
    id: 'component-react',
    name: 'React Component',
    language: 'typescript',
    code: 'import React from \'react\';\n\ninterface Props {\n  name: string;\n}\n\nexport function Welcome({ name }: Props) {\n  return (\n    <div className="welcome">\n      <h1>Hello, {name}!</h1>\n      <p>Welcome to React development.</p>\n    </div>\n  );\n}',
    description: 'React component with TypeScript',
    category: 'advanced',
  },
];

const SUPPORTED_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', extension: '.js' },
  { id: 'typescript', name: 'TypeScript', extension: '.ts' },
  { id: 'python', name: 'Python', extension: '.py' },
  { id: 'java', name: 'Java', extension: '.java' },
  { id: 'cpp', name: 'C++', extension: '.cpp' },
  { id: 'html', name: 'HTML', extension: '.html' },
  { id: 'css', name: 'CSS', extension: '.css' },
  { id: 'json', name: 'JSON', extension: '.json' },
];

export function CodeEditorWorkflow({
  isOpen,
  onClose,
  onCodeAdded,
}: CodeEditorWorkflowProps) {
  const { addTimelineItem } = useTimeline();
  const { addMediaAsset } = useMediaAssets();
  const { notify } = useNotifications();

  const [codeContent, setCodeContent] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [codeTitle, setCodeTitle] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + 'px';
    }
  }, [codeContent]);

  // Load template
  const loadTemplate = useCallback((templateId: string) => {
    const template = CODE_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setCodeContent(template.code);
      setSelectedLanguage(template.language);
      setCodeTitle(template.name);
      setSelectedTemplate(templateId);
      setShowTemplates(false);
    }
  }, []);

  // Add code to timeline
  const addCodeToTimeline = useCallback(() => {
    if (!codeContent.trim()) {
      notify({
        type: 'error',
        title: 'Empty Code',
        message: 'Please enter some code content',
      });
      return;
    }

    const codeTrack = getEducationalTrackByName('Code');
    if (!codeTrack) return;

    const title = codeTitle.trim() || `Code Snippet (${selectedLanguage})`;

    const codeAsset = {
      name: title,
      type: 'code' as const,
      url: '',
      duration: Math.max(10, Math.ceil(codeContent.length / 10)), // Dynamic duration based on content
      metadata: {
        fileSize: new Blob([codeContent]).size,
        mimeType: 'text/plain',
        codeContent,
        language: selectedLanguage,
        title,
      },
    };

    const assetId = addMediaAsset(codeAsset);

    addTimelineItem({
      assetId,
      startTime: 0,
      duration: codeAsset.duration,
      track: codeTrack.trackNumber,
      type: 'code',
      properties: {
        ...codeTrack.defaultProperties,
        codeText: codeContent,
        text: codeContent,
        language: selectedLanguage,
        title,
      },
      animations: [],
      keyframes: [],
    });

    notify({
      type: 'success',
      title: 'Code Added',
      message: `${title} added to Code track`,
    });

    onCodeAdded();
    onClose();

    // Reset form
    setCodeContent('');
    setCodeTitle('');
    setSelectedTemplate(null);
    setShowTemplates(true);
  }, [
    codeContent,
    selectedLanguage,
    codeTitle,
    addMediaAsset,
    addTimelineItem,
    notify,
    onCodeAdded,
    onClose,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg
              className="w-6 h-6 text-white"
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
            <h2 className="text-xl font-bold text-white">
              Add Code to Timeline
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
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

        <div className="flex h-[600px]">
          {/* Templates Sidebar */}
          {showTemplates && (
            <div className="w-80 bg-gray-700 border-r border-gray-600 overflow-y-auto flex flex-col">
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Code Templates
                </h3>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {CODE_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => loadTemplate(template.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedTemplate === template.id
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-gray-600 border-gray-500 text-gray-200 hover:bg-gray-500'
                      }`}
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm opacity-75 mt-1">
                        {template.description}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs px-2 py-1 bg-gray-800 rounded">
                          {template.language}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            template.category === 'basic'
                              ? 'bg-green-600'
                              : template.category === 'intermediate'
                                ? 'bg-yellow-600'
                                : 'bg-red-600'
                          }`}
                        >
                          {template.category}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="w-full mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Start from Scratch
                </button>

                {/* Contextual Help */}
                <div className="mt-4">
                  <ContextualHelp type="code" />
                </div>
              </div>
            </div>
          )}

          {/* Main Editor */}
          <div className="flex-1 flex flex-col">
            {/* Editor Controls */}
            <div className="bg-gray-700 px-6 py-4 border-b border-gray-600">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Code Title
                  </label>
                  <input
                    type="text"
                    value={codeTitle}
                    onChange={(e) => setCodeTitle(e.target.value)}
                    placeholder="Enter a descriptive title for your code"
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!showTemplates && (
                <button
                  onClick={() => setShowTemplates(true)}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  ← Browse Templates
                </button>
              )}
            </div>

            {/* Code Editor */}
            <div className="flex-1 p-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Code Content
              </label>
              <textarea
                ref={textareaRef}
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                placeholder="Enter your code here..."
                className="w-full h-full min-h-[300px] px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white font-mono text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                style={{
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                }}
              />
            </div>

            {/* Footer */}
            <div className="bg-gray-700 px-6 py-4 border-t border-gray-600 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {codeContent.length} characters • Estimated duration:{' '}
                {Math.max(10, Math.ceil(codeContent.length / 10))}s
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addCodeToTimeline}
                  disabled={!codeContent.trim()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add to Timeline
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
