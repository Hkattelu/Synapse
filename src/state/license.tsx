import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { LicenseStatus } from '../types/preload';

type LicenseContextValue = {
  status: LicenseStatus | null;
  loading: boolean;
  setLicense: (license: string) => Promise<void>;
  validateNow: () => Promise<void>;
  clear: () => Promise<void>;
};

const LicenseContext = createContext<LicenseContextValue | null>(null);

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Bootstrap from main process (Electron) if available
  useEffect(() => {
    let unSub: (() => void) | undefined;
    (async () => {
      try {
        if (typeof window !== 'undefined' && window.SynapseLicense) {
          const s = await window.SynapseLicense.getStatus();
          setStatus(s);
          unSub = window.SynapseLicense.onStatus((payload) =>
            setStatus(payload)
          );
        } else {
          // Non-Electron/web fallback: treat as valid to avoid blocking web demo
          setStatus({
            state: 'valid',
            message: 'web environment',
            licenseMasked: null,
          });
        }
      } catch (e) {
        setStatus({ state: 'unknown', message: String(e) });
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

  const setLicense = useCallback(async (license: string) => {
    if (!window.SynapseLicense) return;
    setLoading(true);
    try {
      const s = await window.SynapseLicense.set(license);
      setStatus(s);
    } finally {
      setLoading(false);
    }
  }, []);

  const validateNow = useCallback(async () => {
    if (!window.SynapseLicense) return;
    setLoading(true);
    try {
      const s = await window.SynapseLicense.validateNow();
      setStatus(s);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(async () => {
    if (!window.SynapseLicense) return;
    setLoading(true);
    try {
      const s = await window.SynapseLicense.clear();
      setStatus(s);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ status, loading, setLicense, validateNow, clear }),
    [status, loading, setLicense, validateNow, clear]
  );

  return (
    <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>
  );
};

export function useLicense() {
  const ctx = useContext(LicenseContext);
  if (!ctx) throw new Error('useLicense must be used within LicenseProvider');
  return ctx;
}
