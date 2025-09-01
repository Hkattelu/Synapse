import React, { useMemo, useState } from 'react';
import { useLicense } from '../state/license';

export const LicenseGate: React.FC = () => {
  const { status, loading, setLicense, validateNow, clear } = useLicense();
  const [input, setInput] = useState('');
  const needsGate = useMemo(() => {
    const s = status?.state;
    return (
      s === 'invalid' ||
      s === 'expired' ||
      ((!s || s === 'unknown') && !status?.licenseMasked)
    );
  }, [status]);

  if (!needsGate) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-purple-200">
        <div className="p-5 border-b border-purple-100">
          <h2 className="text-lg font-semibold text-gray-900">Enter License</h2>
          <p className="text-xs text-gray-600 mt-1">
            A valid license is required to use Synapse Studio. Your license is
            stored securely on this device.
          </p>
        </div>
        <div className="p-5 space-y-3">
          {status?.licenseMasked && (
            <div className="text-xs text-gray-700">
              Current license: <code>{status.licenseMasked}</code>
            </div>
          )}
          {status?.message && (
            <div className="text-xs text-red-600">{status.message}</div>
          )}
          <input
            className="w-full p-2 border border-gray-300 rounded text-sm"
            placeholder="Paste your license key…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm disabled:opacity-60"
              disabled={loading || input.trim().length === 0}
              onClick={() => void setLicense(input.trim())}
            >
              {loading ? 'Verifying…' : 'Save & Verify'}
            </button>
            <button
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              disabled={loading}
              onClick={() => void validateNow()}
              title="Retry validation"
            >
              Retry
            </button>
            {status?.licenseMasked && (
              <button
                className="px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded text-sm"
                disabled={loading}
                onClick={() => void clear()}
                title="Remove saved license"
              >
                Remove
              </button>
            )}
          </div>
          <p className="text-[11px] text-gray-500">
            Network errors surface as "unknown" status. You can continue after
            activation even when offline.
          </p>
        </div>
      </div>
    </div>
  );
};
