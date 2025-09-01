export function compareVersions(a: string, b: string): number {
  const pa = a
    .split(/[.-]/)
    .map((p) => parseInt(p.replace(/\D+/g, ''), 10) || 0);
  const pb = b
    .split(/[.-]/)
    .map((p) => parseInt(p.replace(/\D+/g, ''), 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
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
    const prefer =
      candidates.find((c) => c.name.includes(platKey)) ||
      candidates.find((c) =>
        c.name.toLowerCase().includes(platKey.split('-')[0])
      );
    url = prefer?.url;
  }
  return { latestVersion: latest, downloadUrl: url };
}
