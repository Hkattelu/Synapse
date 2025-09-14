import { Router } from 'express';
import { login, register, getUserFromToken } from '../services/auth.mjs';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const { user, token } = await register({ email, password });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    res.json({ user });
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const { user, token } = await login({ email, password });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    res.json({ user });
  } catch (e) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

authRouter.get('/me', (req, res) => {
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);
  const user = token ? getUserFromToken(token) : null;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ user });
});
