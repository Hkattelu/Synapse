import React, { useState } from 'react';
import YouTrackFeatures from './YouTrackFeatures';
import type { TimelineItem, ItemProperties } from '../lib/types';

export function YouTrackDemo() {
  const [demoItem, setDemoItem] = useState<TimelineItem>({
    id: 'demo-you-item',
    assetId: 'demo-you-asset',
    track: 3,
    type: 'video',
    src: '/demo-talking-head.mp4', // Demo video file
    startTime: 0,
    duration: 30,
    properties: {
      talkingHeadEnabled: false,
      talkingHeadCorner: 'bottom-right',
      talkingHeadSize: 'md',
      backgroundRemoval: false,
      backgroundBlur: 0,
      volume: 0.8
    },
    animations: [],
    keyframes: []
  });

  const handleUpdateProperties = (properties: Partial<ItemProperties>) => {
    setDemoItem(prev => ({
      ...prev,
      properties: {
        ...prev.properties,
        ...properties
      }
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">You Track Features Demo</h1>
        <p className="text-gray-600">
          Explore the personal video features designed for educational content creators.
          This demo showcases talking head detection, picture-in-picture controls, background options, and professional templates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Features Panel */}
        <div className="lg:col-span-2">
          <YouTrackFeatures
            item={demoItem}
            onUpdateProperties={handleUpdateProperties}
            containerSize={{ width: 1920, height: 1080 }}
          />
        </div>

        {/* Properties Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border p-4 sticky top-6">
            <h3 className="text-lg font-semibold mb-3">Current Properties</h3>
            
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-600">Talking Head:</span>
                <span className={demoItem.properties?.talkingHeadEnabled ? 'text-green-600' : 'text-gray-400'}>
                  {demoItem.properties?.talkingHeadEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              
              {demoItem.properties?.talkingHeadEnabled && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-600">Position:</span>
                    <span className="text-gray-900">{demoItem.properties?.talkingHeadCorner}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-600">Size:</span>
                    <span className="text-gray-900">{demoItem.properties?.talkingHeadSize}</span>
                  </div>
                </>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-600">Background Removal:</span>
                <span className={demoItem.properties?.backgroundRemoval ? 'text-green-600' : 'text-gray-400'}>
                  {demoItem.properties?.backgroundRemoval ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              
              {demoItem.properties?.backgroundBlur && demoItem.properties.backgroundBlur > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-600">Background Blur:</span>
                  <span className="text-gray-900">{Math.round(demoItem.properties.backgroundBlur * 100)}%</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-600">Volume:</span>
                <span className="text-gray-900">{Math.round((demoItem.properties?.volume || 0.8) * 100)}%</span>
              </div>
              
              {demoItem.properties?.presentationTemplate && (
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-600">Template:</span>
                  <span className="text-blue-600">{demoItem.properties.presentationTemplate}</span>
                </div>
              )}
            </div>
            
            {/* JSON Preview */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                View JSON Properties
              </summary>
              <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(demoItem.properties, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Talking Head Detection</h3>
          <p className="text-sm text-gray-600">
            Automatically detect and optimize personal video content for educational presentations.
          </p>
        </div>

        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Picture-in-Picture</h3>
          <p className="text-sm text-gray-600">
            Flexible positioning and sizing controls for optimal video composition.
          </p>
        </div>

        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Background Options</h3>
          <p className="text-sm text-gray-600">
            Remove, blur, or replace backgrounds for professional-looking presentations.
          </p>
        </div>

        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Professional Templates</h3>
          <p className="text-sm text-gray-600">
            Pre-designed layouts and overlays for polished educational content.
          </p>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">How to Use You Track Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">Getting Started</h3>
            <ol className="space-y-2 text-blue-700">
              <li>1. Add a personal video to the You track</li>
              <li>2. The system will automatically detect talking head content</li>
              <li>3. Apply optimizations based on detection results</li>
              <li>4. Customize picture-in-picture settings as needed</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">Best Practices</h3>
            <ul className="space-y-2 text-blue-700">
              <li>• Use good lighting for better face detection</li>
              <li>• Record at 720p or higher resolution</li>
              <li>• Keep yourself centered in the frame</li>
              <li>• Use professional templates for consistent branding</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default YouTrackDemo;