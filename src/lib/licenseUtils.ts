import type { LicenseStatus } from '../types/preload';
export type { LicenseStatus } from '../types/preload';
export type LicenseState = LicenseStatus['state'];

export function mapLicenseResponse(input: unknown): LicenseStatus {
  try {
    const obj = (input ?? {}) as Record<string, unknown>;
    const lic = obj.license as Record<string, unknown> | undefined;
    const status: string | undefined =
      (obj.status as string | undefined) ||
      (obj.state as string | undefined) ||
      (lic && (lic.status as string | undefined));
    const mapped: LicenseStatus['state'] =
      status === 'valid'
        ? 'valid'
        : status === 'invalid'
          ? 'invalid'
          : status === 'expired'
            ? 'expired'
            : 'unknown';
    const expiresAt: string | undefined =
      (obj.expiresAt as string | undefined) ||
      (lic && (lic.expiresAt as string | undefined));
    const user =
      (obj.user as Record<string, unknown> | undefined) ||
      (obj.owner as Record<string, unknown> | undefined);
    const message: string | undefined =
      (obj.message as string | undefined) || (obj.error as string | undefined);
    const u =
      user && typeof user === 'object'
        ? (user as Record<string, unknown>)
        : undefined;
    const email =
      typeof u?.email === 'string' ? (u.email as string) : undefined;
    const name = typeof u?.name === 'string' ? (u.name as string) : undefined;
    const plan = typeof u?.plan === 'string' ? (u.plan as string) : undefined;
    return {
      state: mapped,
      message,
      expiresAt,
      user: u ? { email, name, plan } : undefined,
    };
  } catch {
    return { state: 'unknown' };
  }
}
