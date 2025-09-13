// Lightweight "prefetch on idle" helper for lazy-loaded modules
// Only used in development to make lazy chunks feel instantaneous the
// first time the user opens a panel.

export type Prefetcher = () => Promise<unknown>;

// requestIdleCallback polyfill
const ric: (cb: () => void, timeout?: number) => number =
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? (cb) => (window as any).requestIdleCallback(cb)
    : (cb, timeout) => window.setTimeout(cb, timeout ?? 1);

export function prefetchOnIdle(
  tasks: Prefetcher[] | Prefetcher,
  timeout = 500
) {
  const list = Array.isArray(tasks) ? tasks : [tasks];
  ric(() => {
    for (const t of list) {
      try {
        // Fire and forget
        t().catch(() => {});
      } catch {}
    }
  }, timeout);
}
