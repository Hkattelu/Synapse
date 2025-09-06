import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the app context hook to control loading state
vi.mock('../../state/context', () => ({
  useAppContext: () => ({
    state: { isLoading: true, loadingMessage: 'Processing…' },
    dispatch: vi.fn(),
  }),
}));

import { LoadingOverlay } from '../LoadingOverlay';

describe('LoadingOverlay', () => {
  it('renders spinner and message when loading', () => {
    render(<LoadingOverlay />);
    expect(screen.getByText('Processing…')).toBeInTheDocument();
    // container div with overlay styles is present
    expect(document.querySelector('.fixed.inset-0')).toBeTruthy();
  });
});
