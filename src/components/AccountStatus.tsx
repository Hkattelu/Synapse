import React, { useState } from 'react';
import { useAuth } from '../state/authContext';

export const AccountStatus: React.FC = () => {
  const { authenticated, user, membership, login, signup, logout, loading, error } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'login') await login({ email, password });
      else await signup({ email, password, name });
      setOpen(false);
    } catch {}
  };

  if (authenticated) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="px-3 py-2 text-sm font-medium rounded-lg bg-white border border-purple-200 hover:border-purple-300 text-purple-700"
        >
          {user?.name || user?.email} {membership?.active ? '• Member' : ''}
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-64 bg-white border border-purple-200 rounded-lg shadow-lg p-3 z-50">
            <div className="text-sm text-gray-700 mb-2">
              Signed in as <span className="font-medium">{user?.email}</span>
            </div>
            <div className="text-xs text-gray-600 mb-3">
              Membership: {membership?.active ? 'Active' : 'Inactive'}
              {membership?.expiresAt && (
                <span> (expires {new Date(membership.expiresAt).toLocaleDateString()})</span>
              )}
            </div>
            <button
              onClick={() => void logout()}
              className="w-full text-left px-3 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-2 text-sm font-medium rounded-lg bg-white border border-purple-200 hover:border-purple-300 text-purple-700"
      >
        Sign in
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-purple-200 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center justify-between mb  -2">
            <h3 className="font-semibold text-gray-900 text-sm">
              {mode === 'login' ? 'Sign in' : 'Create an account'}
            </h3>
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-xs text-purple-600 hover:underline"
            >
              {mode === 'login' ? 'Create account' : 'Have an account? Sign in'}
            </button>
          </div>
          <form onSubmit={onSubmit} className="space-y-2 mt-2">
            {mode === 'signup' && (
              <input
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <input
              className="w-full p-2 border border-gray-300 rounded text-sm"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
            <input
              className="w-full p-2 border border-gray-300 rounded text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
            {error && <div className="text-xs text-red-600">{String(error)}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm disabled:opacity-60"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
