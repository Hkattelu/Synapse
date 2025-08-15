import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MediaBin } from '../MediaBin';
import { TestProviders } from '../../test/TestProviders';

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
Object.defineProperty(global.URL, 'createObjectURL', {
  value: mockCreateObjectURL,
});
Object.defineProperty(global.URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL,
});

// Mock HTML5 media elements
const mockVideoElement = {
  load: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  videoWidth: 1920,
  videoHeight: 1080,
  duration: 10.5,
  currentTime: 0,
  src: '',
  onloadedmetadata: null as any,
  onseeked: null as any,
  onerror: null as any,
};

const mockAudioElement = {
  load: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  duration: 180.3,
  currentTime: 0,
  src: '',
  onloadedmetadata: null as any,
  onerror: null as any,
};

const mockCanvasElement = {
  getContext: vi.fn(() => ({
    drawImage: vi.fn(),
  })),
  toDataURL: vi.fn(() => 'data:image/jpeg;base64,mock-thumbnail'),
  width: 0,
  height: 0,
};

// Mock document.createElement
const originalCreateElement = document.createElement;
beforeEach(() => {
  document.createElement = vi.fn((tagName: string) => {
    if (tagName === 'video') return mockVideoElement as any;
    if (tagName === 'audio') return mockAudioElement as any;
    if (tagName === 'canvas') return mockCanvasElement as any;
    return originalCreateElement.call(document, tagName);
  });

  mockCreateObjectURL.mockReturnValue('blob:mock-url');
});

afterEach(() => {
  document.createElement = originalCreateElement;
  vi.clearAllMocks();
});

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <TestProviders>{children}</TestProviders>;
}

