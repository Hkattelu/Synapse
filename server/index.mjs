import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.mjs';
import { router as apiRouter } from './routes.mjs';

const app = express();

// Trust proxy headers so req.protocol reflects 'https' behind load balancers (e.g., Cloud Run)
app.set('trust proxy', true);

app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'synapse-server', version: '0.1.0' });
});

// API routes
app.use('/api', apiRouter);

// Static downloads (rendered media)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/downloads', express.static(path.join(__dirname, 'output')));
// Static uploads (optional direct access); API also exposes /api/uploads/:id
app.use('/uploads', express.static(config.storage.uploadsDir));

// Serve frontend (static) in production from /dist for same-origin web+API
if (process.env.NODE_ENV === 'production') {
  const clientDir = path.resolve(path.join(__dirname, '..', 'dist'));
  app.use(express.static(clientDir, { maxAge: '1h', index: 'index.html' }));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/downloads'))
      return next();
    res.sendFile(path.join(clientDir, 'index.html'));
  });
}

app.listen(config.port, () => {
  console.log(`Synapse server listening on http://localhost:${config.port}`);
});
