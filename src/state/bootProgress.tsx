import React from 'react';

interface BootProgressState {
  progress: number; // 0-100
  message?: string;
  tasks: string[];
  setMessage: (msg?: string) => void;
  bumpTo: (pct: number) => void;
  complete: () => void;
}

const BootProgressContext = React.createContext<BootProgressState | null>(null);

export function useBootProgress() {
  const ctx = React.useContext(BootProgressContext);
  if (!ctx) throw new Error('useBootProgress must be used within BootProgressProvider');
  return ctx;
}

export const BootProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progress, setProgress] = React.useState(3);
  const [target, setTarget] = React.useState(80);
  const [message, setMessage] = React.useState<string | undefined>('Initializing…');
  const tasks = React.useMemo(
    () => [
      'Loading shell',
      'Initializing state',
      'Preparing routes',
      'Connecting to backend',
      'Warming editor and timeline',
    ],
    []
  );

  // Smooth auto-tick towards target while booting
  React.useEffect(() => {
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (p >= target) return p;
        const delta = Math.max(0.2, (target - p) * 0.08);
        const next = Math.min(target, p + delta);
        return next;
      });
    }, 120);
    return () => window.clearInterval(id);
  }, [target]);

  const bumpTo = React.useCallback((pct: number) => {
    setTarget((t) => Math.max(t, Math.min(95, Math.floor(pct))));
  }, []);

  const complete = React.useCallback(() => {
    setTarget(100);
    // Nudge the visible bar to 100 promptly
    setProgress((p) => (p < 98 ? 98 : p));
    // Finalize shortly after for a smoother end
    window.setTimeout(() => setProgress(100), 200);
  }, []);

  const value = React.useMemo<BootProgressState>(() => ({ progress, message, tasks, setMessage, bumpTo, complete }), [progress, message, tasks, bumpTo, complete]);

  return <BootProgressContext.Provider value={value}>{children}</BootProgressContext.Provider>;
};