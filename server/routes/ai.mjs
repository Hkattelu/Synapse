import { Router } from 'express';
import { generateFromRepo } from '../services/ai.mjs';

export const aiRouter = Router();

aioRouter.post('/generate-from-repo', async (req, res) => {
  try {
    const { repoUrl, branch } = req.body || {};
    const proposal = await generateFromRepo({ repoUrl, branch });
    res.json(proposal);
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});
