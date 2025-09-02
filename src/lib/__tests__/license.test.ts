import { describe, it, expect } from 'vitest';
import { mapLicenseResponse } from '../licenseUtils';

describe('mapLicenseResponse', () => {
  it('maps valid status', () => {
    const res = mapLicenseResponse({
      status: 'valid',
      user: { email: 'a@b.c' },
    });
    expect(res.state).toBe('valid');
    expect(res.user?.email).toBe('a@b.c');
  });
  it('maps invalid and expired', () => {
    expect(mapLicenseResponse({ status: 'invalid' }).state).toBe('invalid');
    expect(mapLicenseResponse({ state: 'expired' }).state).toBe('expired');
  });
  it('handles nested license object and message', () => {
    const res = mapLicenseResponse({
      license: { status: 'valid', expiresAt: '2099-01-01' },
      message: 'ok',
    });
    expect(res.state).toBe('valid');
    expect(res.expiresAt).toBe('2099-01-01');
  });
  it('returns unknown for malformed inputs', () => {
    expect(mapLicenseResponse(null as unknown).state).toBe('unknown');
    expect(mapLicenseResponse({}).state).toBe('unknown');
  });
});
