import { Router } from 'express';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../config.mjs';

export const uploadsRouter = Router();

// Ensure uploads directory exists
async function ensureUploadsDir() {
  try {
    await fs.promises.mkdir(config.storage.uploadsDir, { recursive: true });
  } catch {}
}

// Upload raw binary (single file). Avoids extra deps; client must send Content-Type and X-Filename.
uploadsRouter.post(
  '/',
  express.raw({ type: '*/*', limit: '2gb' }),
  async (req, res) => {
    try {
      await ensureUploadsDir();
      const origName = String(req.header('x-filename') || 'upload.bin');
      const safeBase = origName
        .replace(/[^a-zA-Z0-9 _.-]+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 120)
        .trim() || 'upload';
      const ext = path.extname(safeBase) || guessExt(req.header('content-type'));
      const id = `${Date.now()}-${randomUUID().slice(0, 8)}`;
      const filename = `${safeBase.replace(/\.[a-zA-Z0-9]+$/, '')}-${id}${ext}`;
      const outPath = path.join(config.storage.uploadsDir, filename);
      const buf = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(req.body || []);
      await fs.promises.writeFile(outPath, buf);
      const host = req.get('host');
      const protocol = (req.protocol || 'http').replace(/:$/, '');
      const absoluteUrl = `${protocol}://${host}/api/uploads/${encodeURIComponent(
        filename
      )}`;
      res.json({ id: filename, url: absoluteUrl });
    } catch (e) {
      res.status(400).json({ error: String(e?.message || e) });
    }
  }
);

// Serve uploaded file via API path (works with Vite proxy)
uploadsRouter.get('/:name', async (req, res) => {
  try {
    const file = path.join(config.storage.uploadsDir, req.params.name);
    await fs.promises.access(file, fs.constants.R_OK);
    res.sendFile(path.resolve(file));
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

function guessExt(mime) {
  if (!mime || typeof mime !== 'string') return '';
  if (mime.includes('mp4')) return '.mp4';
  if (mime.includes('webm')) return '.webm';
  if (mime.includes('ogg')) return '.ogg';
  if (mime.includes('avi')) return '.avi';
  if (mime.includes('mov')) return '.mov';
  if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg';
  if (mime.includes('png')) return '.png';
  if (mime.includes('gif')) return '.gif';
  if (mime.includes('webp')) return '.webp';
  if (mime.includes('svg')) return '.svg';
  if (mime.includes('mp3')) return '.mp3';
  if (mime.includes('wav')) return '.wav';
  if (mime.includes('aac')) return '.aac';
  if (mime.includes('flac')) return '.flac';
  return '';
}