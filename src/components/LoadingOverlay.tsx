import React from 'react';
import { useAppContext } from '../state/context';

export const LoadingOverlay: React.FC = () => {
  const { state } = useAppContext();
  const { isLoading, loadingMessage } = state;

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-background-secondary border border-border-subtle rounded-lg p-6 shadow-xl min-w-[280px] text-center">
        <div className="mx-auto mb-4 w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-text-primary text-sm">
          {loadingMessage || 'Loading...'}
        </p>
      </div>
    </div>
  );
};

