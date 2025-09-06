import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UpdateBanner } from '../UpdateBanner';
import type { UpdateStatus, SynapseUpdatesApi } from '../../types/preload';

declare global {
  // augment Window for tests
  interface Window {
    SynapseUpdates?: SynapseUpdatesApi;
  }
}

const makeStatus = (over: Partial<UpdateStatus> = {}): UpdateStatus => ({
  currentVersion: '1.0.0',
  latestVersion: '1.2.0',
  updateAvailable: true,
  downloadUrl: undefined,
  ...over,
});

beforeEach(() => {
  vi.useRealTimers();
});

describe('UpdateBanner', () => {
  it('does not render when no update is available', async () => {
    window.SynapseUpdates = {
      getLast: () => Promise.resolve(makeStatus({ updateAvailable: false })),
      checkNow: () => Promise.resolve(makeStatus({ updateAvailable: false })),
      openDownload: () => Promise.resolve(true as const),
      onStatus: () => () => {},
    };

    render(
      <MemoryRouter>
        <UpdateBanner />
      </MemoryRouter>
    );

    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText(/Get Update/i)).toBeNull();
  });

  it('renders internal link when no external downloadUrl', async () => {
    window.SynapseUpdates = {
      getLast: () => Promise.resolve(makeStatus({ downloadUrl: undefined })),
      checkNow: () => Promise.resolve(makeStatus({})),
      openDownload: () => Promise.resolve(true as const),
      onStatus: () => () => {},
    };

    render(
      <MemoryRouter>
        <UpdateBanner />
      </MemoryRouter>
    );

    const btn = await screen.findByRole('link', { name: /Get Update/i });
    expect(btn).toHaveAttribute('href', '/downloads');
  });

  it('renders external link and uses openDownload when downloadUrl is http(s)', async () => {
    const openDownload = vi.fn(() => Promise.resolve(true as const));
    window.SynapseUpdates = {
      getLast: () =>
        Promise.resolve(
          makeStatus({ downloadUrl: 'https://example.com/app.dmg' })
        ),
      checkNow: () => Promise.resolve(makeStatus({})),
      openDownload,
      onStatus: () => () => {},
    };

    render(
      <MemoryRouter>
        <UpdateBanner />
      </MemoryRouter>
    );

    const a = await screen.findByRole('link', { name: /Get Update/i });
    expect(a).toHaveAttribute('href', 'https://example.com/app.dmg');
    expect(a).toHaveAttribute('target', '_blank');

    fireEvent.click(a);
    await waitFor(() => expect(openDownload).toHaveBeenCalledTimes(1));
  });

  it('Check again invokes checkNow and toggles disabled state', async () => {
    const checkNow: SynapseUpdatesApi['checkNow'] = vi.fn(() =>
      Promise.resolve(makeStatus({}))
    );
    window.SynapseUpdates = {
      getLast: () => Promise.resolve(makeStatus({})),
      checkNow,
      openDownload: () => Promise.resolve(true as const),
      onStatus: () => () => {},
    } as SynapseUpdatesApi;

    render(
      <MemoryRouter>
        <UpdateBanner />
      </MemoryRouter>
    );

    const btn = await screen.findByRole('button', { name: /Check again/i });
    fireEvent.click(btn);
    // after click we expect it to switch to Checking… text
    await waitFor(() =>
      expect(screen.getByRole('button')).toHaveTextContent('Checking…')
    );
    await waitFor(() => expect(checkNow).toHaveBeenCalledTimes(1));
  });
});
