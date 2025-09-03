import React from 'react';
import { UIModeToggle } from './UIModeToggle';
import { ModeAwareComponent, useFeatureVisibility, useModeClasses } from './ModeAwareComponent';
import { useUI } from '../state/hooks';
import { Settings, Layers, Eye, EyeOff, Code, Video, Image } from 'lucide-react';

export function UIModeDemo() {
  const { ui } = useUI();
  const showAdvancedFeatures = useFeatureVisibility('advanced');
  const showSimplifiedFeatures = useFeatureVisibility('simplified');
  const modeClasses = useModeClasses(
    'bg-gradient-to-r from-blue-500 to-purple-500',
    'bg-gradient-to-r from-gray-700 to-gray-900'
  );

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          UI Mode Switching System Demo
        </h1>
        <p className="text-gray-600 mb-6">
          This demo showcases the UI mode switching system that allows users to toggle between
          simplified and advanced interfaces.
        </p>
        
        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <UIModeToggle />
        </div>
        
        <div className="text-sm text-gray-500 mb-8">
          Current mode: <span className="font-semibold text-purple-600">{ui.mode}</span>
        </div>
      </div>

      {/* Mode-specific content sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Simplified Mode Features */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Layers className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">Simplified Mode</h2>
          </div>
          
          <ModeAwareComponent mode="simplified">
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Educational Content Buttons</h3>
                <div className="flex space-x-2">
                  <button className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">
                    <Code className="w-4 h-4" />
                    <span>Add Code</span>
                  </button>
                  <button className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm">
                    <Video className="w-4 h-4" />
                    <span>Add Video</span>
                  </button>
                  <button className="flex items-center space-x-2 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm">
                    <Image className="w-4 h-4" />
                    <span>Add Assets</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Predefined Tracks</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span>Code Track</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Visual Track</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-4 h-4 bg-amber-500 rounded"></div>
                    <span>Narration Track</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>You Track</span>
                  </div>
                </div>
              </div>
            </div>
          </ModeAwareComponent>
          
          <ModeAwareComponent mode="advanced" fallback={
            <div className="text-gray-500 text-sm italic">
              Switch to simplified mode to see educational features
            </div>
          } />
        </div>

        {/* Advanced Mode Features */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Advanced Mode</h2>
          </div>
          
          <ModeAwareComponent mode="advanced">
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Advanced Controls</h3>
                <div className="space-y-2">
                  <button className="flex items-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-lg text-sm w-full">
                    <Settings className="w-4 h-4" />
                    <span>Keyframe Editor</span>
                  </button>
                  <button className="flex items-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-lg text-sm w-full">
                    <Eye className="w-4 h-4" />
                    <span>Track Groups</span>
                  </button>
                  <button className="flex items-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-lg text-sm w-full">
                    <EyeOff className="w-4 h-4" />
                    <span>Advanced Timeline</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Professional Tools</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>• Custom track configuration</div>
                  <div>• Advanced animation controls</div>
                  <div>• Detailed export settings</div>
                  <div>• Keyboard shortcuts</div>
                </div>
              </div>
            </div>
          </ModeAwareComponent>
          
          <ModeAwareComponent mode="simplified" fallback={
            <div className="text-gray-500 text-sm italic">
              Switch to advanced mode to see professional tools
            </div>
          } />
        </div>
      </div>

      {/* Dynamic styling demo */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Dynamic Styling</h2>
        <div className={`${modeClasses} text-white p-4 rounded-lg text-center`}>
          <p className="font-medium">
            This section changes appearance based on the current mode
          </p>
          <p className="text-sm opacity-90 mt-1">
            {ui.mode === 'simplified' 
              ? 'Simplified mode uses blue/purple gradients' 
              : 'Advanced mode uses gray gradients'
            }
          </p>
        </div>
      </div>

      {/* Feature visibility hooks demo */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Feature Visibility Hooks</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="font-medium text-gray-900 mb-1">Advanced Features</div>
            <div className={`${showAdvancedFeatures ? 'text-green-600' : 'text-red-600'}`}>
              {showAdvancedFeatures ? 'Visible' : 'Hidden'}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="font-medium text-gray-900 mb-1">Simplified Features</div>
            <div className={`${showSimplifiedFeatures ? 'text-green-600' : 'text-red-600'}`}>
              {showSimplifiedFeatures ? 'Visible' : 'Hidden'}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="font-medium text-gray-900 mb-1">Both Mode Features</div>
            <div className="text-green-600">Always Visible</div>
          </div>
        </div>
      </div>

      {/* Implementation notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">Implementation Features</h2>
        <div className="space-y-2 text-sm text-blue-800">
          <div>✅ Mode toggle with smooth animation</div>
          <div>✅ User preference persistence in localStorage</div>
          <div>✅ Mode-aware component rendering</div>
          <div>✅ Feature visibility hooks</div>
          <div>✅ Dynamic CSS class application</div>
          <div>✅ Graceful error handling</div>
          <div>✅ Comprehensive test coverage</div>
        </div>
      </div>
    </div>
  );
}