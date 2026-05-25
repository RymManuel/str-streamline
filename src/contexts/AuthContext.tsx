import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthSession } from '@/types';
import { api, getToken, setToken } from '@/lib/api';
import { sessionStore } from '@/lib/session';
import { sanitizeInput, isValidEmail } from '@/lib/secureHash';

const SESSION_DURATION = 2 * 60 * 60 * 1000;

interface AuthContextType {
  session: AuthSession | null;
  loading: boolean;
  needsSetup: boolean;
  apiOnline: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  setupAdmin: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: () => boolean;
  logActivity: (action: string, details?: string) => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);

  const restoreSession = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const { user } = await api.me();
      const restored: AuthSession = {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        token,
        expiresAt: Date.now() + SESSION_DURATION,
      };
      sessionStore.set(restored);
      setSession(restored);
    } catch {
      setToken(null);
      sessionStore.clear();
      setSession(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const health = await api.health();
        setApiOnline(health.database === 'connected');
      } catch {
        setApiOnline(false);
      }

      try {
        const { needsSetup: setup } = await api.setupStatus();
        setNeedsSetup(setup);
        if (!setup) await restoreSession();
      } catch {
        setNeedsSetup(false);
      }

      setLoading(false);
    })();
  }, [restoreSession]);

  useEffect(() => {
    const interval = setInterval(() => {
      const s = sessionStore.get();
      if (s && s.expiresAt <= Date.now()) {
        sessionStore.clear();
        setToken(null);
        setSession(null);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const logActivity = useCallback((action: string, details?: string) => {
    api.recordLog(action, details).catch(() => {});
  }, []);

  const login = async (email: string, password: string) => {
    const cleanEmail = sanitizeInput(email);
    if (!cleanEmail || !password) return { success: false, error: 'Email and password are required.' };
    if (!isValidEmail(cleanEmail)) return { success: false, error: 'Invalid email format.' };
    if (password.length > 200) return { success: false, error: 'Invalid credentials.' };

    try {
      const res = await api.login(cleanEmail, password);
      setToken(res.token);
      const newSession: AuthSession = {
        userId: res.user.id,
        email: res.user.email,
        role: res.user.role,
        name: res.user.name,
        token: res.token,
        expiresAt: new Date(res.expiresAt).getTime(),
      };
      sessionStore.set(newSession);
      setSession(newSession);
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message || 'Invalid email or password.' };
    }
  };

  const setupAdmin = async (name: string, email: string, password: string) => {
    try {
      const res = await api.setupAdmin({ name, email, password });
      setToken(res.token);
      setNeedsSetup(false);
      const newSession: AuthSession = {
        userId: res.user.id,
        email: res.user.email,
        role: res.user.role,
        name: res.user.name,
        token: res.token,
        expiresAt: new Date(res.expiresAt).getTime(),
      };
      sessionStore.set(newSession);
      setSession(newSession);
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message || 'Setup failed.' };
    }
  };

  const logout = () => {
    api.logout().catch(() => {});
    setToken(null);
    sessionStore.clear();
    setSession(null);
  };

  const isAdmin = () => session?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        needsSetup,
        apiOnline,
        login,
        setupAdmin,
        logout,
        isAdmin,
        logActivity,
        refreshSession: restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
