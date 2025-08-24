import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import {
  createUser,
  findUserByEmail,
  getUserById,
  createSession,
  getSession,
  deleteSession,
  getMembership,
  activateMembership,
  createExportJob,
  getJob,
  updateJob,
  getTrialExportsCount,
} from './db.mjs';

const app = express();
const PORT = process.env.PORT || 8787;
const TRIAL_EXPORT_LIMIT = 2;

app.use(express.json({ limit: '4mb' }));
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, cb) => cb(null, true),
    credentials: true,
  })
);

// Helpers
function getSid(req) {
  return req.cookies?.sid || null;
}

async function getAuthedUser(req) {
  const sid = getSid(req);
  if (!sid) return null;
  const session = await getSession(sid);
  if (!session) return null;
  const user = await getUserById(session.userId);
  return user || null;
}

async function requireAuth(req, res, next) {
  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  req.user = user;
  next();
}

async function requireMembership(req, res, next) {
  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  const membership = await getMembership(user.id);
  if (!membership.active) {
    return res
      .status(402)
      .json({ error: 'Membership required', code: 'MEMBERSHIP_REQUIRED' });
  }
  req.user = user;
  req.membership = membership;
  next();
}

// Allow up to 2 trial exports for authenticated users without active membership.
async function requireExportAccess(req, res, next) {
  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  const membership = await getMembership(user.id);
  if (membership.active) {
    req.user = user;
    req.membership = membership;
    req.isTrial = false;
    return next();
  }
  const used = await getTrialExportsCount(user.id);
  if (used < TRIAL_EXPORT_LIMIT) {
    req.user = user;
    req.membership = membership;
    req.isTrial = true;
    return next();
  }
  return res
    .status(402)
    .json({ error: 'Membership required', code: 'MEMBERSHIP_REQUIRED' });
}

// Auth endpoints
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: 'Missing fields' });
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ email, passwordHash, name });
    const session = await createSession(user.id);
    res.cookie('sid', session.id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 30 * 1000, // 30 days
    });
    const membership = await getMembership(user.id);
    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      membership,
    });
  } catch (e) {
    res.status(400).json({ error: e.message || 'Sign up failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: 'Missing fields' });
  const user = await findUserByEmail(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const session = await createSession(user.id);
  res.cookie('sid', session.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 60 * 60 * 24 * 30 * 1000,
  });
  const membership = await getMembership(user.id);
  res.json({
    user: { id: user.id, email: user.email, name: user.name },
    membership,
  });
});

app.post('/api/auth/logout', async (req, res) => {
  const sid = getSid(req);
  if (sid) await deleteSession(sid);
  res.clearCookie('sid', { path: '/' });
  res.json({ ok: true });
});

app.get('/api/auth/session', async (req, res) => {
  const user = await getAuthedUser(req);
  if (!user) return res.json({ authenticated: false });
  const membership = await getMembership(user.id);
  const trialsUsed = await getTrialExportsCount(user.id);
  const trialLimit = TRIAL_EXPORT_LIMIT;
  res.json({
    authenticated: true,
    user: { id: user.id, email: user.email, name: user.name },
    membership: { ...membership, trialUsed: trialsUsed, trialLimit },
  });
});

// Membership endpoints
app.get('/api/membership/status', requireAuth, async (req, res) => {
  const membership = await getMembership(req.user.id);
  res.json(membership);
});

// Demo payment/donation flow
app.post('/api/payments/demo', requireAuth, async (req, res) => {
  const { amount = 500, currency = 'USD', durationDays = 30 } = req.body || {};
  const paymentId = `demo_${crypto.randomUUID()}`;
  const m = await activateMembership({
    userId: req.user.id,
    amount,
    currency,
    source: 'kofi-demo',
    durationDays,
    paymentId,
  });
  res.json({ ok: true, membership: { ...m, active: true } });
});

// Export endpoints (simulated job server)
app.post('/api/export/jobs', requireExportAccess, async (req, res) => {
  const jobSpec = req.body || {};
  if (!jobSpec?.jobId || !jobSpec?.project?.name) {
    return res.status(400).json({ error: 'Invalid job spec' });
  }
  const job = await createExportJob({
    userId: req.user.id,
    job: jobSpec,
    trial: !!req.isTrial,
  });
  // Kick off simulation
  simulateJob(job.id).catch((e) => console.error('Job simulation error', e));
  res.status(201).json({ id: job.id, status: job.status });
});

app.get('/api/export/jobs/:id', requireAuth, async (req, res) => {
  const job = await getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Not found' });
  if (job.userId !== req.user.id)
    return res.status(403).json({ error: 'Forbidden' });
  res.json(job);
});

app.post('/api/export/jobs/:id/cancel', requireAuth, async (req, res) => {
  const job = await getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Not found' });
  if (job.userId !== req.user.id)
    return res.status(403).json({ error: 'Forbidden' });
  if (['completed', 'failed', 'cancelled'].includes(job.status))
    return res.json(job);
  job.status = 'cancelled';
  job.progress = job.progress ?? 0;
  job.endedAt = new Date().toISOString();
  await updateJob(job);
  res.json(job);
});

async function simulateJob(jobId) {
  let job = await getJob(jobId);
  if (!job) return;
  const steps = [
    { status: 'preparing', ms: 800, inc: 10 },
    { status: 'rendering', ms: 3000, inc: 70 },
    { status: 'finalizing', ms: 800, inc: 20 },
  ];
  for (const step of steps) {
    // check cancellation
    job = await getJob(jobId);
    if (!job || job.status === 'cancelled') return;
    job.status = step.status;
    await updateJob(job);
    const parts = Math.ceil(step.ms / 500);
    for (let i = 0; i < parts; i++) {
      await new Promise((r) => setTimeout(r, 500));
      job = await getJob(jobId);
      if (!job || job.status === 'cancelled') return;
      job.progress = Math.min(99, (job.progress || 0) + step.inc / parts);
      await updateJob(job);
    }
  }
  job = await getJob(jobId);
  if (!job || job.status === 'cancelled') return;
  job.status = 'completed';
  job.progress = 100;
  job.endedAt = new Date().toISOString();
  job.outputPath = `/exports/${job.outputFilename}`;
  await updateJob(job);
}

app.get('/api/healthz', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
