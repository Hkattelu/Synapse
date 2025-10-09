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
  async (req, res) => {
    // Stream request body to disk with basic safeguards
    const abortWith = (code, message) => {
      try { res.status(code).json({ error: message }); } catch {}
    };
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

      const host = req.get('host');
      const xfProto = (req.headers['x-forwarded-proto'] || '')
        .toString()
        .split(',')[0]
        .trim();
      const inferredProto = xfProto || req.protocol || 'http';
      const protocol = inferredProto.replace(/:$/, '');

      const ws = fs.createWriteStream(outPath);
      let received = 0;
      const contentLength = Number(req.header('content-length') || 0);
      const MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2GB
      if (contentLength && contentLength > MAX_BYTES) {
        return abortWith(413, 'Upload exceeds maximum allowed size');
      }

      const onData = (chunk) => {
        received += chunk.length;
        if (received > MAX_BYTES) {
          try { ws.destroy(); } catch {}
          return abortWith(413, 'Upload exceeds maximum allowed size');
        }
      };

      let responded = false;
      const done = () => {
        if (responded) return;
        responded = true;
        const absoluteUrl = `${protocol}://${host}/api/uploads/${encodeURIComponent(filename)}`;
        res.json({ id: filename, url: absoluteUrl });
      };

      const fail = (err) => {
        if (responded) return;
        responded = true;
        try { fs.promises.unlink(outPath).catch(() => {}); } catch {}
        abortWith(400, String(err?.message || err || 'Upload failed'));
      };

      req.on('data', onData);
      req.on('error', fail);
      req.on('aborted', () => fail(new Error('Client aborted upload')));
      ws.on('error', fail);
      ws.on('finish', done);

      req.pipe(ws);
    } catch (e) {
      abortWith(400, String(e?.message || e));
    }
  }
);

// Serve uploaded file via API path (works with Vite proxy)
uploadsRouter.get('/:name', async (req, res) => {
  try {
    const file = path.join(config.storage.uploadsDir, req.params.name);
    await fs.promises.access(file, fs.constants.R_OK);

    const stat = await fs.promises.stat(file);
    const total = stat.size;
    const range = req.headers.range;

    res.set('Accept-Ranges', 'bytes');
    // Set basic content type based on extension
    try { res.type(path.extname(file)); } catch {}

    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      let start = 0;
      let end = total - 1;
      if (match) {
        if (match[1]) start = parseInt(match[1], 10);
        if (match[2]) end = parseInt(match[2], 10);
        if (Number.isNaN(start)) start = 0;
        if (Number.isNaN(end) || end >= total) end = total - 1;
      }
      if (start > end || start >= total) {
        return res.status(416).set('Content-Range', `bytes */${total}`).end();
      }
      const chunkSize = end - start + 1;
      res.status(206);
      res.set({
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Content-Length': String(chunkSize),
      });
      const stream = fs.createReadStream(file, { start, end });
      stream.on('error', () => res.status(500).end());
      stream.pipe(res);
    } else {
      res.set('Content-Length', String(total));
      const stream = fs.createReadStream(file);
      stream.on('error', () => res.status(500).end());
      stream.pipe(res);
    }
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