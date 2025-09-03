import { describe, it, expect, beforeEach } from 'vitest';
import type { Project, TimelineItem, MediaAsset } from '../types';
import {
  previewProjectMigration,
  migrateProjectToEducationalTracks,
  validateProjectForMigration,
  getMigrationStatistics,
  clearAllBackups,
} from '../trackMigration';

function project(init?: Partial<Project>): Project {
  return {
    id: init?.id ?? 'p1',
    name: init?.name ?? 'Educational Demo',
    createdAt: init?.createdAt ?? new Date('2024-01-01'),
    updatedAt: init?.updatedAt ?? new Date('2024-01-02'),
    version: init?.version ?? '1.0.0',
    settings: init?.settings ?? {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 60,
      backgroundColor: '#000000',
    },
    timeline: init?.timeline ?? [],
    mediaAssets: init?.mediaAssets ?? [],
  };
}

function asset(id: string, type: MediaAsset['type'], name: string, extra?: Partial<MediaAsset>): MediaAsset {
  return {
    id,
    name,
    type,
    url: '',
    duration: type === 'image' ? undefined : 10,
    metadata: { fileSize: 1234, mimeType: type === 'audio' ? 'audio/wav' : type === 'video' ? 'video/mp4' : 'text/plain' },
    createdAt: new Date('2024-01-01'),
    ...extra,
  };
}

function item(id: string, assetId: string, type: TimelineItem['type'], track = 0): TimelineItem {
  return {
    id,
    assetId,
    startTime: 0,
    duration: 5,
    track,
    type,
    properties: {},
    animations: [],
    keyframes: [],
  };
}

describe('Educational migration (system)', () => {
  beforeEach(() => clearAllBackups());

  it('previews, migrates, and reports stats for a mixed project', () => {
    const proj = project();
    proj.mediaAssets = [
      asset('a-code', 'code', 'index.ts', { metadata: { fileSize: 1, mimeType: 'text/plain', language: 'typescript' } as any }),
      asset('a-video', 'video', 'screen-recording.mp4'),
      asset('a-audio', 'audio', 'voiceover.wav'),
    ];
    // Initially all placed on track 0 to force conflicts
    proj.timeline = [
      item('i-code', 'a-code', 'code', 0),
      item('i-video', 'a-video', 'video', 0),
      item('i-audio', 'a-audio', 'audio', 0),
    ];

    const preview = previewProjectMigration(proj);
    expect(preview.conflicts.length).toBeGreaterThan(0);
    expect(preview.trackAssignments.map((a) => a.suggestedTrack.name).sort()).toEqual(
      expect.arrayContaining(['Code', 'Visual', 'Narration'])
    );

    // Attempt migration with auto resolution disabled -> should return conflicts
    let result = migrateProjectToEducationalTracks(proj, { autoResolveConflicts: false });
    expect(result.success).toBe(false);
    expect(result.conflicts.length).toBeGreaterThan(0);

    // Now migrate with auto resolution (simulate user decisions via auto-analysis path)
    result = migrateProjectToEducationalTracks(proj, { autoResolveConflicts: true });
    expect(result.success).toBe(true);
    expect(result.migratedItems).toBe(3);
    // Items moved to their educational tracks (assert by identity instead of indices)
    const eduIds = (proj.timeline as any).map((t: any) => t.educationalTrack).filter(Boolean).sort();
    expect(eduIds).toEqual(['code', 'narration', 'visual']);

    // Stats reflect distribution
    const stats = getMigrationStatistics(proj);
    expect(stats.totalItems).toBe(3);
    expect(stats.itemsByTrack.Code).toBeGreaterThanOrEqual(1);
    expect(stats.itemsByTrack.Visual).toBeGreaterThanOrEqual(1);
    expect(stats.itemsByTrack.Narration).toBeGreaterThanOrEqual(1);
  });

  it('validates projects and reports orphaned items and unsupported types', () => {
    const proj = project({
      mediaAssets: [asset('a1', 'code', 'script.js')],
      timeline: [
        item('i1', 'a1', 'code', 0),
        item('i2', 'missing', 'code', 0), // orphaned
        item('i3', 'a1', 'title', 1),
        item('i4', 'a1', 'custom' as any, 1), // unsupported
      ],
    });

    const validation = validateProjectForMigration(proj);
    expect(validation.canMigrate).toBe(false);
    expect(validation.issues.join(' ')).toMatch(/orphaned|unsupported/i);
  });

  it('migrates even with missing assets using fallbacks and produces warnings', () => {
    const proj = project({
      mediaAssets: [], // none
      timeline: [item('i1', 'n/a', 'video', 0), item('i2', 'n/a', 'code', 0)],
    });
    const result = migrateProjectToEducationalTracks(proj, { autoResolveConflicts: true });
    expect(result.success).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    // Fallback places video on Visual and code on Code
    const names = proj.timeline.map((t) => t.educationalTrack);
    expect(names).toEqual(expect.arrayContaining(['visual', 'code']));
  });
});
