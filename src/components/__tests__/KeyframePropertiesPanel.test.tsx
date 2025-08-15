import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { KeyframePropertiesPanel } from '../KeyframePropertiesPanel';

vi.mock('../../state/hooks', () => ({
  useTimeline: () => ({ updateTimelineItem: vi.fn() }),
}));

const baseItem = {
  id: 'item1',
  duration: 10,
  properties: { opacity: 1, x: 0, y: 0, scale: 1, rotation: 0 },
  keyframes: [
    { id: 'k1', time: 0, properties: { opacity: 1 }, easing: 'linear' },
  ],
};

describe('KeyframePropertiesPanel', () => {
  it('renders placeholder when no item selected', () => {
    render(
      <KeyframePropertiesPanel selectedItem={null} selectedKeyframes={[]} />
    );
    expect(
      screen.getByText(/Select a timeline item to edit keyframes/i)
    ).toBeInTheDocument();
  });

  it('shows header and counts when item selected', () => {
    render(
      <KeyframePropertiesPanel
        selectedItem={baseItem as any}
        selectedKeyframes={[]}
      />
    );
    expect(screen.getByText(/Keyframe Properties/i)).toBeInTheDocument();
    expect(screen.getByText(/1 keyframe/)).toBeInTheDocument();
  });
});
