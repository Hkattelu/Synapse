import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import { config } from '../config.mjs';

const jobs = new Map(); // id -> {status, output, error, progress?}
let bundleLocation = null;

// Simple in-process queue control
let active = 0;
const pending = [];

const ensureBundle = async (inputProps) => {
  // Bundle once and reuse; compositions may depend on inputProps, so query fresh each time
  if (!bundleLocation) {
    bundleLocation = await bundle({
      entryPoint: config.render.entryPoint,
      outDir: path.join(os.tmpdir(), 'synapse-remotion-bundle'),
    });
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
    const composition = compositions.find(
      (c) => c.id === config.render.compositionId
    );
    if (!composition)
      throw new Error(`Composition ${config.render.compositionId} not found`);

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

    jobs.set(id, { status: 'rendering', output: out, progress: 0 });
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
        const existing = jobs.get(id) || {};
        jobs.set(id, {
          ...existing,
          status: 'rendering',
          output: out,
          progress: percent,
          renderedFrames: rendered,
          totalFrames: total,
        });
      },
    });
    jobs.set(id, { status: 'completed', output: out, progress: 100 });
  } catch (e) {
    jobs.set(id, { status: 'failed', error: String(e?.stack || e) });
  } finally {
    active = Math.max(0, active - 1);
    // Trigger next job
    void runNext();
  }
};

export const startRender = async ({ inputProps }) => {
  await fs.promises.mkdir(config.render.outputDir, { recursive: true });
  const id = randomUUID();
  jobs.set(id, { status: 'queued' });
  pending.push({ id, inputProps });
  // Try to run immediately if capacity
  void runNext();
  return { jobId: id };
};

export const getJob = (id) => jobs.get(id) || null;
