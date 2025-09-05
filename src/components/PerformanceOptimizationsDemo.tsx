import React, { useState, useCallback, useMemo } from 'react';
import { ResponsiveTimeline } from './ResponsiveTimeline';
import { PerformanceMonitor } from './PerformanceMonitor';
import { useTimelineItemPerformance } from './VirtualizedTimelineItems';
import { useResponsiveBreakpoint, TimelineCalculations } from '../lib/performanceOptimizations';
import { useTimeline } from '../state/hooks';

interface PerformanceOptimizationsDemoProps {
  className?: string;
}

export function PerformanceOptimizationsDemo({ className = '' }: PerformanceOptimizationsDemoProps) {
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  const [itemCount, setItemCount] = useState(50);
  const [enableVirtualization, setEnableVirtualization] = useState(true);
  const [enableLazyLoading, setEnableLazyLoading] = useState(true);
  const [mode, setMode] = useState<'simplified' | 'advanced'>('simplified');

  const { timeline } = useTimeline();
  const breakpoint = useResponsiveBreakpoint();
  
  const performanceMetrics = useTimelineItemPerformance(
    timeline,
    1200, // container width
    1.0   // zoom level
  );

  // Generate mock timeline items for performance testing
  const mockItems = useMemo(() => {
    return Array.from({ length: itemCount }, (_, i) => ({
      id: `mock-item-${i}`,
      assetId: `mock-asset-${i}`,
      startTime: i * 2,
      duration: 1.5,
      track: i % 4,
      type: 'video' as const,
      properties: {},
      animations: [],
      keyframes: [],
    }));
  }, [itemCount]);

  const handleClearCache = useCallback(() => {
    TimelineCalculations.clearCache();
  }, []);

  const handleItemCountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setItemCount(parseInt(e.target.value, 10));
  }, []);

  return (
    <div className={`performance-optimizations-demo ${className}`}>
      {/* Demo Header */}
      <div className="demo-header bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Performance Optimizations Demo</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Breakpoint:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              breakpoint === 'mobile' ? 'bg-red-600 text-white' :
              breakpoint === 'tablet' ? 'bg-yellow-600 text-white' :
              'bg-green-600 text-white'
            }`}>
              {breakpoint}
            </span>
          </div>
        </div>

        {/* Performance Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Item Count Control */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Timeline Items: {itemCount}
            </label>
            <input
              type="range"
              min="10"
              max="500"
              value={itemCount}
              onChange={handleItemCountChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>10</span>
              <span>500</span>
            </div>
          </div>

          {/* Virtualization Toggle */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Virtualization
            </label>
            <button
              onClick={() => setEnableVirtualization(!enableVirtualization)}
              className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                enableVirtualization
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-600 text-gray-300'
              }`}
            >
              {enableVirtualization ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Lazy Loading Toggle */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Lazy Loading
            </label>
            <button
              onClick={() => setEnableLazyLoading(!enableLazyLoading)}
              className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                enableLazyLoading
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-600 text-gray-300'
              }`}
            >
              {enableLazyLoading ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Performance Monitor Toggle */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Performance Monitor
            </label>
            <button
              onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
              className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                showPerformanceMonitor
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-300'
              }`}
            >
              {showPerformanceMonitor ? 'Visible' : 'Hidden'}
            </button>
          </div>
        </div>

        {/* Performance Metrics Display */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-xs text-gray-400">Visible Items</div>
            <div className="text-lg font-semibold text-white">
              {performanceMetrics.visibleItems}/{performanceMetrics.totalItems}
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-xs text-gray-400">Render Time</div>
            <div className={`text-lg font-semibold ${
              performanceMetrics.renderTime > 16 ? 'text-red-400' : 
              performanceMetrics.renderTime > 8 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {performanceMetrics.renderTime.toFixed(1)}ms
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-xs text-gray-400">Cache Size</div>
            <div className="text-lg font-semibold text-blue-400">
              {TimelineCalculations.getCacheSize()}
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-xs text-gray-400">Cache Hit Rate</div>
            <div className="text-lg font-semibold text-green-400">
              ~{Math.round(performanceMetrics.cacheHitRate * 100)}%
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex space-x-2">
          <button
            onClick={handleClearCache}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
          >
            Clear Cache
          </button>
          
          <button
            onClick={() => setMode(mode === 'simplified' ? 'advanced' : 'simplified')}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
          >
            Switch to {mode === 'simplified' ? 'Advanced' : 'Simplified'} Mode
          </button>
        </div>
      </div>

      {/* Demo Content */}
      <div className="demo-content flex-1 relative">
        <ResponsiveTimeline
          mode={mode}
          onModeChange={setMode}
          className="h-full"
        />

        {/* Performance Warnings */}
        {performanceMetrics.renderTime > 16 && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
            ⚠️ Slow render detected: {performanceMetrics.renderTime.toFixed(1)}ms
          </div>
        )}

        {itemCount > 100 && !enableVirtualization && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
            💡 Consider enabling virtualization for better performance
          </div>
        )}
      </div>

      {/* Performance Monitor */}
      {showPerformanceMonitor && (
        <PerformanceMonitor
          enabled={true}
          position="top-right"
        />
      )}

      {/* Demo Info Panel */}
      <div className="demo-info bg-gray-800 border-t border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-white mb-2">Optimizations Active:</h4>
            <ul className="space-y-1 text-gray-300">
              <li className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${enableVirtualization ? 'bg-green-400' : 'bg-gray-500'}`} />
                Virtualization
              </li>
              <li className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${enableLazyLoading ? 'bg-green-400' : 'bg-gray-500'}`} />
                Lazy Loading
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 rounded-full mr-2 bg-green-400" />
                Responsive Design
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 rounded-full mr-2 bg-green-400" />
                Calculation Caching
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-2">Current Settings:</h4>
            <ul className="space-y-1 text-gray-300">
              <li>Items: {itemCount}</li>
              <li>Breakpoint: {breakpoint}</li>
              <li>Mode: {mode}</li>
              <li>Zoom: 100%</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-2">Performance Tips:</h4>
            <ul className="space-y-1 text-gray-300 text-xs">
              <li>• Enable virtualization for 100+ items</li>
              <li>• Use lazy loading for complex content</li>
              <li>• Monitor render times &lt; 16ms</li>
              <li>• Clear cache periodically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}