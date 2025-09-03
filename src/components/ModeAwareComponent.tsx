import React from 'react';
import { useUI } from '../state/hooks';

interface ModeAwareComponentProps {
  children: React.ReactNode;
  mode?: 'simplified' | 'advanced' | 'both';
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * Component that conditionally renders children based on the current UI mode
 */
export function ModeAwareComponent({ 
  children, 
  mode = 'both', 
  fallback = null,
  className = ''
}: ModeAwareComponentProps) {
  const { ui } = useUI();

  const shouldRender = mode === 'both' || ui.mode === mode;

  if (!shouldRender) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  return <div className={className}>{children}</div>;
}

/**
 * Hook to check if a feature should be visible in the current mode
 */
export function useFeatureVisibility(feature: 'simplified' | 'advanced' | 'both' = 'both'): boolean {
  const { ui } = useUI();
  
  if (feature === 'both') return true;
  return ui.mode === feature;
}

/**
 * Hook to get mode-specific CSS classes
 */
export function useModeClasses(simplifiedClasses: string = '', advancedClasses: string = ''): string {
  const { ui } = useUI();
  
  return ui.mode === 'simplified' ? simplifiedClasses : advancedClasses;
}