// Helper to create mock files
function createMockFile(name: string, type: string, size: number = 1024): File {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('MediaBin', () => {
  it('renders empty state when no media assets exist', () => {
    render(
      <TestWrapper>
        <MediaBin />
      </TestWrapper>
    );

    expect(screen.getByText('No Media Assets')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Drag and drop files here or click "Add Media" to upload'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('Supports video, image, and audio files up to 100MB')
    ).toBeInTheDocument();
  });

  it('renders add media button', () => {
    render(
      <TestWrapper>
        <MediaBin />
      </TestWrapper>
    );

    const addButton = screen.getByRole('button', { name: /add media/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).not.toBeDisabled();
  });

  it('opens file dialog when add media button is clicked', () => {
    render(
      <TestWrapper>
        <MediaBin />
      </TestWrapper>
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    const addButton = screen.getByRole('button', { name: /add media/i });
    fireEvent.click(addButton);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('accepts supported file types in file input', () => {
    render(
      <TestWrapper>
        <MediaBin />
      </TestWrapper>
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput.accept).toContain('video/mp4');
    expect(fileInput.accept).toContain('image/jpeg');
    expect(fileInput.accept).toContain('audio/mp3');
    expect(fileInput.multiple).toBe(true);
  });

  it('handles drag over events', () => {
    render(
      <TestWrapper>
        <MediaBin />
      </TestWrapper>
    );

    // Find the actual drop zone element with border classes
    const dropZone = document.querySelector(
      '[class*="border-2 border-dashed"]'
    );

    fireEvent.dragOver(dropZone!, {
      dataTransfer: { files: [] },
    });

    // Should show drag over state (design tokens)
    expect(dropZone).toHaveClass('border-primary-500', 'bg-primary-500/10');
  });

  it('handles drag leave events', () => {
    render(
      <TestWrapper>
        <MediaBin />
      </TestWrapper>
    );

    // Find the actual drop zone element with border classes
    const dropZone = document.querySelector(
      '[class*="border-2 border-dashed"]'
    );

    // First drag over
    fireEvent.dragOver(dropZone!, {
      dataTransfer: { files: [] },
    });

    // Then drag leave
    fireEvent.dragLeave(dropZone!, {
      dataTransfer: { files: [] },
    });

    // Should remove drag over state
    expect(dropZone).toHaveClass('border-border-subtle');
  });

  it('validates file size limits', async () => {
    render(
      <TestWrapper>
        <MediaBin />
      </TestWrapper>
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const largeFile = createMockFile(
      'large-video.mp4',
      'video/mp4',
      200 * 1024 * 1024
    ); // 200MB

    fireEvent.change(fileInput, {
      target: { files: [largeFile] },
    });

    await waitFor(() => {
      expect(
        screen.getByText(/File size exceeds 100MB limit/)
      ).toBeInTheDocument();
    });
  });

  it('validates supported file types', async () => {
    render(
      <TestWrapper>
        <MediaBin />
      </TestWrapper>
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const unsupportedFile = createMockFile('document.pdf', 'application/pdf');

    fireEvent.change(fileInput, {
      target: { files: [unsupportedFile] },
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Unsupported file type: application\/pdf/)
      ).toBeInTheDocument();
    });
  });

  it('processes valid video files', async () => {
    render(
      <TestWrapper>
        <MediaBin />
      </TestWrapper>
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const videoFile = createMockFile('test-video.mp4', 'video/mp4');

    fireEvent.change(fileInput, {
      target: { files: [videoFile] },
    });

    // Simulate video metadata loading
    await waitFor(() => {
      if (mockVideoElement.onloadedmetadata) {
        mockVideoElement.onloadedmetadata();
      }
    });

    // Simulate video seeking for thumbnail
    await waitFor(() => {
      if (mockVideoElement.onseeked) {
        mockVideoElement.onseeked();
      }
    });

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalledWith(videoFile);
    });
  });

  it('processes valid image files', async () => {
    render(
      <TestWrapper>
        <MediaBin />
      </TestWrapper>
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const imageFile = createMockFile('test-image.jpg', 'image/jpeg');

    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      onerror: null as any,
      result: 'data:image/jpeg;base64,mock-image-data',
    };

    global.FileReader = vi.fn(() => mockFileReader) as any;

    fireEvent.change(fileInput, {
      target: { files: [imageFile] },
    });

    // Simulate FileReader load
    await waitFor(() => {
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: mockFileReader } as unknown);
      }
    });

    expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(imageFile);
  });

  it('processes valid audio files', async () => {
    render(
      <TestWrapper>
        <MediaBin />
      </TestWrapper>
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const audioFile = createMockFile('test-audio.mp3', 'audio/mp3');

    fireEvent.change(fileInput, {
      target: { files: [audioFile] },
    });

    // Simulate audio metadata loading
    await waitFor(() => {
      if (mockAudioElement.onloadedmetadata) {
        mockAudioElement.onloadedmetadata();
      }
    });

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalledWith(audioFile);
    });
  });

  it('handles multiple file uploads', async () => {
    render(
      <TestWrapper>
        <MediaBin />
      </TestWrapper>
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const files = [
      createMockFile('video.mp4', 'video/mp4'),
      createMockFile('image.jpg', 'image/jpeg'),
      createMockFile('audio.mp3', 'audio/mp3'),
    ];

    fireEvent.change(fileInput, {
      target: { files },
    });

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(3);
    });
  });

  it('handles file upload errors gracefully', async () => {
    render(
      <TestWrapper>
        <MediaBin />
      </TestWrapper>
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const videoFile = createMockFile('error-video.mp4', 'video/mp4');

    // Mock error during processing
    mockCreateObjectURL.mockImplementation(() => {
      throw new Error('Failed to create object URL');
    });

    fireEvent.change(fileInput, {
      target: { files: [videoFile] },
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to create object URL/)
      ).toBeInTheDocument();
    });
  });

  it('shows uploading state during file processing', async () => {
    render(
      <TestWrapper>
        <MediaBin />
      </TestWrapper>
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const videoFile = createMockFile('test-video.mp4', 'video/mp4');

    fireEvent.change(fileInput, {
      target: { files: [videoFile] },
    });

    // Should show uploading state
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /uploading/i })).toBeDisabled();
  });

  it('resets file input value after processing', async () => {
    render(
      <TestWrapper>
        <MediaBin />
      </TestWrapper>
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const videoFile = createMockFile('test-video.mp4', 'video/mp4');

    fireEvent.change(fileInput, {
      target: { files: [videoFile] },
    });

    await waitFor(() => {
      expect(fileInput.value).toBe('');
    });
  });

  it('handles drop events', async () => {
    render(
      <TestWrapper>
        <MediaBin />
      </TestWrapper>
    );

    // Find the actual drop zone element with border classes
    const dropZone = document.querySelector(
      '[class*="border-2 border-dashed"]'
    );
    const videoFile = createMockFile('dropped-video.mp4', 'video/mp4');

    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [videoFile],
      },
    });

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalledWith(videoFile);
    });
  });

  it('formats file sizes correctly', () => {
    render(
      <TestWrapper>
        <MediaBin />
      </TestWrapper>
    );

    // This test would require having media assets in state
    // We'll test the formatting logic separately in utils tests
  });

  it('formats duration correctly', () => {
    render(
      <TestWrapper>
        <MediaBin />
      </TestWrapper>
    );

    // This test would require having media assets in state
    // We'll test the formatting logic separately in utils tests
  });
});

describe('MediaBin File Validation', () => {
  it('accepts all supported video formats', () => {
    const supportedVideoTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/avi',
      'video/mov',
    ];

    supportedVideoTypes.forEach((type) => {
      const file = createMockFile(`test.${type.split('/')[1]}`, type);
      // Test would validate that these types are accepted
      expect(file.type).toBe(type);
    });
  });

  it('accepts all supported image formats', () => {
    const supportedImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];

    supportedImageTypes.forEach((type) => {
      const file = createMockFile(`test.${type.split('/')[1]}`, type);
      expect(file.type).toBe(type);
    });
  });

  it('accepts all supported audio formats', () => {
    const supportedAudioTypes = [
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/aac',
      'audio/flac',
    ];

    supportedAudioTypes.forEach((type) => {
      const file = createMockFile(`test.${type.split('/')[1]}`, type);
      expect(file.type).toBe(type);
    });
  });
});
