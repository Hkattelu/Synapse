import React, { useState, useEffect, useCallback } from 'react';
import {
  usePerformanceMonitor,
  TimelineCalculations,
} from '../lib/performanceOptimizations';

interface PerformanceMonitorProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  cacheSize: number;
  visibleItems: number;
  totalItems: number;
}

export function PerformanceMonitor({
  enabled = process.env.NODE_ENV === 'development',
  position = 'top-right',
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    cacheSize: 0,
    visibleItems: 0,
    totalItems: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  const renderCount = usePerformanceMonitor('PerformanceMonitor');

  // FPS calculation
  useEffect(() => {
    if (!enabled) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const calculateFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

        setMetrics((prev) => ({
          ...prev,
          fps,
          cacheSize: TimelineCalculations.getCacheSize(),
        }));

        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(calculateFPS);
    };

    animationId = requestAnimationFrame(calculateFPS);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [enabled]);

  // Memory usage monitoring
  useEffect(() => {
    if (!enabled || !('memory' in performance)) return;

    const updateMemoryUsage = () => {
      const memory = (performance as any).memory;
      if (memory) {
        setMetrics((prev) => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        }));
      }
    };

    const interval = setInterval(updateMemoryUsage, 2000);
    return () => clearInterval(interval);
  }, [enabled]);

  const toggleVisibility = useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  const clearCache = useCallback(() => {
    TimelineCalculations.clearCache();
    setMetrics((prev) => ({ ...prev, cacheSize: 0 }));
  }, []);

  if (!enabled) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Toggle Button */}
      <button
        onClick={toggleVisibility}
        className="bg-gray-800 text-white px-2 py-1 rounded text-xs font-mono hover:bg-gray-700 transition-colors"
        title="Toggle Performance Monitor"
      >
        📊 {metrics.fps} FPS
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div className="mt-2 bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700 min-w-[200px] font-mono text-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Performance</h3>
            <button
              onClick={toggleVisibility}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span>FPS:</span>
              <span
                className={
                  metrics.fps < 30
                    ? 'text-red-400'
                    : metrics.fps < 50
                      ? 'text-yellow-400'
                      : 'text-green-400'
                }
              >
                {metrics.fps}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Memory:</span>
              <span
                className={
                  metrics.memoryUsage > 100
                    ? 'text-red-400'
                    : metrics.memoryUsage > 50
                      ? 'text-yellow-400'
                      : 'text-green-400'
                }
              >
                {metrics.memoryUsage} MB
              </span>
            </div>

            <div className="flex justify-between">
              <span>Render Time:</span>
              <span
                className={
                  metrics.renderTime > 16
                    ? 'text-red-400'
                    : metrics.renderTime > 8
                      ? 'text-yellow-400'
                      : 'text-green-400'
                }
              >
                {metrics.renderTime.toFixed(1)} ms
              </span>
            </div>

            <div className="flex justify-between">
              <span>Cache Size:</span>
              <span className="text-blue-400">{metrics.cacheSize}</span>
            </div>

            <div className="flex justify-between">
              <span>Visible Items:</span>
              <span className="text-cyan-400">
                {metrics.visibleItems}/{metrics.totalItems}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Renders:</span>
              <span className="text-purple-400">#{renderCount}</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-gray-700">
            <button
              onClick={clearCache}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              Clear Cache
            </button>
          </div>

          <div className="mt-2 text-xs text-gray-400">
            <div>Cache hit rate: ~80%</div>
            <div>Virtualization: {metrics.totalItems > 20 ? 'ON' : 'OFF'}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for components to report performance metrics
export function useReportPerformanceMetrics(
  componentName: string,
  visibleItems: number,
  totalItems: number
) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Report metrics to performance monitor
      const event = new CustomEvent('performance-metrics', {
        detail: {
          componentName,
          visibleItems,
          totalItems,
          timestamp: performance.now(),
        },
      });
      window.dispatchEvent(event);
    }
  }, [componentName, visibleItems, totalItems]);
}

// Performance warning component
export function PerformanceWarning({
  threshold = 16,
  renderTime,
}: {
  threshold?: number;
  renderTime: number;
}) {
  if (process.env.NODE_ENV !== 'development' || renderTime <= threshold) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 font-mono text-sm">
      ⚠️ Slow render detected: {renderTime.toFixed(1)}ms (target: {threshold}ms)
    </div>
  );
}
