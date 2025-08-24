import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

async function ensureDb() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_FILE);
  } catch {
    const init = {
      users: [],
      sessions: [],
      memberships: [],
      payments: [],
      jobs: [],
    };
    await fs.writeFile(DB_FILE, JSON.stringify(init, null, 2));
  }
}

async function readDb() {
  await ensureDb();
  const raw = await fs.readFile(DB_FILE, 'utf8');
  return JSON.parse(raw);
}

async function writeDb(db) {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
}

export async function createUser({ email, passwordHash, name }) {
  const db = await readDb();
  const existing = db.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (existing) throw new Error('Email already in use');
  const user = {
    id: crypto.randomUUID(),
    email,
    name: name || email.split('@')[0],
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  await writeDb(db);
  return user;
}

export async function findUserByEmail(email) {
  const db = await readDb();
  return (
    db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
  );
}

export async function getUserById(id) {
  const db = await readDb();
  return db.users.find((u) => u.id === id) || null;
}

export async function createSession(userId) {
  const db = await readDb();
  const session = {
    id: crypto.randomUUID(),
    userId,
    createdAt: new Date().toISOString(),
  };
  db.sessions.push(session);
  await writeDb(db);
  return session;
}

export async function getSession(sessionId) {
  const db = await readDb();
  return db.sessions.find((s) => s.id === sessionId) || null;
}

export async function deleteSession(sessionId) {
  const db = await readDb();
  db.sessions = db.sessions.filter((s) => s.id !== sessionId);
  await writeDb(db);
}

export async function getMembership(userId) {
  const db = await readDb();
  const m = db.memberships.find((m) => m.userId === userId);
  if (!m) return { active: false };
  if (m.expiresAt && new Date(m.expiresAt).getTime() < Date.now()) {
    return { ...m, active: false };
  }
  return { ...m, active: m.status === 'active' };
}

export async function activateMembership({
  userId,
  amount,
  currency,
  source,
  durationDays = 30,
  paymentId,
}) {
  const db = await readDb();
  let m = db.memberships.find((m) => m.userId === userId);
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + durationDays * 24 * 60 * 60 * 1000
  );
  if (m) {
    m.status = 'active';
    m.activatedAt = now.toISOString();
    m.expiresAt = expiresAt.toISOString();
    m.source = source;
    m.lastPaymentId = paymentId;
  } else {
    m = {
      id: crypto.randomUUID(),
      userId,
      status: 'active',
      activatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      source,
      lastPaymentId: paymentId,
    };
    db.memberships.push(m);
  }
  // Record payment
  db.payments.push({
    id: paymentId || crypto.randomUUID(),
    userId,
    amount,
    currency,
    provider: source,
    status: 'succeeded',
    createdAt: now.toISOString(),
  });
  await writeDb(db);
  return m;
}

// Export job management (simulated)
export async function createExportJob({ userId, job, trial = false }) {
  const db = await readDb();
  const j = {
    id: job.jobId,
    userId,
    status: 'preparing',
    progress: 0,
    createdAt: new Date().toISOString(),
    projectName: job.project?.name,
    outputFilename: job.outputFilename,
    trial,
  };
  db.jobs.push(j);
  await writeDb(db);
  return j;
}

export async function getJob(jobId) {
  const db = await readDb();
  return db.jobs.find((j) => j.id === jobId) || null;
}

export async function updateJob(job) {
  const db = await readDb();
  db.jobs = db.jobs.map((j) => (j.id === job.id ? job : j));
  await writeDb(db);
}

export async function getTrialExportsCount(userId) {
  const db = await readDb();
  return db.jobs.filter(
    (j) => j.userId === userId && j.trial === true && j.status === 'completed'
  ).length;
}
