# Design Document

## Overview

The simplified educational UI transforms the current flexible track system into a streamlined, purpose-built interface for educational content creation. Instead of generic numbered tracks, the system will provide 4 predefined tracks specifically designed for educational workflows: Code, Visual, Narration, and "You". This design maintains all existing functionality while presenting a more intuitive interface that guides users toward best practices for educational video creation.

## Architecture

### Track System Redesign

The new track system builds upon the existing timeline infrastructure but adds semantic meaning and specialized behavior to each track:

```typescript
interface EducationalTrack {
  id: string;
  name: 'Code' | 'Visual' | 'Narration' | 'You';
  trackNumber: number; // Maps to existing track system (0-3)
  color: string;
  icon: string;
  defaultProperties: Partial<ItemProperties>;
  allowedContentTypes: TimelineItemType[];
  suggestedAnimations: string[];
}
```

### UI Mode System

The interface will support two modes to accommodate different user needs:

```typescript
interface UIMode {
  mode: 'simplified' | 'advanced';
  showTrackLabels: boolean;
  showAdvancedControls: boolean;
  enableCustomTracks: boolean;
}
```

### Content Addition Workflow

The new system introduces prominent content addition buttons that streamline the creation process:

```typescript
interface ContentAdditionButton {
  type: 'code' | 'video' | 'assets';
  label: string;
  icon: string;
  targetTrack: EducationalTrack;
  defaultAction: () => void;
  quickActions: QuickAction[];
}
```

## Components and Interfaces

### 1. Educational Timeline Component

**Location**: `src/components/EducationalTimeline.tsx`

Extends the existing Timeline component with educational-specific features:

```typescript
interface EducationalTimelineProps {
  mode: 'simplified' | 'advanced';
  onModeChange: (mode: 'simplified' | 'advanced') => void;
}
```

**Key Features**:
- Fixed 4-track layout with semantic labels
- Track-specific styling and colors
- Smart content placement suggestions
- Educational animation presets per track

### 2. Content Addition Toolbar

**Location**: `src/components/ContentAdditionToolbar.tsx`

Replaces or enhances the existing toolbar with prominent educational content buttons:

```typescript
interface ContentAdditionToolbarProps {
  onAddCode: () => void;
  onAddVideo: (type: 'screen-recording' | 'talking-head') => void;
  onAddAssets: () => void;
}
```

**Button Specifications**:
- **Add Code**: Opens code editor, creates item on Code track
- **Add Video**: Provides screen recording vs talking head options
- **Add Assets**: Opens media library with educational asset categories

### 3. Educational Track Component

**Location**: `src/components/EducationalTrack.tsx`

Specialized track component with educational-specific features:

```typescript
interface EducationalTrackProps {
  track: EducationalTrack;
  items: TimelineItem[];
  isActive: boolean;
  onItemDrop: (item: TimelineItem) => void;
}
```

**Track-Specific Features**:
- **Code Track**: Syntax highlighting preview, language indicators
- **Visual Track**: Thumbnail previews, screen recording indicators
- **Narration Track**: Waveform visualization, audio level meters
- **You Track**: Talking head indicators, background removal status

### 4. Smart Content Placement System

**Location**: `src/lib/educationalPlacement.ts`

Intelligent system for suggesting appropriate track placement:

```typescript
interface PlacementSuggestion {
  suggestedTrack: EducationalTrack;
  confidence: number;
  reason: string;
  alternatives: EducationalTrack[];
}

function suggestTrackPlacement(
  asset: MediaAsset,
  context: TimelineContext
): PlacementSuggestion;
```

**Placement Logic**:
- Code files → Code track
- Screen recordings → Visual track
- Personal videos → You track
- Audio files → Narration track
- Images/graphics → Visual track (with user confirmation)

### 5. Migration System

**Location**: `src/lib/trackMigration.ts`

Handles conversion of existing projects to the new track system:

```typescript
interface MigrationResult {
  success: boolean;
  migratedItems: number;
  conflicts: MigrationConflict[];
  warnings: string[];
}

function migrateProjectToEducationalTracks(
  project: Project
): MigrationResult;
```

## Data Models

### Educational Track Configuration

