import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { type Lang, getStoredLang, setStoredLang, translate, LANG_EVENT } from './i18n';

type Params = Record<string, string | number>;

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, params?: Params) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => getStoredLang());

  const setLang = (next: Lang) => {
    setLangState(next);
    setStoredLang(next);
  };

  useEffect(() => {
    const onCustom = (e: Event) => {
      const ce = e as CustomEvent;
      const next = ce.detail as Lang;
      if (next && next !== lang) setLangState(next);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'apegym.lang') return;
      const next = getStoredLang();
      if (next !== lang) setLangState(next);
    };

    window.addEventListener(LANG_EVENT, onCustom as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(LANG_EVENT, onCustom as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, [lang]);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      t: (key, params) => translate(lang, key, params),
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error(translate(getStoredLang(), 'dev.errors.useI18nOutsideProvider'));
  return ctx;
}

