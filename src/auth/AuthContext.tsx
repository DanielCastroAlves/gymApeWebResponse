import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type UserRole = 'aluno' | 'admin';

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
  return email.toLowerCase().includes('admin') ? 'admin' : 'aluno';
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
      throw new Error('Informe e-mail e senha.');
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
        throw new Error(json?.error?.message ?? 'Falha no login.');
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
      name: role === 'admin' ? 'Administrador' : 'Aluno',
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
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return ctx;
}

