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
  constructor(status: number, message: string, opts?: { code?: string; body?: unknown }) {
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
  if (hasBody && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

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

export const api = {
  // Auth
  async session(): Promise<{ authenticated: boolean; user?: ApiUser; membership?: ApiMembership }> {
    return request('/api/auth/session');
  },
  async signup(input: { email: string; password: string; name?: string }): Promise<{ user: ApiUser; membership: ApiMembership }> {
    return request('/api/auth/signup', { method: 'POST', body: JSON.stringify(input) });
  },
  async login(input: { email: string; password: string }): Promise<{ user: ApiUser; membership: ApiMembership }> {
    return request('/api/auth/login', { method: 'POST', body: JSON.stringify(input) });
  },
  async logout(): Promise<{ ok: boolean }> {
    return request('/api/auth/logout', { method: 'POST' });
  },
  async membershipStatus(): Promise<ApiMembership> {
    return request('/api/membership/status');
  },
  async demoPayment(input: { amount?: number; currency?: string; durationDays?: number }): Promise<{ ok: boolean; membership: ApiMembership }> {
    return request('/api/payments/demo', { method: 'POST', body: JSON.stringify(input) });
  },
  // Export jobs
  async createExportJob(jobSpec: any, init?: RequestInit): Promise<{ id: string; status: string }> {
    return request('/api/export/jobs', { method: 'POST', body: JSON.stringify(jobSpec), ...(init || {}) });
  },
  async getExportJob(id: string, init?: RequestInit): Promise<any> {
    return request(`/api/export/jobs/${id}`, init);
  },
  async cancelExportJob(id: string): Promise<any> {
    return request(`/api/export/jobs/${id}/cancel`, { method: 'POST' });
  },
};
