import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { UpdateStatus } from '../types/preload';

export const UpdateBanner: React.FC = () => {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let unSub: (() => void) | undefined;
    (async () => {
      try {
        if (window.SynapseUpdates) {
          const last = await window.SynapseUpdates.getLast();
          setStatus(last);
          unSub = window.SynapseUpdates.onStatus((s) => setStatus(s));
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      try {
        unSub?.();
      } catch {
        // ignore
      }
    };
  }, []);

  const showBanner = useMemo(
    () => Boolean(status?.updateAvailable && status?.latestVersion),
    [status]
  );

  if (!showBanner) return null;

  const downloadUrl = status?.downloadUrl;
  const href = downloadUrl || '/downloads';
  const isExternal =
    typeof downloadUrl === 'string' && /^https?:\/\//i.test(downloadUrl);

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-sm flex items-center justify-center gap-3">
      <span>
        A new version {status?.latestVersion} is available (you have{' '}
        {status?.currentVersion}).
      </span>
      {isExternal ? (
        <a
          className="px-3 py-1 rounded bg-amber-600 text-white hover:bg-amber-700"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (window.SynapseUpdates && downloadUrl) {
              e.preventDefault();
              try {
                void window.SynapseUpdates.openDownload(downloadUrl);
              } catch {
                window.open(downloadUrl, '_blank', 'noopener');
              }
            }
          }}
        >
          Get Update
        </a>
      ) : (
        <Link
          className="px-3 py-1 rounded bg-amber-600 text-white hover:bg-amber-700"
          to={href}
        >
          Get Update
        </Link>
      )}
      <button
        className="text-amber-900/80 underline-offset-2 hover:underline disabled:opacity-60"
        disabled={checking}
        onClick={async () => {
          if (!window.SynapseUpdates) return;
          setChecking(true);
          try {
            setStatus(await window.SynapseUpdates.checkNow());
          } finally {
            setChecking(false);
          }
        }}
      >
        {checking ? 'Checking…' : 'Check again'}
      </button>
    </div>
  );
};
