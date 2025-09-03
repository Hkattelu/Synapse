export function compareVersions(a: string, b: string): number {
  // Semver-aware comparison that ignores build metadata (+) but respects prerelease precedence.
  // Also tolerates a leading "v" in tags and numeric prefixes within segments.
  const stripBuild = (v: string) => v.replace(/^v/i, '').split('+', 1)[0];
  const parse = (v: string) => {
    const s = stripBuild(v);
    // Pre-release separator: first '-' only when the portion before it looks semver-like (contains at least one dot).
    const hy = s.indexOf('-');
    const looksSemverCore = hy >= 0 ? s.slice(0, hy).includes('.') : false;
    const coreStr = hy >= 0 && looksSemverCore ? s.slice(0, hy) : s;
    const preStr = hy >= 0 && looksSemverCore ? s.slice(hy + 1) : null;
    const coreNums = coreStr.split('.').map((n) => parseInt(n, 10) || 0);
    const preIds = preStr
      ? preStr.split('.').map((id) => (/^\d+$/.test(id) ? Number(id) : id))
      : null;
    return { core: coreNums, pre: preIds as (number | string)[] | null };
  };
  const pa = parse(a);
  const pb = parse(b);
  const len = Math.max(pa.core.length, pb.core.length);
  for (let i = 0; i < len; i++) {
    const na = pa.core[i] ?? 0;
    const nb = pb.core[i] ?? 0;
    if (na !== nb) return na > nb ? 1 : -1;
  }
  // Core equal -> handle prerelease precedence: release > prerelease
  if (!pa.pre && !pb.pre) return 0;
  if (!pa.pre) return 1;
  if (!pb.pre) return -1;
  const m = Math.max(pa.pre.length, pb.pre.length);
  for (let i = 0; i < m; i++) {
    const ia = pa.pre[i];
    const ib = pb.pre[i];
    if (ia === undefined) return -1; // shorter prerelease has lower precedence
    if (ib === undefined) return 1;
    const aNum = typeof ia === 'number';
    const bNum = typeof ib === 'number';
    if (aNum && bNum) {
      if (ia !== ib) return (ia as number) > (ib as number) ? 1 : -1;
    } else if (aNum !== bNum) {
      // Numeric identifiers have lower precedence than non-numeric
      return aNum ? -1 : 1;
    } else {
      const cmp = String(ia).localeCompare(String(ib));
      if (cmp !== 0) return cmp > 0 ? 1 : -1;
    }
  }
  return 0;
}

export type ParsedUpdate = {
  latestVersion?: string;
  downloadUrl?: string;
  prerelease?: boolean;
  channel?: 'stable' | 'beta' | 'alpha' | string;
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
  const prerelease = obj.prerelease as boolean | undefined;
  const channel = obj.channel as string | undefined;
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
  return { latestVersion: latest, downloadUrl: url, prerelease, channel };
}
