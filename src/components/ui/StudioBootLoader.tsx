import React from 'react';
import { StudioLoader } from './StudioLoader';
import { useBootProgress } from '../../state/bootProgress';

export const StudioBootLoader: React.FC = () => {
  const { progress, message, tasks } = useBootProgress();
  return <StudioLoader progress={progress} message={message || 'Loading Synapse Studio…'} tasks={tasks} />;
};
