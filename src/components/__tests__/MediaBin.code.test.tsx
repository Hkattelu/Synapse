import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MediaBin } from '../MediaBin';
import { TestProviders } from '../../test/TestProviders';
import type { MediaAsset } from '../../lib/types';

// Mock the hooks
const mockAddMediaAsset = vi.fn();
const mockRemoveMediaAsset = vi.fn();
const mockAddTimelineItem = vi.fn();

vi.mock('../../state/hooks', () => ({
  useMediaAssets: () => ({
    mediaAssets: mockMediaAssets,
    addMediaAsset: mockAddMediaAsset,
    removeMediaAsset: mockRemoveMediaAsset,
  }),
  useTimeline: () => ({
    addTimelineItem: mockAddTimelineItem,
  }),
}));

// Mock validation
vi.mock('../../lib/validation', () => ({
  validateMediaAsset: vi.fn(() => ({ isValid: true, errors: [] })),
  validateProject: vi.fn(() => ({ isValid: true, errors: [] })),
}));

const mockCodeAsset: MediaAsset = {
  id: 'test-code-asset',
  name: 'Code Clip 1',
  type: 'code',
  url: '',
  duration: 10,
  metadata: {
    fileSize: 0,
    mimeType: 'text/plain',
    codeContent: 'console.log("Hello, World!");',
    language: 'javascript',
  },
  createdAt: new Date(),
};

const mockVideoAsset: MediaAsset = {
  id: 'test-video-asset',
  name: 'test-video.mp4',
  type: 'video',
  url: 'blob:test-url',
  duration: 30,
  metadata: {
    fileSize: 1024000,
    mimeType: 'video/mp4',
    width: 1920,
    height: 1080,
  },
  createdAt: new Date(),
};

let mockMediaAssets: MediaAsset[] = [];

describe('MediaBin - Code Clips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMediaAssets = [];
  });

