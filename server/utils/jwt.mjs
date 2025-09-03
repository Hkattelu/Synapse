import jwt from 'jsonwebtoken';
import { config } from '../config.mjs';

export const signToken = (payload, opts = {}) =>
  jwt.sign(payload, config.jwtSecret, { expiresIn: '7d', ...opts });

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (e) {
    return null;
  }
};
