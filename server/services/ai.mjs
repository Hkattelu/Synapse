import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execCb);

// Heuristic generator: clones a repo and proposes a minimal timeline
export const generateFromRepo = async ({ repoUrl, branch = 'main' }) => {
  if (!repoUrl) throw new Error('repoUrl required');
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'synapse-repo-'));
  await exec(`git clone --depth 1 -b ${branch} ${repoUrl} "${dir}"`);

  // Collect a few representative files for code sequences
  const candidates = [];
  const walk = async (p, depth = 0) => {
    if (depth > 3) return;
    const entries = await fs.promises.readdir(p, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(p, e.name);
      if (e.isDirectory()) {
        if (['node_modules', '.git', 'dist', 'build', '.next', 'out'].includes(e.name)) continue;
        await walk(full, depth + 1);
      } else if (/\.(js|ts|tsx|py|go|rs|java|md|json)$/i.test(e.name)) {
        candidates.push(full);
      }
    }
  };
  await walk(dir);

  const pick = candidates.slice(0, 3);
  const timeline = [
    {
      id: 'title-1',
      type: 'title',
      startTime: 0,
      duration: 5,
      properties: { text: 'Project Overview' },
      animation: { type: 'fade' },
    },
    ...pick.map((file, i) => ({
      id: `code-${i}`,
      type: 'code',
      startTime: 5 + i * 10,
      duration: 10,
      properties: { language: guessLanguage(file), codePath: file, code: safeRead(file) },
      animation: { type: 'typewriter' },
    })),
  ];

  const settings = { width: 1920, height: 1080, fps: 30, duration: Math.max(15, 5 + pick.length * 10), backgroundColor: '#000000' };
  const exportSettings = { format: 'mp4', codec: 'h264', quality: 'high', audioCodec: 'aac', transparentBackground: false };

  return { timeline, mediaAssets: [], settings, exportSettings };
};

const safeRead = (file) => {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    return content.slice(0, 4000);
  } catch {
    return '';
  }
};

const guessLanguage = (file) => {
  const ext = path.extname(file).toLowerCase();
  const map = { '.ts': 'typescript', '.tsx': 'tsx', '.js': 'javascript', '.py': 'python', '.go': 'go', '.rs': 'rust', '.java': 'java', '.md': 'markdown', '.json': 'json' };
  return map[ext] || 'plaintext';
};
