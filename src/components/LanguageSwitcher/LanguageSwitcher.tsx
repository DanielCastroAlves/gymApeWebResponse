import React from 'react';
import { useI18n } from '../../i18n/I18nProvider';

import './LanguageSwitcher.css';

export default function LanguageSwitcher({ compact = true }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="langSwitcher" role="group" aria-label={t('language.switcherLabel')}>
      <button
        type="button"
        className={`langBtn ${lang === 'pt' ? 'active' : ''}`}
        onClick={() => setLang('pt')}
        aria-pressed={lang === 'pt'}
        aria-label={t('language.switchToPt')}
        title={compact ? undefined : t('language.pt')}
      >
        🇧🇷
        {!compact && <span className="langText">{t('language.pt')}</span>}
      </button>
      <button
        type="button"
        className={`langBtn ${lang === 'en' ? 'active' : ''}`}
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        aria-label={t('language.switchToEn')}
        title={compact ? undefined : t('language.en')}
      >
        🇺🇸
        {!compact && <span className="langText">{t('language.en')}</span>}
      </button>
    </div>
  );
}

