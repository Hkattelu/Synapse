export function compareVersions(a: string, b: string): number {
  // Ignore build metadata ("+") and only strip a hyphen when it begins a prerelease label (letters).
  // Preserve numeric hyphenated cores like date-style versions (e.g., "2024-09-01").
  // Compare only the numeric dot segments, padding with zeros; tolerate a leading "v" and numeric prefixes in segments.
  const core = (v: string) => {
    const noV = v.replace(/^v/i, '');
    const dropBuild = noV.split('+', 1)[0];
    // Drop hyphen only when it starts a prerelease label (letters), e.g., "1.2.3-alpha" → "1.2.3"
    return dropBuild.replace(/-[A-Za-z].*$/, '');
  };
  const toNums = (v: string) => {
    const c = core(v);
    const parts = c.match(/\d+/g) || [];
    return parts.map(Number);
  };
  const pa = toNums(a);
  const pb = toNums(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na !== nb) return na > nb ? 1 : -1;
  }
  return 0;
}

export type ParsedUpdate = {
  latestVersion?: string;
  downloadUrl?: string;
};

export function parseUpdatePayload(
  payload: unknown,
  platKey: string
): ParsedUpdate {
  if (!payload || typeof payload !== 'object') return {};
  const obj = payload as Record<string, unknown>;
  const latest = (obj.latestVersion || obj.version || obj.tag) as
    | string
    | undefined;
  let url: string | undefined;
  const downloads = obj.downloads as Record<string, unknown> | undefined;
  if (downloads && typeof downloads === 'object') {
    url =
      (downloads[platKey] as string | undefined) ||
      (downloads[platKey.split('-')[0]] as string | undefined);
  }
  const platforms = obj.platforms as Record<string, unknown> | undefined;
  if (!url && platforms && typeof platforms === 'object') {
    const p =
      (platforms[platKey] as Record<string, unknown> | undefined) ||
      (platforms[platKey.split('-')[0]] as Record<string, unknown> | undefined);
    if (p && typeof p === 'object')
      url =
        (p.url as string | undefined) || (p.downloadUrl as string | undefined);
  }
  const assets = obj.assets as Array<Record<string, unknown>> | undefined;
  if (!url && Array.isArray(assets)) {
    const candidates = assets
      .filter((a) => typeof a?.browser_download_url === 'string')
      .map((a) => ({
        name: String(a?.name || ''),
        url: a.browser_download_url as string,
      }));
    const platLC = platKey.toLowerCase();
    const basePlat = platLC.split('-')[0];
    const prefer =
      candidates.find((c) => c.name.toLowerCase().includes(platLC)) ||
      candidates.find((c) => c.name.toLowerCase().includes(basePlat));
    url = prefer?.url;
  }
  return { latestVersion: latest, downloadUrl: url };
}
