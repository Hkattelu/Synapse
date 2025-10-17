import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CodeEditorWorkflow } from '../CodeEditorWorkflow';
import { VideoWorkflow } from '../VideoWorkflow';
import { AssetsWorkflow } from '../AssetsWorkflow';
import { ContextualHelp } from '../ContextualHelp';
// Remove stray node:test imports

// Mock hooks
vi.mock('../../../state/hooks', () => ({
  useTimeline: () => ({
    addTimelineItem: vi.fn(),
  }),
  useMediaAssets: () => ({
    addMediaAsset: vi.fn().mockReturnValue('mock-asset-id'),
  }),
}));

vi.mock('../../../state/notifications', () => ({
  useNotifications: () => ({
    notify: vi.fn(),
  }),
}));

vi.mock('../../../lib/educationalTypes', () => ({
  getEducationalTrackByName: vi.fn().mockReturnValue({
    id: 'code',
    name: 'Code',
    trackNumber: 0,
    defaultProperties: {},
  }),
}));

describe('Content Addition Workflows', () => {
  describe('CodeEditorWorkflow', () => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
      onCodeAdded: vi.fn(),
    };

    it('renders code editor workflow when open', () => {
      render(<CodeEditorWorkflow {...defaultProps} />);

      expect(screen.getByText('Add Code to Timeline')).toBeInTheDocument();
      expect(screen.getByText('Code Templates')).toBeInTheDocument();
    });

    it('shows code templates by default', () => {
      render(<CodeEditorWorkflow {...defaultProps} />);

      expect(screen.getByText('Hello World (JavaScript)')).toBeInTheDocument();
      expect(
        screen.getByText('Function Example (JavaScript)')
      ).toBeInTheDocument();
    });

    it('loads template when clicked', () => {
      render(<CodeEditorWorkflow {...defaultProps} />);

      fireEvent.click(screen.getByText('Hello World (JavaScript)'));

      expect(
        screen.getByDisplayValue('Hello World (JavaScript)')
      ).toBeInTheDocument();
    });

    it('allows switching to custom code editor', () => {
      render(<CodeEditorWorkflow {...defaultProps} />);

      fireEvent.click(screen.getByText('Start from Scratch'));

      expect(
        screen.getByPlaceholderText('Enter your code here...')
      ).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<CodeEditorWorkflow {...defaultProps} isOpen={false} />);

      expect(
        screen.queryByText('Add Code to Timeline')
      ).not.toBeInTheDocument();
    });
  });

  describe('VideoWorkflow', () => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
      onVideoAdded: vi.fn(),
    };

    it('renders video workflow when open', () => {
      render(<VideoWorkflow {...defaultProps} />);

      expect(screen.getByText('Add Video to Timeline')).toBeInTheDocument();
      expect(screen.getByText('Choose Video Type')).toBeInTheDocument();
    });

    it('shows video type options', () => {
      render(<VideoWorkflow {...defaultProps} />);

      expect(screen.getByText('Screen Recording')).toBeInTheDocument();
      expect(screen.getByText('Talking Head')).toBeInTheDocument();
      expect(screen.getByText('Presentation Recording')).toBeInTheDocument();
      expect(screen.getByText('Live Demo')).toBeInTheDocument();
    });

    it('shows video configuration when type is selected', () => {
      render(<VideoWorkflow {...defaultProps} />);

      fireEvent.click(screen.getByText('Screen Recording'));

      expect(screen.getByText('Video Title')).toBeInTheDocument();
      expect(
        screen.getByText('Recording Tips for Screen Recording')
      ).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<VideoWorkflow {...defaultProps} isOpen={false} />);

      expect(
        screen.queryByText('Add Video to Timeline')
      ).not.toBeInTheDocument();
    });
  });

  describe('AssetsWorkflow', () => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
      onAssetsAdded: vi.fn(),
    };

    it('renders assets workflow when open', () => {
      render(<AssetsWorkflow {...defaultProps} />);

      expect(screen.getByText('Add Educational Assets')).toBeInTheDocument();
      expect(screen.getByText('Asset Categories')).toBeInTheDocument();
    });

    it('shows asset categories', () => {
      render(<AssetsWorkflow {...defaultProps} />);

      expect(screen.getByText('Images & Graphics')).toBeInTheDocument();
      expect(screen.getByText('Audio Files')).toBeInTheDocument();
      expect(screen.getByText('Documents & Files')).toBeInTheDocument();
      expect(screen.getByText('Animations & GIFs')).toBeInTheDocument();
    });

    it('shows empty state initially', () => {
      render(<AssetsWorkflow {...defaultProps} />);

      expect(screen.getByText('No Assets Selected')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Choose a category from the sidebar to upload educational assets'
        )
      ).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<AssetsWorkflow {...defaultProps} isOpen={false} />);

      expect(
        screen.queryByText('Add Educational Assets')
      ).not.toBeInTheDocument();
    });
  });

  describe('ContextualHelp', () => {
    it('renders help for code content', () => {
      render(<ContextualHelp type="code" />);

      expect(
        screen.getByText('Code Content Best Practices')
      ).toBeInTheDocument();
      expect(screen.getByText('Quick Tips')).toBeInTheDocument();
      expect(screen.getByText('Best Practices')).toBeInTheDocument();
      expect(screen.getByText('Examples')).toBeInTheDocument();
    });

    it('renders help for video content', () => {
      render(<ContextualHelp type="video" />);

      expect(screen.getByText('Video Content Guidelines')).toBeInTheDocument();
    });

    it('renders help for assets content', () => {
      render(<ContextualHelp type="assets" />);

      expect(screen.getByText('Educational Assets Guide')).toBeInTheDocument();
    });

    it('switches between help tabs', () => {
      render(<ContextualHelp type="code" />);

      // Default to tips
      expect(
        screen.getByText('Use syntax highlighting to improve readability')
      ).toBeInTheDocument();

      // Switch to best practices
      fireEvent.click(screen.getByText('Best Practices'));
      expect(
        screen.getByText('Start with simple examples before complex ones')
      ).toBeInTheDocument();

      // Switch to examples
      fireEvent.click(screen.getByText('Examples'));
      expect(
        screen.getByText('Function definitions with clear examples')
      ).toBeInTheDocument();
    });
  });
});

describe('Workflow Integration', () => {
  it('provides contextual guidance for educational content creation', () => {
    const { rerender } = render(<ContextualHelp type="code" />);

    expect(
      screen.getByText(/Create engaging code demonstrations/)
    ).toBeInTheDocument();

    rerender(<ContextualHelp type="video" />);
    expect(
      screen.getByText(/Create professional educational videos/)
    ).toBeInTheDocument();

    rerender(<ContextualHelp type="assets" />);
    expect(
      screen.getByText(/Select and organize visual and audio assets/)
    ).toBeInTheDocument();
  });

  it('supports educational workflow requirements', () => {
    // Test that workflows support the requirements from the spec
    render(
      <CodeEditorWorkflow
        isOpen={true}
        onClose={vi.fn()}
        onCodeAdded={vi.fn()}
      />
    );

    // Should provide code templates (Requirement 2.2)
    expect(screen.getByText('Code Templates')).toBeInTheDocument();

    // Should provide language selection (Requirement 2.2)
    expect(screen.getByText('Language')).toBeInTheDocument();

    // Should provide contextual help (Requirement 2.6)
    expect(screen.getByText('Code Content Best Practices')).toBeInTheDocument();
  });
});
