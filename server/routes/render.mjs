import { Router } from 'express';
import { startRender, getJob, getJobWithMeta, listRendersByProject, findRenderById, deleteRenderById } from '../services/render.mjs';
import path from 'node:path';
import fs from 'node:fs';
import { validateRenderInput } from '../validation/validators.mjs';

export const renderRouter = Router();

// List renders by project
// TODO(auth): Protect this endpoint with session/membership checks and verify project ownership.
// TODO(rate-limit): Consider per-user rate limiting for list requests.
renderRouter.get('/', async (req, res) => {
  const projectId = String(req.query.projectId || '');
  if (!projectId) return res.status(400).json({ error: 'projectId is required' });
  try {
    const items = await listRendersByProject(projectId);
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: 'Failed to list renders' });
  }
});

renderRouter.post('/', async (req, res) => {
  try {
    const inputProps = req.body || {};
    const { valid, errors } = validateRenderInput(inputProps);
    if (!valid) return res.status(400).json({ error: errors.join('; ') });

    const { jobId } = await startRender({ inputProps });
    res.json({ jobId });
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

renderRouter.get('/:id/status', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) {
    const enriched = getJobWithMeta(req.params.id);
    if (!enriched) return res.status(404).json({ error: 'Not found' });
    return res.json(enriched);
  }
  const enriched = getJobWithMeta(req.params.id);
  res.json(enriched);
});

// Diagnostics endpoint to verify server render configuration and filesystem access
renderRouter.get('/diagnostics', async (_req, res) => {
  try {
    const entryPoint = config.render.entryPoint;
    let entryExists = false;
    try {
      await fs.promises.access(entryPoint, fs.constants.R_OK);
      entryExists = true;
    } catch {}

    const outDir = config.render.outputDir;
    let outDirWritable = false;
    try {
      await fs.promises.mkdir(outDir, { recursive: true });
      await fs.promises.access(outDir, fs.constants.W_OK);
      outDirWritable = true;
    } catch {}

    const concurrency = Number(config.render.concurrency || 1);

    res.json({
      ok: true,
      nodeEnv: process.env.NODE_ENV || 'unknown',
      render: {
        entryPoint,
        entryExists,
        outputDir: outDir,
        outputDirWritable,
        concurrency,
      },
      versions: {
        node: process.version,
      },
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

renderRouter.get('/:id/download', async (req, res) => {
  // TODO(auth): Ensure the requester has access to the render (same project / owner).
  const job = getJob(req.params.id);
  if (job && job.status === 'completed' && job.output) {
    return res.download(path.resolve(job.output));
  }
  // Fallback to persisted metadata
  const record = await findRenderById(req.params.id);
  if (!record || !record.path) return res.status(404).json({ error: 'Not found' });
  try {
    await fs.promises.access(record.path, fs.constants.R_OK);
    return res.download(path.resolve(record.path));
  } catch {
    return res.status(404).json({ error: 'File not found' });
  }
});

// Delete a render (by id)
// TODO(auth): Require authorization and validate project ownership.
// TODO(audit): Consider logging deletions for auditability.
renderRouter.delete('/:id', async (req, res) => {
  try {
    const result = await deleteRenderById(req.params.id);
    if (!result.ok) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete render' });
  }
});
