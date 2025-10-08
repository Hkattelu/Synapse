export type ApiUser = { id: string; email: string; name: string };
export type ApiMembership = {
  id?: string;
  userId?: string;
  status?: 'active' | 'inactive';
  activatedAt?: string;
  expiresAt?: string;
  source?: string;
  active: boolean;
  // Trial exports (optional, provided by session endpoint)
  trialUsed?: number;
  trialLimit?: number;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  body?: unknown;
  constructor(
    status: number,
    message: string,
    opts?: { code?: string; body?: unknown }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = opts?.code;
    this.body = opts?.body;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  const hasBody = typeof init.body !== 'undefined' && init.body !== null;
  if (hasBody && !headers.has('Content-Type'))
    headers.set('Content-Type', 'application/json');

  const res = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    let body: any = undefined;
    try {
      body = await res.json();
      if (body?.error) message = String(body.error);
    } catch {}
    throw new ApiError(res.status, message, { code: body?.code, body });
  }
  return res.json();
}

// --- Client-side fallback implementation for New from Repo (GitHub public repos only) ---

// Parse GitHub repo URLs like:
// - https://github.com/owner/repo
// - https://github.com/owner/repo/
// - https://github.com/owner/repo/tree/branch
// - https://github.com/owner/repo/blob/branch/path
function parseGithubUrl(urlStr: string): { owner: string; repo: string; branch?: string } | null {
  try {
    const u = new URL(urlStr);
    if (u.hostname !== 'github.com') return null;
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, '');
    let branch: string | undefined;
    const third = parts[2];
    if (third === 'tree' || third === 'blob') {
      branch = parts[3];
    }
    return { owner, repo, branch };
  } catch {
    return null;
  }
}

async function ghJson<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, `GitHub API error: ${res.status} ${res.statusText}`, { body: text });
  }
  return res.json();
}

async function ghTextRaw(owner: string, repo: string, ref: string, filePath: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(ref)}/${filePath}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, `GitHub raw error: ${res.status} ${res.statusText}`, { body: text });
  }
  return res.text();
}

function extToLanguage(p: string): string {
  const lower = p.toLowerCase();
  if (lower.endsWith('.ts')) return 'typescript';
  if (lower.endsWith('.tsx')) return 'tsx';
  if (lower.endsWith('.js')) return 'javascript';
  if (lower.endsWith('.jsx')) return 'jsx';
  if (lower.endsWith('.py')) return 'python';
  if (lower.endsWith('.go')) return 'go';
  if (lower.endsWith('.rs')) return 'rust';
  if (lower.endsWith('.java')) return 'java';
  if (lower.endsWith('.kt')) return 'kotlin';
  if (lower.endsWith('.swift')) return 'swift';
  if (lower.endsWith('.md')) return 'markdown';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.yml') || lower.endsWith('.yaml')) return 'yaml';
  if (lower.endsWith('.sh')) return 'bash';
  return 'plaintext';
}

function pickInterestingFiles(allPaths: string[]): string[] {
  // Prioritize README, docs, and source files
  const picks: string[] = [];
  const add = (p: string) => {
    if (!picks.includes(p)) picks.push(p);
  };

  const byPriority: ((p: string) => boolean)[] = [
    (p) => /^readme\.md$/i.test(p.split('/').slice(-1)[0]),
    (p) => p.toLowerCase().startsWith('docs/') && p.toLowerCase().endsWith('.md'),
    (p) => p.toLowerCase().startsWith('src/') && /\.(ts|tsx|js|jsx|py|go|rs|java|kt|swift)$/i.test(p),
    (p) => /\.(md|ts|tsx|js|jsx)$/i.test(p),
  ];

  for (const matcher of byPriority) {
    for (const p of allPaths) if (matcher(p)) add(p);
    if (picks.length >= 5) break; // cap
  }
  return picks.slice(0, 5);
}

