import { useMemo } from 'react';
import * as RemotionNS from 'remotion';
import { diffLines } from 'diff';
import type { AnimationConfig } from '../../lib/types';

export interface DiffAnimationResult {
  animatedHtml: string;
  needsSpecialStyling: boolean;
}

export function useDiffAnimations(
  animation: AnimationConfig | undefined,
  codeA: string,
  codeB: string,
  language: string,
  startFrame: number,
  highlightCode: (code: string, lang: string) => string,
  encodeForHtml: (text: string) => string
): DiffAnimationResult {
  const hasUCF = 'useCurrentFrame' in (RemotionNS as any);
  const frame: number = hasUCF
    ? (RemotionNS as unknown as { useCurrentFrame: () => number }).useCurrentFrame()
    : 0;
  
  const hasUVC = 'useVideoConfig' in (RemotionNS as any);
  const fps = hasUVC
    ? (RemotionNS as unknown as { useVideoConfig: () => { fps: number } }).useVideoConfig().fps
    : 30;

  return useMemo(() => {
    if (!animation || !['diffSlide', 'diffFade', 'diffHighlight', 'typewriterDiff'].includes(animation.preset)) {
      return { animatedHtml: '', needsSpecialStyling: false };
    }

    const relativeFrame = Math.max(0, frame - startFrame);
    const cleanA = codeA.replace(/\r?\n$/, '');
    const cleanB = codeB.replace(/\r?\n$/, '');
    const diffParts = diffLines(cleanA + '\n', cleanB + '\n');

    switch (animation.preset) {
      case 'diffSlide': {
        const progress = Math.min(1, (relativeFrame * animation.speed) / 60);
        const slideOffset = (1 - progress) * 100;
        
        return {
          animatedHtml: diffParts
            .map((part, index) => {
              let className = 'diff-unchanged';
              let style = '';
              
              if (part.added) {
                className = 'diff-added';
                const delay = index * 0.1;
                const adjustedProgress = Math.max(0, progress - delay);
                const slideX = animation.direction === 'left' ? -slideOffset : 
                             animation.direction === 'right' ? slideOffset : 0;
                const slideY = animation.direction === 'up' ? -slideOffset :
                             animation.direction === 'down' ? slideOffset : 0;
                style = `transform: translate(${slideX * (1 - adjustedProgress)}px, ${slideY * (1 - adjustedProgress)}px); opacity: ${adjustedProgress};`;
              } else if (part.removed) {
                className = 'diff-removed';
                const fadeOut = Math.max(0, 1 - progress * 2);
                style = `opacity: ${fadeOut};`;
              }

              try {
                const highlighted = highlightCode(part.value, language);
                return `<span class="${className}" style="${style}">${highlighted}</span>`;
              } catch {
                const safe = encodeForHtml(part.value);
                return `<span class="${className}" style="${style}">${safe}</span>`;
              }
            })
            .join(''),
          needsSpecialStyling: true
        };
      }

      case 'diffFade': {
        const fadeInFrames = animation.fadeInDuration;
        const fadeOutFrames = animation.fadeOutDuration;
        
        return {
          animatedHtml: diffParts
            .map((part, index) => {
              let className = 'diff-unchanged';
              let style = '';
              
              if (part.added) {
                className = 'diff-added';
                const startFrame = index * 5; // Stagger the animations
                const fadeProgress = Math.max(0, Math.min(1, (relativeFrame - startFrame) / fadeInFrames));
                const highlightIntensity = animation.highlightIntensity * fadeProgress;
                style = `opacity: ${fadeProgress}; background-color: rgba(74, 222, 128, ${highlightIntensity * 0.3});`;
              } else if (part.removed) {
                className = 'diff-removed';
                const fadeProgress = Math.max(0, Math.min(1, relativeFrame / fadeOutFrames));
                const opacity = 1 - fadeProgress;
                style = `opacity: ${opacity}; background-color: rgba(239, 68, 68, ${opacity * 0.3});`;
              }

              try {
                const highlighted = highlightCode(part.value, language);
                return `<span class="${className}" style="${style}">${highlighted}</span>`;
              } catch {
                const safe = encodeForHtml(part.value);
                return `<span class="${className}" style="${style}">${safe}</span>`;
              }
            })
            .join(''),
          needsSpecialStyling: true
        };
      }

      case 'diffHighlight': {
        const progress = Math.min(1, relativeFrame / animation.duration);
        const pulsePhase = animation.pulseEffect ? Math.sin(relativeFrame * 0.2) * 0.5 + 0.5 : 1;
        
        return {
          animatedHtml: diffParts
            .map((part, index) => {
              let className = 'diff-unchanged';
              let style = '';
              
              if (part.added) {
                className = 'diff-added';
                const highlightOpacity = progress * pulsePhase * 0.6;
                style = `background-color: ${animation.highlightColor}${Math.floor(highlightOpacity * 255).toString(16).padStart(2, '0')}; transition: background-color 0.3s ease;`;
              } else if (part.removed) {
                className = 'diff-removed';
                const fadeOpacity = Math.max(0.3, 1 - progress);
                style = `opacity: ${fadeOpacity}; text-decoration: line-through;`;
              }

              try {
                const highlighted = highlightCode(part.value, language);
                return `<span class="${className}" style="${style}">${highlighted}</span>`;
              } catch {
                const safe = encodeForHtml(part.value);
                return `<span class="${className}" style="${style}">${safe}</span>`;
              }
            })
            .join(''),
          needsSpecialStyling: true
        };
      }

      case 'typewriterDiff': {
        const cps = Math.max(1, animation.speedCps);
        const charsPerFrame = cps / fps;
        const totalCharsToShow = Math.floor(relativeFrame * charsPerFrame);
        
        let charCount = 0;
        let showCursor = false;
        
        const result = diffParts
          .map((part, index) => {
            let className = 'diff-unchanged';
            let style = '';
            
            if (part.added && animation.highlightChanges) {
              className = 'diff-added';
              style = 'background-color: rgba(74, 222, 128, 0.2);';
            } else if (part.removed && animation.highlightChanges) {
              className = 'diff-removed';
              style = 'background-color: rgba(239, 68, 68, 0.2); text-decoration: line-through;';
            }

            const partLength = part.value.length;
            const availableChars = Math.max(0, totalCharsToShow - charCount);
            const visibleChars = Math.min(partLength, availableChars);
            
            if (visibleChars < partLength && charCount + visibleChars === totalCharsToShow) {
              showCursor = true;
            }
            
            charCount += partLength;
            
            if (visibleChars === 0) return '';
            
            const visibleText = part.value.substring(0, visibleChars);
            
            try {
              const highlighted = highlightCode(visibleText, language);
              return `<span class="${className}" style="${style}">${highlighted}</span>`;
            } catch {
              const safe = encodeForHtml(visibleText);
              return `<span class="${className}" style="${style}">${safe}</span>`;
            }
          })
          .join('');

        const cursorHtml = showCursor && animation.showCursor 
          ? '<span class="typewriter-cursor" style="background-color: currentColor; width: 2px; height: 1em; display: inline-block; animation: blink 1s infinite; margin-left: 2px;"></span>'
          : '';

        return {
          animatedHtml: result + cursorHtml,
          needsSpecialStyling: true
        };
      }

      default:
        return { animatedHtml: '', needsSpecialStyling: false };
    }
  }, [animation, codeA, codeB, encodeForHtml, fps, frame, highlightCode, language, startFrame]);
}