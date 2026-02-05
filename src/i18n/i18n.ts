import { en } from './en';
import { pt } from './pt';

export type Lang = 'pt' | 'en';

export const DEFAULT_LANG: Lang = 'pt';
export const LANG_STORAGE_KEY = 'apegym.lang';
export const LANG_EVENT = 'apegym:lang';

type Dict = Record<string, any>;
type Params = Record<string, string | number>;

function isLang(v: unknown): v is Lang {
  return v === 'pt' || v === 'en';
}

export function getStoredLang(): Lang {
  try {
    const raw = localStorage.getItem(LANG_STORAGE_KEY);
    return isLang(raw) ? raw : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

export function setStoredLang(lang: Lang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: lang }));
}

function getDict(lang: Lang): Dict {
  return lang === 'en' ? (en as unknown as Dict) : (pt as unknown as Dict);
}

function getByPath(dict: Dict, path: string): unknown {
  const parts = path.split('.').filter(Boolean);
  let cur: any = dict;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function interpolate(template: string, params?: Params) {
  if (!params) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const v = params[key];
    return v === undefined || v === null ? '' : String(v);
  });
}

export function translate(lang: Lang, key: string, params?: Params): string {
  const dict = getDict(lang);
  const value = getByPath(dict, key);
  if (typeof value !== 'string') return key;
  return interpolate(value, params);
}

// Helper para lugares fora do React (ex.: api client).
export function t(key: string, params?: Params): string {
  return translate(getStoredLang(), key, params);
}

