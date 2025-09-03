import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodeEditorWorkflow } from '../CodeEditorWorkflow';
import { VideoWorkflow } from '../VideoWorkflow';
import { patchNextFileInput } from '../../../test/fileInput';

// Mocks must be defined before importing modules that consume them
const mockAddTimelineItem = vi.fn();
const mockAddMediaAsset = vi.fn().mockReturnValue('mock-asset-id');
const mockNotify = vi.fn();

vi.mock('../../../state/hooks', () => ({
  useTimeline: () => ({
    addTimelineItem: mockAddTimelineItem,
  }),
  useMediaAssets: () => ({
    addMediaAsset: mockAddMediaAsset,
  }),
}));

vi.mock('../../../state/notifications', () => ({
  useNotifications: () => ({
    notify: mockNotify,
  }),
}));

vi.mock('../../../lib/educationalTypes', async (orig) => {
  const actual = await orig<typeof import('../../../lib/educationalTypes')>();
  // Force deterministic track numbers used by workflows
  return {
    ...actual,
    getEducationalTrackByName: vi.fn((name: any) =>
      actual.EDUCATIONAL_TRACKS.find((t) => t.name === name)
    ),
  };
});

describe('Educational content addition workflows (integration)', () => {
  beforeEach(() => {
    mockAddTimelineItem.mockReset();
    mockAddMediaAsset.mockReset().mockReturnValue('mock-asset-id');
    mockNotify.mockReset();
  });

  it('CodeEditorWorkflow adds code to Code track with derived duration and props', async () => {
    const onCodeAdded = vi.fn();
    const onClose = vi.fn();

    render(<CodeEditorWorkflow isOpen onClose={onClose} onCodeAdded={onCodeAdded} />);

    // Switch to custom editor (optional) and type code
    fireEvent.click(screen.getByText('Start from Scratch'));
    const textarea = screen.getByPlaceholderText('Enter your code here...');
    fireEvent.change(textarea, { target: { value: 'console.log(\'Hello\');' } });

    // Provide a title
    fireEvent.change(screen.getByPlaceholderText('Enter a descriptive title for your code'), {
      target: { value: 'My Demo' },
    });

    // Add to timeline
    const addBtn = screen.getByRole('button', { name: 'Add to Timeline' });
    fireEvent.click(addBtn);

    await waitFor(() => expect(onCodeAdded).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();

    // Media asset created first
    expect(mockAddMediaAsset).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'code', metadata: expect.objectContaining({ language: 'javascript' }) })
    );

    // Timeline item placed on Code track (trackNumber 0)
    expect(mockAddTimelineItem).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'code',
        track: 0,
        properties: expect.objectContaining({
          codeText: "console.log('Hello');",
          language: 'javascript',
          title: 'My Demo',
        }),
      })
    );
  });

  it('VideoWorkflow uploads a talking-head video to the You track', async () => {
    const onVideoAdded = vi.fn();
    const onClose = vi.fn();

    render(<VideoWorkflow isOpen onClose={onClose} onVideoAdded={onVideoAdded} />);

    // Choose Talking Head option
    fireEvent.click(screen.getByText('Talking Head'));

    // Provide a title
    fireEvent.change(screen.getByPlaceholderText('Enter title for your talking head'), {
      target: { value: 'Presenter Intro' },
    });

    // Intercept file picker and simulate a file selection using shared helper
    const { input, restore } = patchNextFileInput(
      new File(['fake'], 'video.mp4', { type: 'video/mp4' })
    );
    try {
      fireEvent.click(screen.getByText('Upload Video File'));

      // Trigger the change event the workflow attaches
      input.dispatchEvent(new Event('change'));

    await waitFor(() => expect(onVideoAdded).toHaveBeenCalled());
      expect(onClose).toHaveBeenCalled();
    } finally {
      restore();
    }

    // Asset and timeline item created
    expect(mockAddMediaAsset).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'video', metadata: expect.objectContaining({ videoType: 'talking-head' }) })
    );
    // You track is trackNumber 3
    expect(mockAddTimelineItem).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'video', track: 3, properties: expect.objectContaining({ title: 'Presenter Intro' }) })
    );
  });
});
