export type ApiUser = { id: string; email: string; name: string };
export type ApiMembership = {
  id?: string;
  userId?: string;
  status?: 'active' | 'inactive';
  activatedAt?: string;
  expiresAt?: string;
  source?: string;
  active: boolean;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    credentials: 'include',
  });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {}
    const err = new Error(msg) as any;
    err.status = res.status;
    throw err;
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
  async createExportJob(jobSpec: any): Promise<{ id: string; status: string }> {
    return request('/api/export/jobs', { method: 'POST', body: JSON.stringify(jobSpec) });
  },
  async getExportJob(id: string): Promise<any> {
    return request(`/api/export/jobs/${id}`);
  },
  async cancelExportJob(id: string): Promise<any> {
    return request(`/api/export/jobs/${id}/cancel`, { method: 'POST' });
  },
};
