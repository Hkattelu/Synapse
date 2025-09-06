import React, { useState, useCallback, useRef, useEffect } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  direction: 'horizontal' | 'vertical';
  initialSize?: number;
  minSize?: number;
  maxSize?: number;
  className?: string;
  resizerClassName?: string;
  storageKey?: string; // persist size in localStorage
  onSizeChange?: (size: number) => void;
}

export function ResizablePanel({
  children,
  direction,
  initialSize = 320,
  minSize = 200,
  maxSize = 600,
  className = '',
  resizerClassName = '',
  storageKey,
  onSizeChange,
}: ResizablePanelProps) {
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<number>(initialSize);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const rect = panelRef.current.getBoundingClientRect();
      let newSize: number;

      if (direction === 'horizontal') {
        newSize = rect.right - e.clientX;
      } else {
        newSize = rect.bottom - e.clientY;
      }

      newSize = Math.max(minSize, Math.min(maxSize, newSize));
      setSize(newSize);
      sizeRef.current = newSize;
      onSizeChange?.(newSize);
    },
    [isResizing, direction, minSize, maxSize, onSizeChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, String(sizeRef.current));
      } catch {
        void 0; // ignore persistence errors (e.g., private mode)
      }
    }
  }, [storageKey]);

  // Load persisted size when the key or callback changes
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = parseInt(localStorage.getItem(storageKey) || '', 10);
      if (!Number.isNaN(saved)) {
        setSize(saved);
        sizeRef.current = saved;
        onSizeChange?.(saved);
      }
    } catch {
      void 0; // ignore persistence errors (e.g., private mode)
    }
  }, [storageKey, onSizeChange]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor =
        direction === 'horizontal' ? 'ew-resize' : 'ns-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp, direction]);

  const sizeStyle =
    direction === 'horizontal' ? { width: size } : { height: size };

  return (
    <div ref={panelRef} className={`relative ${className}`} style={sizeStyle}>
      {children}
      <div
        className={`absolute ${
          direction === 'horizontal'
            ? 'left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-purple-400/50 transition-colors'
            : 'top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-purple-400/50 transition-colors'
        } ${resizerClassName} ${isResizing ? 'bg-purple-500' : ''}`}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
