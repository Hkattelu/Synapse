import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import type { TimelineItem, MediaAsset } from './types';
import type { EducationalTrack } from './educationalTypes';

// Intersection Observer hook for lazy loading (generic element type)
export function useIntersectionObserver<T extends HTMLElement = HTMLElement>(
  options: IntersectionObserverInit = {}
): [React.MutableRefObject<T | null>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<T>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Always construct the observer so tests can assert constructor call,
    // even if no element is currently attached to the ref.
    const mergedOptions: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: '50px',
      ...options,
    };

    observerRef.current = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, mergedOptions);

    const element = ref.current;
    if (element) {
      observerRef.current.observe(element);
    }

    return () => {
      if (observerRef.current && element) {
        try {
          observerRef.current.unobserve(element);
        } catch {}
      }
      try {
        observerRef.current?.disconnect();
      } catch {}
      observerRef.current = null;
    };
  }, [options]);

  return [ref, isIntersecting];
}

// Virtualization hook for timeline items
export function useVirtualization(
  items: TimelineItem[],
  containerWidth: number,
  itemWidth: number,
  overscan: number = 5
) {
  const [scrollLeft, setScrollLeft] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(
      0,
      Math.floor(scrollLeft / itemWidth) - overscan
    );
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollLeft + containerWidth) / itemWidth) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollLeft, containerWidth, itemWidth, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  return {
    visibleItems,
    visibleRange,
    setScrollLeft,
  };
}

// Debounced resize observer
export function useResizeObserver(
  callback: (entry: ResizeObserverEntry) => void,
  delay: number = 100
): React.RefObject<HTMLElement> {
  const ref = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const roRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    // Always construct the observer so tests can assert constructor call
    roRef.current = new ResizeObserver((entries) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(entries[0]);
      }, delay);
    });

    const element = ref.current;
    if (element) {
      roRef.current.observe(element as Element);
    }

    return () => {
      if (element) {
        try {
          roRef.current?.unobserve(element as Element);
        } catch {}
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      try {
        roRef.current?.disconnect();
      } catch {}
      roRef.current = null;
    };
  }, [callback, delay]);

  return ref;
}

// Memoized track content renderer
export function useMemoizedTrackContent(
  track: EducationalTrack,
  items: TimelineItem[],
  assets: Map<string, MediaAsset>,
  dependencies: any[] = []
) {
  return useMemo(() => {
    const trackItems = items.filter((item) => item.track === track.trackNumber);

    return trackItems.map((item) => {
      const asset = assets.get(item.assetId);
      return {
        item,
        asset,
        key: `${item.id}-${item.startTime}-${item.duration}`,
      };
    });
  }, [track.trackNumber, items, assets, ...dependencies]);
}

// Throttled scroll handler
export function useThrottledScroll(
  callback: (scrollLeft: number, scrollTop: number) => void,
  delay: number = 16 // ~60fps
) {
  const lastCallTime = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      const now = Date.now();
      const scrollLeft = e.currentTarget.scrollLeft;
      const scrollTop = e.currentTarget.scrollTop;

      if (now - lastCallTime.current >= delay) {
        callback(scrollLeft, scrollTop);
        lastCallTime.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(
          () => {
            callback(scrollLeft, scrollTop);
            lastCallTime.current = Date.now();
          },
          delay - (now - lastCallTime.current)
        );
      }
    },
    [callback, delay]
  );
}

// Lazy image loading hook
export function useLazyImage(src: string | undefined, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(placeholder);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;

    setIsLoading(true);
    setError(null);

    const img = new Image();

    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
      setError('Failed to load image');
      setIsLoading(false);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { imageSrc, isLoading, error };
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`
      );
    }

    startTime.current = performance.now();
  });

  return renderCount.current;
}

// Responsive breakpoint hook
export function useResponsiveBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>(
    'desktop'
  );

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);

    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

// Optimized timeline calculations
export class TimelineCalculations {
  private static cache = new Map<string, any>();

  static getTimeToPixels(
    time: number,
    pixelsPerSecond: number,
    zoom: number,
    cacheKey?: string
  ): number {
    if (cacheKey) {
      const cached = this.cache.get(`timeToPixels-${cacheKey}`);
      if (
        cached &&
        cached.time === time &&
        cached.pixelsPerSecond === pixelsPerSecond &&
        cached.zoom === zoom
      ) {
        return cached.result;
      }
    }

    const result = time * pixelsPerSecond * zoom;

    if (cacheKey) {
      this.cache.set(`timeToPixels-${cacheKey}`, {
        time,
        pixelsPerSecond,
        zoom,
        result,
      });
    }

    return result;
  }

  static getPixelsToTime(
    pixels: number,
    pixelsPerSecond: number,
    zoom: number,
    cacheKey?: string
  ): number {
    if (cacheKey) {
      const cached = this.cache.get(`pixelsToTime-${cacheKey}`);
      if (
        cached &&
        cached.pixels === pixels &&
        cached.pixelsPerSecond === pixelsPerSecond &&
        cached.zoom === zoom
      ) {
        return cached.result;
      }
    }

    const result = pixels / (pixelsPerSecond * zoom);

    if (cacheKey) {
      this.cache.set(`pixelsToTime-${cacheKey}`, {
        pixels,
        pixelsPerSecond,
        zoom,
        result,
      });
    }

    return result;
  }

  static clearCache(): void {
    this.cache.clear();
  }

  static getCacheSize(): number {
    return this.cache.size;
  }
}

// Educational track preview optimization
export function useOptimizedTrackPreview(
  track: EducationalTrack,
  item: TimelineItem,
  asset: MediaAsset | undefined
) {
  return useMemo(() => {
    if (!asset) return null;

    switch (track.id) {
      case 'code':
        return {
          type: 'code',
          language:
            item.properties.language ||
            asset.metadata?.language ||
            'javascript',
          preview: asset.metadata?.codeContent?.slice(0, 100) || '',
          animationMode: item.properties.animationMode || 'typing',
        };

      case 'visual':
        return {
          type: 'visual',
          thumbnail: asset.thumbnail,
          dimensions:
            asset.metadata?.width && asset.metadata?.height
              ? `${asset.metadata.width}×${asset.metadata.height}`
              : null,
          isVideo: asset.type === 'video',
        };

      case 'narration':
        return {
          type: 'narration',
          volume: item.properties.volume || 0.8,
          hasWaveform: !!asset.url,
          hasDucking: !!item.properties.ducking?.enabled,
          syncPoints: item.properties.syncPoints?.length || 0,
        };

      case 'you':
        return {
          type: 'you',
          thumbnail: asset.thumbnail,
          isTalkingHead: !!item.properties.talkingHeadEnabled,
          corner: item.properties.talkingHeadCorner || 'bottom-right',
        };

      default:
        return {
          type: 'default',
          name: asset.name,
          itemType: item.type,
        };
    }
  }, [track.id, item.properties, asset]);
}

// Batch update optimization
export class BatchUpdater {
  private updates: (() => void)[] = [];
  private timeoutId: NodeJS.Timeout | null = null;

  addUpdate(update: () => void): void {
    this.updates.push(update);
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.timeoutId) return;

    this.timeoutId = setTimeout(() => {
      this.flush();
    }, 0);
  }

  private flush(): void {
    const updates = this.updates.splice(0);
    updates.forEach((update) => update());
    this.timeoutId = null;
  }

  clear(): void {
    this.updates = [];
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
