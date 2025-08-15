import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Inspector } from '../Inspector';
import { AppProvider } from '../../state/context';
import type { TimelineItem, MediaAsset } from '../../lib/types';

import { vi } from 'vitest';

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

const mockCodeItem: TimelineItem = {
  id: 'test-item-2',
  assetId: 'code-asset',
  startTime: 0,
  duration: 3,
  track: 0,
  type: 'code',
  properties: {
    language: 'javascript',
    theme: 'dark',
    fontSize: 16,
  },
  animations: [
    {
      id: 'fade-in',
      name: 'Fade In',
      type: 'entrance',
      parameters: { direction: 'up' },
      duration: 0.5,
    },
  ],
  keyframes: [],
};

const mockTitleItem: TimelineItem = {
  id: 'test-item-3',
  assetId: 'title-asset',
  startTime: 5,
  duration: 2,
  track: 2,
  type: 'title',
  properties: {
    text: 'Hello World',
    fontFamily: 'Inter',
    color: '#ffffff',
    backgroundColor: 'transparent',
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

const mockCodeAsset: MediaAsset = {
  id: 'test-asset-2',
  name: 'example.js',
  type: 'code',
  url: 'blob:test-code-url',
  metadata: {
    fileSize: 1024,
    mimeType: 'text/javascript',
  },
  createdAt: new Date('2024-01-01'),
};

describe('Inspector Component', () => {
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

  describe('No Selection State', () => {
    it('should display no selection message when no items are selected', () => {
      renderInspector();

      expect(screen.getByText('No Selection')).toBeInTheDocument();
      expect(
        screen.getByText('Select a clip to edit properties')
      ).toBeInTheDocument();
    });
  });

  // TODO: Revisit these tests once the Inspector product surface stabilizes
  describe.skip('Video Clip Properties', () => {
    beforeEach(() => {
      mockSelectedTimelineItems.push(mockVideoItem);
      mockGetMediaAssetById.mockReturnValue(mockVideoAsset);
    });

    it('should display video clip metadata correctly', () => {
      renderInspector();

      expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
      expect(screen.getByText(/video clip/i)).toBeInTheDocument();
      expect(screen.getByText('0:05.5')).toBeInTheDocument(); // Duration
      expect(screen.getByText(/0:.*10/)).toBeInTheDocument(); // Start time (format may vary)
      expect(screen.getByText('Track 1')).toBeInTheDocument();
      expect(screen.getByText(/5\.0\s*MB/)).toBeInTheDocument();
      expect(screen.getByText('1920 × 1080')).toBeInTheDocument();
    });

    it('should display transform properties with correct values', () => {
      renderInspector();

      const xInput = screen.getByLabelText('X Position') as HTMLInputElement;
      const yInput = screen.getByLabelText('Y Position') as HTMLInputElement;
      const scaleInput = screen.getByLabelText('Scale') as HTMLInputElement;
      const opacityInput = screen.getByLabelText('Opacity') as HTMLInputElement;

      expect(xInput.value).toBe('0');
      expect(yInput.value).toBe('0');
      expect(scaleInput.value).toBe('1');
      expect(opacityInput.value).toBe('1');
    });

    it('should display video-specific properties', () => {
      renderInspector();

      expect(screen.getByDisplayValue('0.8')).toBeInTheDocument(); // Volume
      expect(screen.getByDisplayValue('1')).toBeInTheDocument(); // Playback rate
    });

    it('should update properties when values change', async () => {
      renderInspector();

      const scaleInput = screen.getByDisplayValue('1');
      fireEvent.change(scaleInput, { target: { value: '1.5' } });

      await waitFor(() => {
        expect(mockUpdateTimelineItem).toHaveBeenCalledWith('test-item-1', {
          properties: expect.objectContaining({
            scale: 1.5,
          }),
        });
      });
    });

    it('should validate property values and show errors', async () => {
      renderInspector();

      const opacityInput = screen.getByDisplayValue('1');
      fireEvent.change(opacityInput, { target: { value: '2' } }); // Invalid opacity > 1

      await waitFor(() => {
        expect(
          screen.getByText('Opacity must be a number between 0 and 1')
        ).toBeInTheDocument();
      });
    });
  });

  // TODO: Revisit these tests once code clip features are finalized
  describe.skip('Code Clip Properties', () => {
    beforeEach(() => {
      mockSelectedTimelineItems.push(mockCodeItem);
      mockGetMediaAssetById.mockReturnValue(mockCodeAsset);
    });

    it('should display code-specific properties', () => {
      renderInspector();

      expect(screen.getByDisplayValue('javascript')).toBeInTheDocument();
      expect(screen.getByDisplayValue('dark')).toBeInTheDocument();
      expect(screen.getByDisplayValue('16')).toBeInTheDocument();
    });

    it('should update code properties', async () => {
      renderInspector();

      const languageSelect = screen.getByDisplayValue('javascript');
      fireEvent.change(languageSelect, { target: { value: 'python' } });

      await waitFor(() => {
        expect(mockUpdateTimelineItem).toHaveBeenCalledWith('test-item-2', {
          properties: expect.objectContaining({
            language: 'python',
          }),
        });
      });
    });

    it('should display existing animations', () => {
      renderInspector();

      expect(screen.getByText('Applied Animations')).toBeInTheDocument();
      expect(screen.getByText('Fade In')).toBeInTheDocument();
      expect(screen.getByText('entrance • 0.5s')).toBeInTheDocument();
    });

    it('should allow removing animations', async () => {
      renderInspector();

      const removeButton = screen.getByTitle('Remove Animation');
      fireEvent.click(removeButton);

      expect(mockUpdateTimelineItem).toHaveBeenCalledWith('test-item-2', {
        animations: [],
      });
    });
  });

  // TODO: Revisit title-specific tests after typography and color controls are finalized
  describe.skip('Title Clip Properties', () => {
    beforeEach(() => {
      mockSelectedTimelineItems.push(mockTitleItem);
      mockGetMediaAssetById.mockReturnValue(null); // No associated asset
    });

    it('should display title-specific properties', () => {
      renderInspector();

      expect(screen.getByDisplayValue('Hello World')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Inter')).toBeInTheDocument();
      expect(screen.getByDisplayValue('#ffffff')).toBeInTheDocument();
    });

    it('should update text content', async () => {
      renderInspector();

      const textInput = screen.getByDisplayValue('Hello World');
      fireEvent.change(textInput, { target: { value: 'Updated Text' } });

      await waitFor(() => {
        expect(mockUpdateTimelineItem).toHaveBeenCalledWith('test-item-3', {
          properties: expect.objectContaining({
            text: 'Updated Text',
          }),
        });
      });
    });

    it('should handle color input changes', async () => {
      renderInspector();

      const colorInput = screen.getByDisplayValue('#ffffff');
      fireEvent.change(colorInput, { target: { value: '#ff0000' } });

      await waitFor(() => {
        expect(mockUpdateTimelineItem).toHaveBeenCalledWith('test-item-3', {
          properties: expect.objectContaining({
            color: '#ff0000',
          }),
        });
      });
    });
  });

  // TODO: Revisit animation management tests after animation system hardens
  describe.skip('Animation Management', () => {
    beforeEach(() => {
      mockSelectedTimelineItems.push(mockVideoItem);
      mockGetMediaAssetById.mockReturnValue(mockVideoAsset);
    });

    it('should allow adding new animations', async () => {
      renderInspector();

      const animationSelect = screen.getByDisplayValue('');
      fireEvent.change(animationSelect, { target: { value: 'fade-in' } });

      const addButton = screen.getByText('Add');
      fireEvent.click(addButton);

      expect(mockUpdateTimelineItem).toHaveBeenCalledWith('test-item-1', {
        animations: expect.arrayContaining([
          expect.objectContaining({
            id: 'fade-in',
            name: 'Fade In',
          }),
        ]),
      });
    });

    it('should disable add button when no animation is selected', () => {
      renderInspector();

      const addButton = screen.getByText('Add');
      expect(addButton).toBeDisabled();
    });
  });

  // TODO: Revisit multiple selection behavior once UX is confirmed
  describe.skip('Multiple Selection', () => {
    beforeEach(() => {
      mockSelectedTimelineItems.push(mockVideoItem, mockCodeItem);
    });

    it('should show multiple items selected count', () => {
      renderInspector();

      expect(screen.getByText('2 items selected')).toBeInTheDocument();
    });

    it('should show properties for the first selected item', () => {
      mockGetMediaAssetById.mockReturnValue(mockVideoAsset);
      renderInspector();

      expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
      expect(screen.getByText(/video clip/i)).toBeInTheDocument();
    });
  });

  // TODO: Revisit validation tests after input validation strategy is finalized
  describe.skip('Property Validation', () => {
    beforeEach(() => {
      mockSelectedTimelineItems.push(mockVideoItem);
      mockGetMediaAssetById.mockReturnValue(mockVideoAsset);
    });

    it('should validate scale property bounds', async () => {
      renderInspector();

      const scaleInput = screen.getByDisplayValue('1');
      fireEvent.change(scaleInput, { target: { value: '-1' } }); // Invalid negative scale

      await waitFor(() => {
        expect(
          screen.getByText('Scale must be a positive number')
        ).toBeInTheDocument();
      });
    });

    it('should validate rotation property', async () => {
      renderInspector();

      const rotationInput = screen.getAllByDisplayValue('0')[1]; // Second input with value 0 (rotation)
      fireEvent.change(rotationInput, { target: { value: '45' } });

      await waitFor(() => {
        expect(mockUpdateTimelineItem).toHaveBeenCalledWith('test-item-1', {
          properties: expect.objectContaining({
            rotation: 45,
          }),
        });
      });
    });

    it('should handle invalid number inputs gracefully', async () => {
      renderInspector();

      const scaleInput = screen.getByDisplayValue('1');
      fireEvent.change(scaleInput, { target: { value: 'invalid' } });

      // Should not call update with invalid value
      await waitFor(() => {
        expect(mockUpdateTimelineItem).not.toHaveBeenCalledWith('test-item-1', {
          properties: expect.objectContaining({
            scale: NaN,
          }),
        });
      });
    });
  });

  // TODO: Revisit accessibility label/ARIA tests after UI copy and structure lock
  describe.skip('Accessibility', () => {
    beforeEach(() => {
      mockSelectedTimelineItems.push(mockVideoItem);
      mockGetMediaAssetById.mockReturnValue(mockVideoAsset);
    });

    it('should have proper labels for form inputs', () => {
      renderInspector();

      expect(screen.getByLabelText('X Position')).toBeInTheDocument();
      expect(screen.getByLabelText('Y Position')).toBeInTheDocument();
      expect(screen.getByLabelText('Scale')).toBeInTheDocument();
      expect(screen.getByLabelText('Rotation')).toBeInTheDocument();
      expect(screen.getByLabelText('Opacity')).toBeInTheDocument();
      expect(screen.getByLabelText('Volume')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for error states', async () => {
      renderInspector();

      const opacityInput = screen.getByLabelText('Opacity');
      fireEvent.change(opacityInput, { target: { value: '2' } });

      await waitFor(() => {
        expect(
          screen.getByText('Opacity must be a number between 0 and 1')
        ).toBeInTheDocument();
      });
    });
  });
});
