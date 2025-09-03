import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.mjs';
import { router as apiRouter } from './routes.mjs';

const app = express();

app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
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

app.listen(config.port, () => {
  console.log(`Synapse server listening on http://localhost:${config.port}`);
});