async function aiGenerateFromRepoClientFallback(input: { repoUrl: string; branch?: string }): Promise<any> {
  const parsed = parseGithubUrl(input.repoUrl);
  if (!parsed) {
    throw new ApiError(400, 'Only public GitHub repositories are supported in client fallback. Please use a GitHub URL like https://github.com/owner/repo');
  }
  const { owner, repo } = parsed;

  // Get repo info to resolve default branch if branch not provided
  const repoInfo = await ghJson<{ default_branch: string; name: string; full_name: string }>(`/repos/${owner}/${repo}`);
  const ref = input.branch || parsed.branch || repoInfo.default_branch || 'main';

  // List files (recursive tree)
  type TreeItem = { path: string; type: 'blob' | 'tree' | string };
  const tree = await ghJson<{ tree: TreeItem[] }>(`/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`);
  const files = tree.tree.filter((t) => t.type === 'blob').map((t) => t.path);

  const selected = pickInterestingFiles(files);
  if (selected.length === 0) {
    throw new ApiError(404, 'No suitable files found in repository to build a starter timeline.');
  }

  // Fetch up to N files (keep small and fast)
  const maxFiles = Math.min(5, selected.length);
  const fetched: Array<{ path: string; content: string; language: string } > = [];
  for (let i = 0; i < maxFiles; i++) {
    const p = selected[i];
    try {
      const content = await ghTextRaw(owner, repo, ref, p);
      const language = extToLanguage(p);
      // Truncate very large files to 5k chars for initial proposal
      const snippet = content.length > 5000 ? content.slice(0, 5000) + '\n\n// …truncated…' : content;
      fetched.push({ path: p, content: snippet, language });
    } catch {
      // skip
    }
  }

  // Build a naive proposal: title + code/doc segments
  const projectName = repoInfo.name || repo;
  const titleText = `Project: ${repoInfo.full_name || `${owner}/${repo}`}`;

  let currentTime = 0;
  const timeline: any[] = [];
  // Title card
  timeline.push({
    type: 'title',
    startTime: currentTime,
    duration: 4,
    properties: { text: titleText },
  });
  currentTime += 4;

  for (const f of fetched) {
    const dur = f.language === 'markdown' ? 6 : 10;
    timeline.push({
      type: 'code',
      startTime: currentTime,
      duration: dur,
      properties: {
        language: f.language,
        code: f.content,
        codePath: f.path,
      },
    });
    currentTime += dur;
  }

  const proposal = {
    projectName: `${projectName} Video`,
    settings: {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: Math.max(currentTime + 2, 20),
      backgroundColor: '#000000',
    },
    timeline,
  };

  return proposal;
}

export const api = {
  // Auth
  async session(): Promise<{
    authenticated: boolean;
    user?: ApiUser;
    membership?: ApiMembership;
  }> {
    return request('/api/auth/session');
  },
  async signup(input: {
    email: string;
    password: string;
    name?: string;
  }): Promise<{ user: ApiUser; membership: ApiMembership }> {
    // Prefer existing endpoint; fallback to alternate path if not found
    try {
      return await request('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        return request('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(input),
        });
      }
      throw e;
    }
  },
  async login(input: {
    email: string;
    password: string;
  }): Promise<{ user: ApiUser; membership: ApiMembership }> {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  async logout(): Promise<{ ok: boolean }> {
    return request('/api/auth/logout', { method: 'POST' });
  },
  async membershipStatus(): Promise<ApiMembership> {
    return request('/api/membership/status');
  },
  async demoPayment(input: {
    amount?: number;
    currency?: string;
    durationDays?: number;
  }): Promise<{ ok: boolean; membership: ApiMembership }> {
    return request('/api/payments/demo', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  // Export jobs (legacy endpoints)
  async createExportJob(
    jobSpec: any,
    init?: RequestInit
  ): Promise<{ id: string; status: string }> {
    return request('/api/export/jobs', {
      method: 'POST',
      body: JSON.stringify(jobSpec),
      ...(init || {}),
    });
  },
  async getExportJob(id: string, init?: RequestInit): Promise<any> {
    return request(`/api/export/jobs/${id}`, init);
  },
  async cancelExportJob(id: string): Promise<any> {
    return request(`/api/export/jobs/${id}/cancel`, { method: 'POST' });
  },
  // New render API
  async startRender(inputProps: any): Promise<{ jobId: string }> {
    return request('/api/render', {
      method: 'POST',
      body: JSON.stringify(inputProps),
    });
  },
  async getRenderStatus(
    id: string
  ): Promise<{ status: string; output?: string; error?: string }> {
    return request(`/api/render/${id}/status`);
  },
  renderDownloadUrl(id: string): string {
    return `/api/render/${id}/download`;
  },
  async listRenders(projectId: string): Promise<{ items: Array<{ id: string; filename: string; publicUrl: string; size: number; createdAt: string }> }> {
    const url = `/api/render?projectId=${encodeURIComponent(projectId)}`;
    return request(url);
  },
  async deleteRender(id: string): Promise<{ ok: boolean }> {
    return request(`/api/render/${id}` , { method: 'DELETE' });
  },
  // AI
  async aiGenerateFromRepo(input: {
    repoUrl: string;
    branch?: string;
  }): Promise<any> {
    // Prefer backend if available
    try {
      return await request('/api/ai/generate-from-repo', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch (e) {
      // If endpoint is not available, fall back to client-only GitHub flow for public repos
      if (e instanceof ApiError && (e.status === 404 || e.status === 501)) {
        return aiGenerateFromRepoClientFallback(input);
      }
      // Network failure or other error — attempt fallback once before rethrowing
      try {
        return await aiGenerateFromRepoClientFallback(input);
      } catch {
        throw e;
      }
    }
  },
  // Contact
  async submitContact(input: {
    name: string;
    email: string;
    message: string;
  }): Promise<{
    queued?: boolean;
    messageId?: string;
    simulated?: boolean;
    success?: boolean;
  }> {
    return request('/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        from_name: input.name,
        from_email: input.email,
        message: input.message,
        subject: `Contact from ${input.name}`,
        timestamp: new Date().toISOString(),
      }),
    });
  },
};
