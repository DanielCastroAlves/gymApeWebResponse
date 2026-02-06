import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { t as i18nT } from '../i18n/i18n';

export type UserRole = 'aluno' | 'professor' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (params: { email: string; password: string }) => Promise<AuthUser>;
  signOut: () => void;
}

const STORAGE_KEY = 'apegym.auth.user';
const TOKEN_KEY = 'apegym.auth.token';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function inferRoleFromEmail(email: string): UserRole {
  // Regra simples (mock): emails com "admin" viram admin.
  // Troque isso quando plugar seu backend.
  const lower = email.toLowerCase();
  if (lower.includes('admin')) return 'admin';
  if (lower.includes('prof') || lower.includes('teacher')) return 'professor';
  return 'aluno';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn: AuthContextValue['signIn'] = async ({ email, password }) => {
    // Se houver backend configurado via VITE_API_URL, usa API.
    // Caso contrário, mantém o mock atual (MVP).
    if (!email.trim() || !password.trim()) {
      throw new Error(i18nT('auth.errors.enterEmailAndPassword'));
    }

    const apiBase = import.meta.env.VITE_API_URL as string | undefined;
    if (apiBase) {
      const normalizedBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
      const res = await fetch(`${normalizedBase}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = (await res.json()) as any;
      if (!res.ok) {
        throw new Error(json?.error?.message ?? i18nT('auth.errors.loginFailed'));
      }

      const nextUser: AuthUser = json.user;
      setUser(nextUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      if (json.token) localStorage.setItem(TOKEN_KEY, String(json.token));
      return nextUser;
    }

    const role = inferRoleFromEmail(email);
    const nextUser: AuthUser = {
      id: crypto.randomUUID(),
      name: role === 'admin' ? i18nT('auth.roles.admin') : i18nT('auth.roles.student'),
      email,
      role,
    };

    setUser(nextUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    return nextUser;
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  const value = useMemo<AuthContextValue>(() => ({ user, loading, signIn, signOut }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error(i18nT('dev.errors.useAuthOutsideProvider'));
  return ctx;
}

