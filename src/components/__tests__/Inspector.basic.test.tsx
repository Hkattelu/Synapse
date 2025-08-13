import React from 'react';
import { render, screen } from '@testing-library/react';
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
  assetId: 'test-asset-1',
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
    expect(screen.getByText('Select a clip to edit properties')).toBeInTheDocument();
  });

  it('should display video clip metadata correctly', () => {
    mockSelectedTimelineItems.push(mockVideoItem);
    mockGetMediaAssetById.mockReturnValue(mockVideoAsset);
    
    renderInspector();
    
    expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
    expect(screen.getByText(/video.*clip/i)).toBeInTheDocument();
    expect(screen.getByText('0:05.5')).toBeInTheDocument(); // Duration
    expect(screen.getByText('Track 1')).toBeInTheDocument();
    expect(screen.getByText(/5\.0.*MB/)).toBeInTheDocument();
    expect(screen.getByText(/1920.*×.*1080/)).toBeInTheDocument();
  });

  it('should display transform properties with correct values', () => {
    mockSelectedTimelineItems.push(mockVideoItem);
    mockGetMediaAssetById.mockReturnValue(mockVideoAsset);
    
    renderInspector();
    
    // Check that form inputs exist with correct labels
    expect(screen.getByLabelText('X Position')).toBeInTheDocument();
    expect(screen.getByLabelText('Y Position')).toBeInTheDocument();
    expect(screen.getByLabelText('Scale')).toBeInTheDocument();
    expect(screen.getByLabelText('Rotation')).toBeInTheDocument();
    expect(screen.getByLabelText('Opacity')).toBeInTheDocument();
  });

  it('should display video-specific properties', () => {
    mockSelectedTimelineItems.push(mockVideoItem);
    mockGetMediaAssetById.mockReturnValue(mockVideoAsset);
    
    renderInspector();
    
    expect(screen.getByLabelText('Volume')).toBeInTheDocument();
    expect(screen.getByLabelText('Playback Rate')).toBeInTheDocument();
  });

  it('should display animation section', () => {
    mockSelectedTimelineItems.push(mockVideoItem);
    mockGetMediaAssetById.mockReturnValue(mockVideoAsset);
    
    renderInspector();
    
    expect(screen.getByText('Animations')).toBeInTheDocument();
    expect(screen.getByText('Add Animation')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  it('should show multiple items selected count', () => {
    const mockCodeItem: TimelineItem = {
      id: 'test-item-2',
      assetId: 'test-asset-2',
      startTime: 0,
      duration: 3,
      track: 1,
      type: 'code',
      properties: {
        language: 'javascript',
        theme: 'dark',
        fontSize: 16,
      },
      animations: [],
    };

    mockSelectedTimelineItems.push(mockVideoItem, mockCodeItem);
    mockGetMediaAssetById.mockReturnValue(mockVideoAsset);
    
    renderInspector();
    
    expect(screen.getByText('2 items selected')).toBeInTheDocument();
  });

  it('should render without crashing when asset is not found', () => {
    mockSelectedTimelineItems.push(mockVideoItem);
    mockGetMediaAssetById.mockReturnValue(undefined);
    
    renderInspector();
    
    expect(screen.getByText('Unknown Asset')).toBeInTheDocument();
  });
});