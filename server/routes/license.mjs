import { Router } from 'express';
import { activateLicense, getLicenseStatus } from '../services/licensing.mjs';
import { requireAuth } from '../services/auth.mjs';

export const licenseRouter = Router();

licenseRouter.post('/activate', requireAuth, async (req, res) => {
  try {
    const { licenseKey } = req.body || {};
    const rec = await activateLicense({ userId: req.user.id, licenseKey });
    res.json({ ok: true, license: rec });
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

licenseRouter.get('/status', requireAuth, async (req, res) => {
  const status = await getLicenseStatus({ userId: req.user.id });
  res.json(status);
});
