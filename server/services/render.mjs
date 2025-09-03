import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import { config } from '../config.mjs';

const jobs = new Map(); // id -> {status, output, error}
let bundleLocation = null;
let compositions = null;

const ensureBundle = async () => {
  if (bundleLocation && compositions) return { bundleLocation, compositions };
  bundleLocation = await bundle({
    entryPoint: config.render.entryPoint,
    outDir: path.join(os.tmpdir(), 'synapse-remotion-bundle'),
  });
  compositions = await getCompositions(bundleLocation);
  return { bundleLocation, compositions };
};

export const startRender = async ({ inputProps, codec = 'h264', outputExt = 'mp4' }) => {
  await fs.promises.mkdir(config.render.outputDir, { recursive: true });
  const id = randomUUID();
  jobs.set(id, { status: 'queued' });

  (async () => {
    try {
      const { bundleLocation, compositions } = await ensureBundle();
      const composition = compositions.find((c) => c.id === config.render.compositionId);
      if (!composition) throw new Error(`Composition ${config.render.compositionId} not found`);
      const out = path.join(config.render.outputDir, `${id}.${outputExt}`);
      jobs.set(id, { status: 'rendering', output: out });
      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec,
        inputProps,
        outputLocation: out,
      });
      jobs.set(id, { status: 'completed', output: out });
    } catch (e) {
      jobs.set(id, { status: 'failed', error: String(e?.stack || e) });
    }
  })();

  return { jobId: id };
};

export const getJob = (id) => jobs.get(id) || null;
