import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Silence the expected console.error noise from React error boundary
vi.spyOn(console, 'error').mockImplementation(() => {});

function AlwaysBoom() {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('renders default fallback UI and shows the error message', () => {
    render(
      <ErrorBoundary>
        <AlwaysBoom />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
  });

  it('supports custom fallback', () => {
    const Fallback = <div role="alert">Custom Fallback</div>;
    render(
      <ErrorBoundary fallback={Fallback}>
        <AlwaysBoom />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Custom Fallback');
  });
});