it('renders Add menu and shows New code clip item', () => {
    render(
      <TestProviders>
        <MediaBin />
      </TestProviders>
    );

    const addBtn = screen.getByTitle('Add');
    expect(addBtn).toBeInTheDocument();

    // Open the menu and check for the code clip action
    addBtn.click();
    expect(screen.getByText('New code clip')).toBeInTheDocument();
  });

  it('creates a new code clip when Add Code is clicked', async () => {
    render(
      <TestProviders>
        <MediaBin />
      </TestProviders>
    );

    const addCodeButton = screen.getByText('Add Code');
    fireEvent.click(addCodeButton);

    await waitFor(() => {
      expect(mockAddMediaAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Code Clip 1',
          type: 'code',
          url: '',
          duration: 10,
          metadata: expect.objectContaining({
            fileSize: 0,
            mimeType: 'text/plain',
            codeContent: '// Your code here\nconsole.log("Hello, World!");',
            language: 'javascript',
          }),
        })
      );
    });
  });

  it('creates sequential code clip names', async () => {
    // Mock existing code assets
    mockMediaAssets = [mockCodeAsset];

render(
      <TestProviders>
        <MediaBin />
      </TestProviders>
    );

    const addBtn = screen.getByTitle('Add');
    fireEvent.click(addBtn);
    fireEvent.click(screen.getByText('New code clip'));
screen.getByText('New code clip'));

    await waitFor(() => {
      expect(mockAddMediaAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Code Clip 2', // Should increment
        })
      );
    });
  });

  it('displays code clips with proper icon and language badge', () => {
mockMediaAssets = [mockCodeAsset];

    render(
      <TestProviders>
        <MediaBin />
      </TestProviders>
    );

    // Switch filter to Code to display code assets
    const filter = screen.getByTitle('Content Type');
    fireEvent.change(filter, { target: { value: 'code' } });

    expect(screen.getByText('Code Clip 1')).toBeInTheDocument();
    expect(screen.getByText('js')).toBeInTheDocument(); // Language badge
    expect(screen.getAllByText(/\bcode\b/i).length).toBeGreaterThan(0); // At least one code label/badge present
  });

  it('adds code clip to timeline on double-click', async () => {
mockMediaAssets = [mockCodeAsset];

    render(
      <TestProviders>
        <MediaBin />
      </TestProviders>
    );

    const filter = screen.getByTitle('Content Type');
    fireEvent.change(filter, { target: { value: 'code' } });

    const codeClipElement = screen.getByText('Code Clip 1').closest('.group');
    expect(codeClipElement).toBeInTheDocument();

    fireEvent.doubleClick(codeClipElement!);

    await waitFor(() => {
      expect(mockAddTimelineItem).toHaveBeenCalledWith(
        expect.objectContaining({
          assetId: 'test-code-asset',
          startTime: 0,
          duration: 10,
          track: 0,
          type: 'code',
          properties: expect.objectContaining({
            text: 'console.log("Hello, World!");',
            language: 'javascript',
            theme: 'dark',
            fontSize: 16,
          }),
          animations: [],
        })
      );
    });
  });

  it('handles code clips differently from media assets on double-click', async () => {
    mockMediaAssets = [mockCodeAsset, mockVideoAsset];

render(
      <TestProviders>
        <MediaBin />
      </TestProviders>
    );

    const filter = screen.getByTitle('Content Type');
    fireEvent.change(filter, { target: { value: 'code' } });

    // Double-click code clip
    const codeClipElement = screen.getByText('Code Clip 1').closest('.group');
    fireEvent.doubleClick(codeClipElement!);

    // Double-click video asset
    const videoAssetElement = screen
      .getByText('test-video.mp4')
      .closest('.group');
    fireEvent.doubleClick(videoAssetElement!);

    await waitFor(() => {
      // Code clip should create code timeline item
      expect(mockAddTimelineItem).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'code',
          properties: expect.objectContaining({
            text: expect.any(String),
            language: 'javascript',
          }),
        })
      );

      // Video asset should create video timeline item
      expect(mockAddTimelineItem).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'video',
          properties: {},
        })
      );
    });
  });

  it('displays language badge for different programming languages', () => {
    const pythonCodeAsset = {
      ...mockCodeAsset,
      id: 'python-asset',
      name: 'Python Code',
      metadata: {
        ...mockCodeAsset.metadata,
        language: 'python',
      },
    };

    mockMediaAssets = [mockCodeAsset, pythonCodeAsset];

render(
      <TestProviders>
        <MediaBin />
      </TestProviders>
    );

    const filter = screen.getByTitle('Content Type');
    fireEvent.change(filter, { target: { value: 'code' } });

    expect(screen.getByText('js')).toBeInTheDocument();
    expect(screen.getByText('python')).toBeInTheDocument();
  });

  it('removes code clips when delete button is clicked', async () => {
    mockMediaAssets = [mockCodeAsset];

render(
      <TestProviders>
        <MediaBin />
      </TestProviders>
    );

    const filter = screen.getByTitle('Content Type');
    fireEvent.change(filter, { target: { value: 'code' } });

    const codeClipElement = screen.getByText('Code Clip 1').closest('.group');
    expect(codeClipElement).toBeInTheDocument();

    // Hover to show delete button
    fireEvent.mouseEnter(codeClipElement!);

    const deleteButton = screen.getByTitle('Remove asset');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockRemoveMediaAsset).toHaveBeenCalledWith('test-code-asset');
    });
  });

  it('shows 0 Bytes for code clips file size', () => {
    mockMediaAssets = [mockCodeAsset];

render(
      <TestProviders>
        <MediaBin />
      </TestProviders>
    );

    const filter = screen.getByTitle('Content Type');
    fireEvent.change(filter, { target: { value: 'code' } });

    expect(screen.getByText('0 Bytes')).toBeInTheDocument();
  });

  it('shows duration for code clips', () => {
    mockMediaAssets = [mockCodeAsset];

render(
      <TestProviders>
        <MediaBin />
      </TestProviders>
    );

    const filter = screen.getByTitle('Content Type');
    fireEvent.change(filter, { target: { value: 'code' } });

    expect(screen.getByText('0:10')).toBeInTheDocument(); // 10 seconds formatted
  });
});
