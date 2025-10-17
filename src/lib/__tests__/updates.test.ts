import { describe, it, expect } from 'vitest';
import { compareVersions, parseUpdatePayload } from '../versions';

describe('compareVersions', () => {
  it('orders simple semvers', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.2.0', '1.1.9')).toBe(1);
    expect(compareVersions('1.2.0', '2.0.0')).toBeLessThan(0);
  });
  it('handles prerelease/build sections leniently', () => {
    expect(compareVersions('1.2.3-alpha.1', '1.2.3')).toBe(0);
    expect(compareVersions('1.2.3+build.5', '1.2.4')).toBeLessThan(0);
  });
  it('pads shorter versions', () => {
    expect(compareVersions('1.2', '1.2.0')).toBe(0);
    expect(compareVersions('1.10', '1.9.9')).toBe(1);
  });
});

describe('parseUpdatePayload', () => {
  const plat = 'win32-x64';
  it('reads latestVersion and downloads object', () => {
    const payload = {
      latestVersion: '1.2.3',
      downloads: { 'win32-x64': 'https://example.com/win.exe' },
    };
    expect(parseUpdatePayload(payload, plat)).toEqual({
      latestVersion: '1.2.3',
      downloadUrl: 'https://example.com/win.exe',
    });
  });
  it('supports platforms map', () => {
    const payload = {
      version: '2.0.0',
      platforms: { 'win32-x64': { url: 'https://example.com/win.exe' } },
    };
    expect(parseUpdatePayload(payload, plat).downloadUrl).toContain('win.exe');
  });
  it('falls back to GitHub assets array', () => {
    const payload = {
      tag: '3.1.4',
      assets: [
        {
          name: 'Synapse-win32-x64.exe',
          browser_download_url: 'https://gh/win.exe',
        },
      ],
    };
    const out = parseUpdatePayload(payload, plat);
    expect(out.latestVersion).toBe('3.1.4');
    expect(out.downloadUrl).toContain('win.exe');
  });
});
