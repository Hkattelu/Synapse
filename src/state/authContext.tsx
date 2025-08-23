import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, type ApiUser, type ApiMembership } from '../lib/api';

type AuthState = {
  loading: boolean;
  authenticated: boolean;
  user?: ApiUser;
  membership?: ApiMembership;
  error?: string;
};

type AuthContextType = AuthState & {
  signup: (input: { email: string; password: string; name?: string }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  donateDemo: (amount?: number) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ loading: true, authenticated: false });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: undefined }));
    try {
      const data = await api.session();
      setState({
        loading: false,
        authenticated: !!data.authenticated,
        user: data.user,
        membership: data.membership,
      });
    } catch (e: any) {
      setState({ loading: false, authenticated: false, error: e?.message });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signup = useCallback(async (input: { email: string; password: string; name?: string }) => {
    setState((s) => ({ ...s, loading: true, error: undefined }));
    try {
      const { user, membership } = await api.signup(input);
      setState({ loading: false, authenticated: true, user, membership });
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e?.message }));
      throw e;
    }
  }, []);

  const login = useCallback(async (input: { email: string; password: string }) => {
    setState((s) => ({ ...s, loading: true, error: undefined }));
    try {
      const { user, membership } = await api.login(input);
      setState({ loading: false, authenticated: true, user, membership });
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e?.message }));
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setState({ loading: false, authenticated: false });
  }, []);

  const donateDemo = useCallback(async (amount?: number) => {
    setState((s) => ({ ...s, loading: true, error: undefined }));
    try {
      const { membership } = await api.demoPayment({ amount });
      setState((s) => ({ ...s, loading: false, membership }));
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e?.message }));
      throw e;
    }
  }, []);

  const value: AuthContextType = {
    ...state,
    signup,
    login,
    logout,
    refresh,
    donateDemo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
