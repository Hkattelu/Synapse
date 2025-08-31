import { useEffect } from 'react';
import { useProjectStore } from '../state/projectStore';
import { usePlayback } from '../state/hooks';

interface UseKeyboardShortcutsProps {
  selectedItemId: string | null;
  onToggleFullscreen?: () => void;
  onShowShortcuts?: () => void;
}

export function useKeyboardShortcuts({
  selectedItemId,
  onToggleFullscreen,
  onShowShortcuts,
}: UseKeyboardShortcutsProps) {
  const { deleteClip } = useProjectStore();
  const { playback, play, pause, seek } = usePlayback();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Handle different shortcuts
      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (playback.isPlaying) {
            pause();
          } else {
            play();
          }
          break;

        case 'Delete':
        case 'Backspace':
          if (selectedItemId) {
            e.preventDefault();
            deleteClip(selectedItemId);
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            // Skip backward 10s
            const newTime = Math.max(0, playback.currentTime - 10);
            seek(newTime);
          } else {
            // Previous frame (assuming 30fps)
            const frameTime = 1 / 30;
            const newTime = Math.max(0, playback.currentTime - frameTime);
            seek(newTime);
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            // Skip forward 10s
            const newTime = playback.currentTime + 10;
            seek(newTime);
          } else {
            // Next frame (assuming 30fps)
            const frameTime = 1 / 30;
            const newTime = playback.currentTime + frameTime;
            seek(newTime);
          }
          break;

        case 'f':
        case 'F':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onToggleFullscreen?.();
          }
          break;

        case '?':
          if (e.shiftKey) {
            e.preventDefault();
            onShowShortcuts?.();
          }
          break;

        case 'Escape':
          // Let the fullscreen component handle this
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, playback, play, pause, seek, deleteClip, onToggleFullscreen, onShowShortcuts]);
}