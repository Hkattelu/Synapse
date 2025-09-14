import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// We import the module under test after configuring env so it reads config.render.outputDir correctly
const TMP_DIR = path.join(process.cwd(), 'server', 'output-test');

const loadService = async () => {
  // Point render output to the temp dir via env var consumed by server/config.mjs
  process.env.RENDER_OUTPUT_DIR = TMP_DIR;
  const mod = await import('../../server/services/render.mjs');
  return mod as unknown as {
    listRendersByProject: (id: string) => Promise<any[]>;
    findRenderById: (id: string) => Promise<any | null>;
    deleteRenderById: (id: string) => Promise<{ ok: boolean }>;
  };
};

describe.skip('render service persistence', () => {
  beforeAll(async () => {
    await fs.promises.rm(TMP_DIR, { recursive: true, force: true });
    await fs.promises.mkdir(TMP_DIR, { recursive: true });
  });

  afterAll(async () => {
    await fs.promises.rm(TMP_DIR, { recursive: true, force: true });
  });

  it('lists and deletes persisted render metadata', async () => {
    const { listRendersByProject, deleteRenderById } = await loadService();

    // Prepare metadata file with two projects
    const metaPath = path.join(TMP_DIR, 'renders.json');
    const recA = { id: 'r1', projectId: 'p1', filename: 'a.mp4', path: path.join(TMP_DIR, 'a.mp4'), size: 10, createdAt: new Date(Date.now() - 1000).toISOString() };
    const recB = { id: 'r2', projectId: 'p2', filename: 'b.mp4', path: path.join(TMP_DIR, 'b.mp4'), size: 20, createdAt: new Date().toISOString() };
    await fs.promises.writeFile(metaPath, JSON.stringify([recA, recB], null, 2), 'utf-8');

    const listP1 = await listRendersByProject('p1');
    expect(listP1.length).toBe(1);
    expect(listP1[0].id).toBe('r1');

    // Delete r1 and verify it's gone
    const del = await deleteRenderById('r1');
    expect(del.ok).toBe(true);

    const listAfter = await listRendersByProject('p1');
    expect(listAfter.length).toBe(0);
  });
});
