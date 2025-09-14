import React from 'react';
import { useBootProgress } from '../state/bootProgress';

// Mounts inside the routed app when Suspense resolves, to finish the boot bar
export const BootProgressMarker: React.FC = () => {
  const { bumpTo, complete, setMessage } = useBootProgress();

  React.useEffect(() => {
    setMessage('Finalizing…');
    bumpTo(95);
    const id = window.setTimeout(() => complete(), 300);
    return () => window.clearTimeout(id);
  }, [bumpTo, complete, setMessage]);

  return null;
};