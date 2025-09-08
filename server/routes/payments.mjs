import { Router } from 'express';
import { requireAuth } from '../services/auth.mjs';
import { activateMembership } from '../db.mjs';
import { validateDemoPayment } from '../validation/validators.mjs';

export const paymentsRouter = Router();

paymentsRouter.post('/demo', requireAuth, async (req, res) => {
  const { valid, errors, value } = validateDemoPayment(req.body || {});
  if (!valid) return res.status(400).json({ error: errors.join('; ') });

  const { amount, currency, durationDays } = value;
  const paymentId = `demo_${Date.now()}`;

  try {
    const m = await activateMembership({
      userId: req.user.id,
      amount,
      currency,
      source: 'demo',
      durationDays,
      paymentId,
    });
    return res.json({ ok: true, membership: { ...m, active: true } });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to activate membership' });
  }
});
