import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import YouTrackFeatures from '../YouTrackFeatures';
import type { TimelineItem } from '../../lib/types';

// Mock the talking head detection
vi.mock('../../lib/youTrackFeatures', async () => {
  const actual = await vi.importActual('../../lib/youTrackFeatures');
  return {
    ...actual,
    detectTalkingHead: vi.fn().mockResolvedValue({
      hasFace: true,
      faceConfidence: 85,
      faceBounds: { x: 100, y: 50, width: 200, height: 300 },
      isOptimal: true,
      suggestions: ['Good lighting detected', 'Face is well-centered']
    })
  };
});

describe('YouTrackFeatures', () => {
  const mockItem: TimelineItem = {
    id: 'test-item',
    type: 'video',
    src: '/test-video.mp4',
    startTime: 0,
    duration: 30,
    properties: {
      talkingHeadEnabled: false,
      talkingHeadCorner: 'bottom-right',
      talkingHeadSize: 'md',
      backgroundRemoval: false,
      backgroundBlur: 0,
      volume: 0.8
    }
  };

  const mockOnUpdateProperties = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders talking head detection section', () => {
    render(
      <YouTrackFeatures
        item={mockItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    expect(screen.getByText('Talking Head Detection')).toBeInTheDocument();
    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
  });

  it('renders picture-in-picture controls', () => {
    render(
      <YouTrackFeatures
        item={mockItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    expect(screen.getByText('Picture-in-Picture')).toBeInTheDocument();
    expect(screen.getByText('Position')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
  });

  it('updates PiP position when button is clicked', () => {
    render(
      <YouTrackFeatures
        item={mockItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    const topLeftButton = screen.getByRole('button', { name: /top left/i });
    fireEvent.click(topLeftButton);

    expect(mockOnUpdateProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        talkingHeadEnabled: true,
        talkingHeadCorner: 'top-left'
      })
    );
  });

  it('updates PiP size when button is clicked', () => {
    render(
      <YouTrackFeatures
        item={mockItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    const largeButton = screen.getByRole('button', { name: /large/i });
    fireEvent.click(largeButton);

    expect(mockOnUpdateProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        talkingHeadEnabled: true,
        talkingHeadSize: 'lg'
      })
    );
  });

  it('renders background options', () => {
    render(
      <YouTrackFeatures
        item={mockItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    expect(screen.getByText('Background')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /none/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /blur/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  it('updates background options when blur is selected', () => {
    render(
      <YouTrackFeatures
        item={mockItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    const blurButton = screen.getByRole('button', { name: /blur/i });
    fireEvent.click(blurButton);

    expect(mockOnUpdateProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        backgroundRemoval: false,
        backgroundBlur: 0.5
      })
    );
  });

  it('updates background options when remove is selected', () => {
    render(
      <YouTrackFeatures
        item={mockItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    expect(mockOnUpdateProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        backgroundRemoval: true,
        backgroundBlur: 0
      })
    );
  });

  it('shows blur amount slider when blur is selected', () => {
    render(
      <YouTrackFeatures
        item={mockItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    const blurButton = screen.getByRole('button', { name: /blur/i });
    fireEvent.click(blurButton);

    expect(screen.getByText('Blur Amount')).toBeInTheDocument();
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThan(2); // Should have border radius, opacity, and blur amount sliders
  });

  it('renders professional templates', () => {
    render(
      <YouTrackFeatures
        item={mockItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    expect(screen.getByText('Professional Templates')).toBeInTheDocument();
    expect(screen.getByText('Professional Corner')).toBeInTheDocument();
    expect(screen.getByText('Center Stage')).toBeInTheDocument();
    expect(screen.getByText('Split Screen')).toBeInTheDocument();
    expect(screen.getByText('Picture Frame')).toBeInTheDocument();
  });

  it('applies template when clicked', () => {
    render(
      <YouTrackFeatures
        item={mockItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    const professionalCornerTemplate = screen.getByText('Professional Corner').closest('div');
    if (professionalCornerTemplate) {
      fireEvent.click(professionalCornerTemplate);
    }

    expect(mockOnUpdateProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        talkingHeadEnabled: true,
        presentationTemplate: 'professional-corner'
      })
    );
  });

  it('shows validation warnings for non-video content', () => {
    const nonVideoItem: TimelineItem = {
      ...mockItem,
      type: 'audio'
    };

    render(
      <YouTrackFeatures
        item={nonVideoItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    expect(screen.getByText('Recommendations')).toBeInTheDocument();
    expect(screen.getByText(/You track is optimized for video content/)).toBeInTheDocument();
  });

  it('shows suggestions when talking head is not enabled', () => {
    render(
      <YouTrackFeatures
        item={mockItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    expect(screen.getByText(/Enable talking head mode/)).toBeInTheDocument();
  });

  it('updates border radius with slider', () => {
    render(
      <YouTrackFeatures
        item={mockItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    const borderRadiusSlider = screen.getByDisplayValue('8'); // Default border radius
    fireEvent.change(borderRadiusSlider, { target: { value: '12' } });

    expect(mockOnUpdateProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        borderRadius: 12
      })
    );
  });

  it('updates opacity with slider', () => {
    render(
      <YouTrackFeatures
        item={mockItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    const opacitySlider = screen.getByDisplayValue('1'); // Default opacity
    fireEvent.change(opacitySlider, { target: { value: '0.8' } });

    expect(mockOnUpdateProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        opacity: 0.8
      })
    );
  });

  it('toggles shadow option', () => {
    render(
      <YouTrackFeatures
        item={mockItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    const shadowCheckbox = screen.getByRole('checkbox', { name: /drop shadow/i });
    
    // The checkbox starts as checked (true), so clicking it should make it false
    // But the component logic should toggle it to true
    fireEvent.click(shadowCheckbox);

    expect(mockOnUpdateProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        shadow: false // The checkbox was initially checked, so clicking unchecks it
      })
    );
  });

  it('updates border color', () => {
    render(
      <YouTrackFeatures
        item={mockItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    const colorInput = screen.getByDisplayValue('#ffffff');
    fireEvent.change(colorInput, { target: { value: '#ff0000' } });

    expect(mockOnUpdateProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        borderColor: '#ff0000'
      })
    );
  });

  it('shows green screen options when selected', () => {
    render(
      <YouTrackFeatures
        item={mockItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    const greenScreenButton = screen.getByRole('button', { name: /green screen/i });
    fireEvent.click(greenScreenButton);

    expect(screen.getByText('Chroma Key Color')).toBeInTheDocument();
    expect(screen.getByText('Tolerance')).toBeInTheDocument();
  });

  it('displays PiP preview with correct positioning', () => {
    render(
      <YouTrackFeatures
        item={mockItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    const previews = screen.getAllByText('Preview');
    expect(previews.length).toBeGreaterThan(0);
    
    // The preview should show the PiP element
    const pipElement = screen.getByText('You');
    expect(pipElement).toBeInTheDocument();
  });

  it('handles video load event for talking head detection', async () => {
    const { detectTalkingHead } = await import('../../lib/youTrackFeatures');
    
    render(
      <YouTrackFeatures
        item={mockItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    
    if (video) {
      fireEvent.loadedData(video);

      await waitFor(() => {
        expect(detectTalkingHead).toHaveBeenCalledWith(video);
      });
    }
  });

  it('shows detection results after analysis', async () => {
    render(
      <YouTrackFeatures
        item={mockItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    const video = document.querySelector('video');
    if (video) {
      fireEvent.loadedData(video);

      await waitFor(() => {
        expect(screen.getByText('Face Detected')).toBeInTheDocument();
        expect(screen.getByText('(85% confidence)')).toBeInTheDocument();
      });
    }
  });

  it('shows apply optimizations button when face is detected', async () => {
    render(
      <YouTrackFeatures
        item={mockItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    const video = document.querySelector('video');
    if (video) {
      fireEvent.loadedData(video);

      await waitFor(() => {
        const optimizeButton = screen.getByRole('button', { name: /apply optimizations/i });
        expect(optimizeButton).toBeInTheDocument();
      });
    }
  });

  it('applies optimizations when button is clicked', async () => {
    render(
      <YouTrackFeatures
        item={mockItem}
        onUpdateProperties={mockOnUpdateProperties}
      />
    );

    const video = document.querySelector('video');
    if (video) {
      fireEvent.loadedData(video);

      await waitFor(() => {
        const optimizeButton = screen.getByRole('button', { name: /apply optimizations/i });
        fireEvent.click(optimizeButton);
      });

      expect(mockOnUpdateProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          talkingHeadEnabled: true,
          backgroundRemoval: true
        })
      );
    }
  });
});