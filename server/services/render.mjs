import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import { config } from '../config.mjs';

const jobs = new Map(); // id -> {status, phase, output, error, progress?, lastUpdated}
let bundleLocation = null;

const setJob = (id, updates = {}) => {
  const existing = jobs.get(id) || {};
  const lastUpdated = new Date().toISOString();
  jobs.set(id, { ...existing, ...updates, lastUpdated });
};

// Simple in-process queue control
let active = 0;
const pending = [];

// Persistent render metadata storage (simple JSON file)
const META_FILE = path.join(config.render.outputDir, 'renders.json');

const readMeta = async () => {
  try {
    const raw = await fs.promises.readFile(META_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const writeMeta = async (arr) => {
  try {
    await fs.promises.mkdir(config.render.outputDir, { recursive: true });
    await fs.promises.writeFile(META_FILE, JSON.stringify(arr, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[render] failed to persist render metadata:', e);
  }
};
// TODO(housekeeping): Consider locking or atomic writes to avoid concurrent write hazards.
// TODO(housekeeping): Add retention policy (max items per project, max age, max total size) and background cleanup.

export const listRendersByProject = async (projectId) => {
  if (!projectId) return [];
  const all = await readMeta();
  return all
    .filter((r) => r && r.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const findRenderById = async (id) => {
  const all = await readMeta();
  return all.find((r) => r.id === id) || null;
};

export const deleteRenderById = async (id) => {
  const all = await readMeta();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return { ok: false, reason: 'not_found' };
  const record = all[idx];
  try {
    if (record?.path) {
      await fs.promises.unlink(record.path).catch(() => {});
    }
  } catch {}
  all.splice(idx, 1);
  await writeMeta(all);
  return { ok: true };
};

const ensureBundle = async (inputProps) => {
  // Helper to verify a bundle directory contains an index.html
  const hasIndexHtml = async (dir) => {
    try {
      const p = path.join(dir, 'index.html');
      await fs.promises.access(p, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  };

  // Build (or rebuild) if we don't have a valid bundle yet
  if (!bundleLocation || !(await hasIndexHtml(bundleLocation))) {
    // Use a unique temp dir to avoid partial/locked bundles on Windows
    const outDir = path.join(
      os.tmpdir(),
      `synapse-remotion-bundle-${randomUUID().slice(0, 8)}`
    );
    await fs.promises.mkdir(outDir, { recursive: true }).catch(() => {});

    console.log('[render] bundling Remotion project…', {
      entryPoint: config.render.entryPoint,
      outDir,
    });

    const serveUrl = await bundle({
      entryPoint: config.render.entryPoint,
      outDir,
    });

    // Validate bundle has index.html; if not, fail fast with a helpful error
    if (!(await hasIndexHtml(serveUrl))) {
      throw new Error(
        `Remotion bundle is missing index.html at ${path.join(
          serveUrl,
          'index.html'
        )}`
      );
    }

    bundleLocation = serveUrl;
  }

  // Always fetch compositions with the current inputProps so any prop-dependent logic applies
  const compositions = await getCompositions(bundleLocation, { inputProps });
  return { bundleLocation, compositions };
};

const pickExtForFormat = (format) => {
  switch (format) {
    case 'mp4':
      return 'mp4';
    case 'webm':
      return 'webm';
    case 'mov':
      return 'mov';
    default:
      return 'mp4';
  }
};

const sanitizeBase = (name) => {
  if (!name || typeof name !== 'string') return '';
  const cleaned = name
    .trim()
    .replace(/[^a-zA-Z0-9 _.-]+/g, '-')
    .replace(/-+/g, '-');
  return cleaned || '';
};

const runNext = async () => {
  if (active >= Math.max(1, Number(config.render.concurrency || 1))) return;
  const next = pending.shift();
  if (!next) return;
  active++;
  const { id, inputProps } = next;

  try {
    // Mark phase: preparing/bundling
    setJob(id, { status: 'preparing', phase: 'bundling' });

    // Log a small debug line for troubleshooting (safe, no PII)
    console.log('[render] starting job', id, {
      timeline: Array.isArray(inputProps?.timeline)
        ? inputProps.timeline.length
        : 0,
      mediaAssets: Array.isArray(inputProps?.mediaAssets)
        ? inputProps.mediaAssets.length
        : 0,
    });

    const { bundleLocation, compositions } = await ensureBundle(inputProps);

    // After bundling, move to rendering phase (once composition is ready below)
    const composition = compositions.find(
      (c) => c.id === config.render.compositionId
    );
    if (!composition)
      throw new Error(`Composition ${config.render.compositionId} not found`);

    // Transition to rendering
    setJob(id, { status: 'rendering', phase: 'rendering', progress: 0 });

    const format = String(inputProps?.exportSettings?.format || 'mp4');
    const codec = String(inputProps?.exportSettings?.codec || 'h264');
    // Honor custom output filename if provided, else default to id.ext
    let base = sanitizeBase(inputProps?.outputFilename);
    const ext = pickExtForFormat(format);
    if (base) {
      // Strip any provided extension and enforce correct ext
      base = base.replace(/\.[a-zA-Z0-9]+$/, '');
    }
    const filename = `${base || id}.${ext}`;
    const out = path.join(config.render.outputDir, filename);

    // Initialize job output before progress updates
    setJob(id, { status: 'rendering', output: out, progress: 0 });
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec,
      inputProps,
      outputLocation: out,
      onProgress: (p) => {
        // Forward basic progress when possible
        const total =
          (p && (p.totalFrames || p.totalFrameCount)) ||
          composition?.durationInFrames ||
          0;
        const rendered = (p && (p.encodedFrames || p.renderedFrames)) || 0;
        const percent =
          total > 0 ? Math.min(100, Math.round((rendered / total) * 100)) : 0;
        setJob(id, {
          status: 'rendering',
          output: out,
          progress: percent,
          renderedFrames: rendered,
          totalFrames: total,
        });
      },
    });

    // Persist metadata when completed
    const stat = await fs.promises.stat(out).catch(() => null);
    const createdAt = new Date().toISOString();
    const projectId = inputProps?.project?.id || inputProps?.projectId || null;
    const projectName = inputProps?.project?.name || inputProps?.projectName || undefined;
    const record = {
      id,
      projectId,
      projectName,
      filename,
      path: out,
      size: stat?.size || 0,
      format,
      codec,
      createdAt,
      publicUrl: `/downloads/${path.basename(out)}`,
    };
    const all = await readMeta();
    all.push(record);
    await writeMeta(all);

    setJob(id, { status: 'completed', phase: 'completed', output: out, progress: 100, completedAt: new Date().toISOString() });
  } catch (e) {
    setJob(id, { status: 'failed', phase: 'failed', error: String(e?.stack || e) });
  } finally {
    active = Math.max(0, active - 1);
    // Trigger next job
    void runNext();
  }
};

export const startRender = async ({ inputProps }) => {
  await fs.promises.mkdir(config.render.outputDir, { recursive: true });
  const id = randomUUID();
  setJob(id, { status: 'queued', phase: 'queued', progress: 0, createdAt: new Date().toISOString() });
  pending.push({ id, inputProps });
  // Try to run immediately if capacity
  void runNext();
  return { jobId: id };
};

export const getJob = (id) => jobs.get(id) || null;

export const getJobWithMeta = (id) => {
  const job = getJob(id);
  const position = pending.findIndex((p) => p && p.id === id);
  const queuePosition = position >= 0 ? position + 1 : 0;
  const pendingCount = pending.length;
  const activeCount = active;
  const concurrency = Math.max(1, Number(config.render.concurrency || 1));
  if (!job) {
    return {
      status: 'queued',
      phase: 'queued',
      queuePosition,
      pendingCount,
      activeCount,
      concurrency,
      lastUpdated: new Date().toISOString(),
    };
  }
  return {
    ...job,
    queuePosition,
    pendingCount,
    activeCount,
    concurrency,
  };
};
