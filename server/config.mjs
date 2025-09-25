import 'dotenv/config';
import { fileURLToPath } from 'node:url';

const number = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: number(process.env.PORT, 8787),
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: number(process.env.SMTP_PORT, 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
  },
  render: {
    // Ensure Windows paths are correctly resolved from file URLs
    outputDir:
      process.env.RENDER_OUTPUT_DIR ||
      fileURLToPath(new URL('./output', import.meta.url)),
    compositionId: process.env.REMOTION_COMPOSITION_ID || 'MainComposition',
    entryPoint:
      process.env.REMOTION_ENTRY ||
      fileURLToPath(new URL('../src/remotion/index.ts', import.meta.url)),
    concurrency: number(process.env.RENDER_CONCURRENCY, 1),
  },
  storage: {
    uploadsDir:
      process.env.UPLOADS_DIR ||
      fileURLToPath(new URL('./uploads', import.meta.url)),
  },
};
