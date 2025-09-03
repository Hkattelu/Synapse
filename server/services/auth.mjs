import bcrypt from 'bcryptjs';
import { signToken, verifyToken } from '../utils/jwt.mjs';

// In-memory store (replace with DB later)
const users = new Map(); // key: email -> {id, email, passwordHash, createdAt}
let idSeq = 1;

export const register = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  const existing = users.get(email.toLowerCase());
  if (existing) throw new Error('User already exists');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: String(idSeq++), email: email.toLowerCase(), passwordHash, createdAt: new Date().toISOString() };
  users.set(user.email, user);
  const token = signToken({ sub: user.id, email: user.email });
  return { user: { id: user.id, email: user.email }, token };
};

export const login = async ({ email, password }) => {
  const user = users.get((email || '').toLowerCase());
  if (!user) throw new Error('Invalid credentials');
  const ok = await bcrypt.compare(password || '', user.passwordHash);
  if (!ok) throw new Error('Invalid credentials');
  const token = signToken({ sub: user.id, email: user.email });
  return { user: { id: user.id, email: user.email }, token };
};

export const getUserFromToken = (token) => {
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = [...users.values()].find((u) => u.id === payload.sub);
  return user ? { id: user.id, email: user.email } : null;
};

export const requireAuth = (req, res, next) => {
  const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  const user = token ? getUserFromToken(token) : null;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  req.user = user;
  next();
};
