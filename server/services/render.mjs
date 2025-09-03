import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import { config } from '../config.mjs';

const jobs = new Map(); // id -> {status, output, error, progress?}
let bundleLocation = null;
let compositions = null;

// Simple in-process queue control
let active = 0;
const pending = [];

const ensureBundle = async () => {
  if (bundleLocation && compositions) return { bundleLocation, compositions };
  bundleLocation = await bundle({
    entryPoint: config.render.entryPoint,
    outDir: path.join(os.tmpdir(), 'synapse-remotion-bundle'),
  });
  compositions = await getCompositions(bundleLocation);
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

const runNext = async () => {
  if (active >= Math.max(1, Number(config.render.concurrency || 1))) return;
  const next = pending.shift();
  if (!next) return;
  active++;
  const { id, inputProps } = next;

  try {
    const { bundleLocation, compositions } = await ensureBundle();
    const composition = compositions.find((c) => c.id === config.render.compositionId);
    if (!composition) throw new Error(`Composition ${config.render.compositionId} not found`);

    const format = String(inputProps?.exportSettings?.format || 'mp4');
    const codec = String(inputProps?.exportSettings?.codec || 'h264');
    const out = path.join(config.render.outputDir, `${id}.${pickExtForFormat(format)}`);

    jobs.set(id, { status: 'rendering', output: out, progress: 0 });
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec,
      inputProps,
      outputLocation: out,
      // onProgress: currently limited; placeholder for future hook
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
