import { Router } from 'express';
import { sendContactEmail } from '../services/email.mjs';

export const emailRouter = Router();

emailRouter.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body || {};
    const result = await sendContactEmail({ name, email, message });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});
