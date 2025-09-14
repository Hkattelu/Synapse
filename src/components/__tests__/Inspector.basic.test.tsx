import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Inspector } from '../Inspector';
import { AppProvider } from '../../state/context';
import type { TimelineItem, MediaAsset } from '../../lib/types';

// Mock the state hooks
const mockUpdateTimelineItem = vi.fn();
const mockSelectedTimelineItems: TimelineItem[] = [];
const mockGetMediaAssetById = vi.fn();

vi.mock('../../state/hooks', () => ({
  useTimeline: () => ({
    selectedTimelineItems: mockSelectedTimelineItems,
    updateTimelineItem: mockUpdateTimelineItem,
  }),
  useMediaAssets: () => ({
    getMediaAssetById: mockGetMediaAssetById,
  }),
}));

// Test data
const mockVideoItem: TimelineItem = {
  id: 'test-item-1',
  assetId: 'test-asset',
  startTime: 10,
  duration: 5.5,
  track: 0,
  type: 'video',
  properties: {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: 1,
    volume: 0.8,
    playbackRate: 1,
  },
  animations: [],
  keyframes: [],
};

const mockVideoAsset: MediaAsset = {
  id: 'test-asset-1',
  name: 'test-video.mp4',
  type: 'video',
  url: 'blob:test-url',
  duration: 10,
  metadata: {
    width: 1920,
    height: 1080,
    fileSize: 5242880, // 5MB
    mimeType: 'video/mp4',
  },
  createdAt: new Date('2024-01-01'),
};

describe('Inspector Component - Basic Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectedTimelineItems.length = 0;
  });

  const renderInspector = () => {
    return render(
      <AppProvider>
        <Inspector />
      </AppProvider>
    );
  };

  it('should display no selection message when no items are selected', () => {
    renderInspector();

    expect(screen.getByText('No Selection')).toBeInTheDocument();
    expect(
      screen.getByText('Select a clip to edit properties')
    ).toBeInTheDocument();
  });

it('should display video clip metadata correctly', () => {
    mockSelectedTimelineItems.push(mockVideoItem);
    mockGetMediaAssetById.mockReturnValue(mockVideoAsset);

    renderInspector();

    expect(screen.getAllByText('test-video.mp4')[0]).toBeInTheDocument();
    expect(screen.getByText(/video.*clip/i)).toBeInTheDocument();
    expect(screen.getByText('0:05.5')).toBeInTheDocument(); // Duration
    expect(screen.getByText('Track 1')).toBeInTheDocument();
    expect(screen.getByText(/5\.0.*MB/)).toBeInTheDocument();
    expect(screen.getByText(/1920.*×.*1080/)).toBeInTheDocument();
  });

  it('should display Properties tab by default with media controls', () => {
    mockSelectedTimelineItems.push(mockVideoItem);
    mockGetMediaAssetById.mockReturnValue(mockVideoAsset);

    renderInspector();

    // Properties tab should be active and media controls visible in simplified inspector
    expect(screen.getAllByText('Properties').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Volume')).toBeInTheDocument();
    expect(screen.getByLabelText('Playback Rate')).toBeInTheDocument();
  });

  it('should display video-specific properties', () => {
    mockSelectedTimelineItems.push(mockVideoItem);
    mockGetMediaAssetById.mockReturnValue(mockVideoAsset);

    renderInspector();

    expect(screen.getByLabelText('Volume')).toBeInTheDocument();
    expect(screen.getByLabelText('Playback Rate')).toBeInTheDocument();
  });

it('should not render legacy animation section in simplified inspector', () => {
    mockSelectedTimelineItems.push(mockVideoItem);
    mockGetMediaAssetById.mockReturnValue(mockVideoAsset);

    renderInspector();

    expect(screen.queryByText('Animations')).not.toBeInTheDocument();
    expect(screen.queryByText('Add Animation')).not.toBeInTheDocument();
  });

it('should handle multiple selections without a count badge', () => {
    const mockCodeItem: TimelineItem = {
      id: 'test-item-2',
      assetId: 'code-asset',
      startTime: 0,
      duration: 3,
      track: 0,
      type: 'code',
      properties: {
        language: 'typescript',
        theme: 'dark',
        fontSize: 14,
      },
      animations: [],
      keyframes: [],
    };

    mockSelectedTimelineItems.push(mockVideoItem, mockCodeItem);
    mockGetMediaAssetById.mockReturnValue(mockVideoAsset);

    renderInspector();

// The simplified inspector no longer shows a selection count badge
    expect(screen.queryByText(/items selected/)).not.toBeInTheDocument();
  });

  it('should render without crashing when asset is not found', () => {
    mockSelectedTimelineItems.push(mockVideoItem);
    mockGetMediaAssetById.mockReturnValue(undefined);

    renderInspector();

    expect(screen.getByText('Unknown Asset')).toBeInTheDocument();
  });
});
