import React, { useState } from 'react';
import { CodeEditorWorkflow } from './CodeEditorWorkflow';
import { VideoWorkflow } from './VideoWorkflow';
import { AssetsWorkflow } from './AssetsWorkflow';
import { ContextualHelp } from './ContextualHelp';

export function ContentWorkflowsDemo() {
  const [showCodeWorkflow, setShowCodeWorkflow] = useState(false);
  const [showVideoWorkflow, setShowVideoWorkflow] = useState(false);
  const [showAssetsWorkflow, setShowAssetsWorkflow] = useState(false);
  const [selectedHelp, setSelectedHelp] = useState<'code' | 'video' | 'assets'>('code');

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Educational Content Addition Workflows</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Workflow Buttons */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Content Workflows</h2>
            
            {/* Code Workflow */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <h3 className="text-lg font-semibold text-white">Code Editor Workflow</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Create code snippets with templates, syntax highlighting, and educational guidance.
              </p>
              <button
                onClick={() => setShowCodeWorkflow(true)}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Open Code Workflow
              </button>
            </div>

            {/* Video Workflow */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-white">Video Workflow</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Add videos with type selection, recording tips, and smart track placement.
              </p>
              <button
                onClick={() => setShowVideoWorkflow(true)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Open Video Workflow
              </button>
            </div>

            {/* Assets Workflow */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-white">Assets Workflow</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Upload and categorize educational assets with smart organization and metadata.
              </p>
              <button
                onClick={() => setShowAssetsWorkflow(true)}
                className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Open Assets Workflow
              </button>
            </div>
          </div>

          {/* Contextual Help Demo */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Contextual Help System</h2>
            
            {/* Help Type Selector */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setSelectedHelp('code')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedHelp === 'code'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Code Help
              </button>
              <button
                onClick={() => setSelectedHelp('video')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedHelp === 'video'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Video Help
              </button>
              <button
                onClick={() => setSelectedHelp('assets')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedHelp === 'assets'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Assets Help
              </button>
            </div>

            {/* Help Component */}
            <ContextualHelp type={selectedHelp} />
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-12 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Workflow Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Smart Guidance</h3>
              <p className="text-sm text-gray-300">
                Contextual tips and best practices for each content type
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Templates & Examples</h3>
              <p className="text-sm text-gray-300">
                Pre-built templates and examples to get started quickly
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Auto-Categorization</h3>
              <p className="text-sm text-gray-300">
                Intelligent content placement on appropriate educational tracks
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Modals */}
      <CodeEditorWorkflow
        isOpen={showCodeWorkflow}
        onClose={() => setShowCodeWorkflow(false)}
        onCodeAdded={() => {
          setShowCodeWorkflow(false);
          // In a real app, this would show feedback
        }}
      />
      
      <VideoWorkflow
        isOpen={showVideoWorkflow}
        onClose={() => setShowVideoWorkflow(false)}
        onVideoAdded={() => {
          setShowVideoWorkflow(false);
          // In a real app, this would show feedback
        }}
      />
      
      <AssetsWorkflow
        isOpen={showAssetsWorkflow}
        onClose={() => setShowAssetsWorkflow(false)}
        onAssetsAdded={() => {
          setShowAssetsWorkflow(false);
          // In a real app, this would show feedback
        }}
      />
    </div>
  );
}