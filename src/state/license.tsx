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

// Lightweight web-only storage for a public test license key
const WEB_LICENSE_STORAGE_KEY = 'synapse-web-license';
const DEFAULT_PUBLIC_TEST_KEY = 'SYNAPSE-PUBLIC-TEST-2025';

function mask(license: string | null | undefined): string | null {
  if (!license) return null;
  const len = license.length;
  if (len <= 4) return '*'.repeat(Math.max(0, len - 1)) + license.slice(-1);
  return `${license.slice(0, 2)}${'*'.repeat(Math.max(0, len - 6))}${license.slice(-4)}`;
}

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const getPublicTestKey = (): string => {
    const meta = (import.meta as unknown as { env?: Record<string, string | undefined> }) || undefined;
    return (
      (typeof import.meta !== 'undefined' && meta.env?.VITE_PUBLIC_TEST_LICENSE_KEY) ||
      DEFAULT_PUBLIC_TEST_KEY
    );
  };

  const isWebTestLicenseValid = (license: string | null | undefined): boolean => {
    if (!license) return false;
    try {
      const expected = getPublicTestKey();
      return license.trim() === expected;
    } catch {
      return false;
    }
  };

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
          // Non-Electron/web fallback: gate behind an explicit flag or dev-only condition
          const meta =
            (import.meta as unknown as {
              env?: Record<string, string | undefined>;
            }) || undefined;
          const allowWeb =
            // Vite-style env flag for explicit opt-in
            (typeof import.meta !== 'undefined' &&
              meta.env?.VITE_ALLOW_WEB_NO_LICENSE === 'true') ||
            // Common dev-only allowance when no flag is set
            process.env.NODE_ENV !== 'production';

          // Check for web test license in storage
          const stored = ((): string | null => {
            try {
              return localStorage.getItem(WEB_LICENSE_STORAGE_KEY);
            } catch {
              return null;
            }
          })();

          if (allowWeb) {
            setStatus({
              state: 'valid',
              message: 'web environment',
              licenseMasked: stored ? mask(stored) : null,
            });
          } else if (isWebTestLicenseValid(stored)) {
            setStatus({
              state: 'valid',
              message: 'web test license',
              licenseMasked: mask(stored),
            });
          } else {
            setStatus({
              state: 'unknown',
              message: 'license unavailable in web build',
            });
          }
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
    // Renderer side: if Electron bridge exists, delegate to it.
    if (typeof window !== 'undefined' && window.SynapseLicense) {
      setLoading(true);
      try {
        const s = await window.SynapseLicense.set(license);
        setStatus(s);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Web build: accept a public test key for gated routes
    setLoading(true);
    try {
      if (isWebTestLicenseValid(license)) {
        try {
          localStorage.setItem(WEB_LICENSE_STORAGE_KEY, license.trim());
        } catch {
          // ignore storage failures; still treat as valid for this session
        }
        setStatus({
          state: 'valid',
          message: 'web test license',
          licenseMasked: mask(license.trim()),
        });
      } else {
        setStatus({ state: 'invalid', message: 'Invalid license for web test' });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const validateNow = useCallback(async () => {
    if (typeof window !== 'undefined' && window.SynapseLicense) {
      setLoading(true);
      try {
        const s = await window.SynapseLicense.validateNow();
        setStatus(s);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Web build: just re-read from storage/env
    setLoading(true);
    try {
      const stored = ((): string | null => {
        try {
          return localStorage.getItem(WEB_LICENSE_STORAGE_KEY);
        } catch {
          return null;
        }
      })();
      if (isWebTestLicenseValid(stored)) {
        setStatus({ state: 'valid', message: 'web test license', licenseMasked: mask(stored) });
      } else {
        setStatus({ state: 'unknown', message: 'license unavailable in web build' });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(async () => {
    if (typeof window !== 'undefined' && window.SynapseLicense) {
      setLoading(true);
      try {
        const s = await window.SynapseLicense.clear();
        setStatus(s);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      try {
        localStorage.removeItem(WEB_LICENSE_STORAGE_KEY);
      } catch {
        // ignore
      }
      setStatus({ state: 'unknown', message: 'license cleared' });
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
