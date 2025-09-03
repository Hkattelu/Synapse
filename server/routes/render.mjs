import { Router } from 'express';
import { startRender, getJob } from '../services/render.mjs';
import path from 'node:path';

export const renderRouter = Router();

renderRouter.post('/', async (req, res) => {
  try {
    const inputProps = req.body || {};
    const { jobId } = await startRender({ inputProps });
    res.json({ jobId });
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

renderRouter.get('/:id/status', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Not found' });
  res.json(job);
});

renderRouter.get('/:id/download', (req, res) => {
  const job = getJob(req.params.id);
  if (!job || job.status !== 'completed' || !job.output) return res.status(404).json({ error: 'Not ready' });
  res.download(path.resolve(job.output));
});
