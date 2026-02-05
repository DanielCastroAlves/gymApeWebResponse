import { t as i18nT } from '../i18n/i18n';

const TOKEN_KEY = 'apegym.auth.token';

function getBaseUrl() {
  const base = import.meta.env.VITE_API_URL as string | undefined;
  if (!base) throw new Error(i18nT('auth.errors.backendNotConfigured'));
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers = new Headers(init?.headers);
  headers.set('content-type', headers.get('content-type') ?? 'application/json');

  const token = getToken();
  if (token) headers.set('authorization', `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  const json = text ? (JSON.parse(text) as any) : undefined;

  if (!res.ok) {
    const message = json?.error?.message ?? i18nT('auth.errors.genericHttpError', { status: res.status });
    throw new Error(message);
  }

  return json as T;
}