```typescript
const EDUCATIONAL_TRACKS: EducationalTrack[] = [
  {
    id: 'code',
    name: 'Code',
    trackNumber: 0,
    color: '#8B5CF6', // Purple
    icon: 'code',
    defaultProperties: {
      theme: 'vscode-dark-plus',
      fontSize: 16,
      showLineNumbers: true,
      animationMode: 'typing'
    },
    allowedContentTypes: ['code'],
    suggestedAnimations: ['typewriter', 'lineFocus', 'diffHighlight']
  },
  {
    id: 'visual',
    name: 'Visual',
    trackNumber: 1,
    color: '#10B981', // Green
    icon: 'monitor',
    defaultProperties: {
      autoFocus: true,
      focusScale: 1.2
    },
    allowedContentTypes: ['video', 'image', 'visual-asset'],
    suggestedAnimations: ['kenBurns', 'slide', 'fade']
  },
  {
    id: 'narration',
    name: 'Narration',
    trackNumber: 2,
    color: '#F59E0B', // Amber
    icon: 'mic',
    defaultProperties: {
      volume: 0.8
    },
    allowedContentTypes: ['audio'],
    suggestedAnimations: ['fade']
  },
  {
    id: 'you',
    name: 'You',
    trackNumber: 3,
    color: '#EF4444', // Red
    icon: 'user',
    defaultProperties: {
      talkingHeadEnabled: true,
      talkingHeadCorner: 'bottom-right',
      talkingHeadSize: 'md'
    },
    allowedContentTypes: ['video'],
    suggestedAnimations: ['fade', 'slide']
  }
];
```

### Enhanced Timeline Item

Extends existing TimelineItem with educational metadata:

```typescript
interface EducationalTimelineItem extends TimelineItem {
  educationalTrack?: string; // Maps to EducationalTrack.id
  suggestedTrack?: string; // For migration conflicts
  educationalMetadata?: {
    contentPurpose: 'demonstration' | 'explanation' | 'narration' | 'personal';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
  };
}
```

## Error Handling

### Track Placement Conflicts

When users attempt to place content on inappropriate tracks:

```typescript
interface TrackConflictHandler {
  onInvalidPlacement: (item: TimelineItem, track: EducationalTrack) => void;
  onSuggestAlternative: (suggestions: PlacementSuggestion[]) => void;
  onForceOverride: (item: TimelineItem, track: EducationalTrack) => void;
}
```

**Conflict Resolution**:
1. Show warning dialog with explanation
2. Suggest appropriate alternative tracks
3. Allow override with confirmation
4. Provide educational guidance on track usage

### Migration Conflicts

For existing projects with complex track arrangements:

```typescript
interface MigrationConflictResolver {
  onMultipleItemsPerTrack: (items: TimelineItem[], track: number) => EducationalTrack[];
  onUnknownContentType: (item: TimelineItem) => EducationalTrack;
  onUserDecision: (conflicts: MigrationConflict[]) => MigrationDecision[];
}
```

## Testing Strategy

### Unit Tests

1. **Track Placement Logic**
   - Test content type to track mapping
   - Validate placement suggestions
   - Test conflict detection

2. **Migration System**
   - Test various project structures
   - Validate data preservation
   - Test conflict resolution

3. **UI Components**
   - Test educational track rendering
   - Validate content addition workflows
   - Test mode switching

### Integration Tests

1. **End-to-End Workflows**
   - Complete educational video creation
   - Content addition and placement
   - Export with educational tracks

2. **Migration Testing**
   - Test with real existing projects
   - Validate backward compatibility
   - Test rollback scenarios

### User Experience Testing

1. **First-Time User Experience**
   - Onboarding flow effectiveness
   - Content addition intuitiveness
   - Track understanding

2. **Existing User Transition**
   - Migration experience
   - Feature discovery
   - Advanced mode usage

## Visual Design Specifications

### Track Visual Identity

Each track has distinct visual characteristics:

- **Code Track**: Purple theme, monospace font previews, syntax highlighting
- **Visual Track**: Green theme, thumbnail previews, screen recording icons
- **Narration Track**: Amber theme, waveform visualizations, audio meters
- **You Track**: Red theme, circular thumbnails, talking head indicators

### Content Addition Buttons

Large, prominent buttons with clear visual hierarchy:

```css
.content-addition-button {
  min-height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.2s ease;
}

.content-addition-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}
```

### Timeline Track Headers

Enhanced track headers with educational context:

```css
.educational-track-header {
  background: linear-gradient(135deg, var(--track-color), var(--track-color-light));
  padding: 12px 16px;
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.track-icon {
  width: 20px;
  height: 20px;
  color: white;
}

.track-name {
  font-weight: 600;
  color: white;
  font-size: 14px;
}
```

## Performance Considerations

### Lazy Loading

Educational tracks will implement lazy loading for better performance:

- Track content loads only when visible
- Thumbnail generation happens asynchronously
- Waveform visualization loads on demand

### Memory Management

- Efficient track switching without full re-renders
- Optimized timeline item rendering for educational metadata
- Smart caching of educational presets and suggestions

### Responsive Design

The simplified interface adapts to different screen sizes:

- Mobile: Stacked track view with swipe navigation
- Tablet: Compact track layout with touch-friendly controls
- Desktop: Full educational timeline with all features

This design maintains the powerful flexibility of the existing system while providing a streamlined, educational-focused user experience that guides users toward creating effective educational content.