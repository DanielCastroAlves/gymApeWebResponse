import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import LanguageSwitcher from '../components/LanguageSwitcher/LanguageSwitcher';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div style={{ color: '#fff', padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 50 }}>
        <LanguageSwitcher />
      </div>
      <h1 style={{ marginTop: 0 }}>{t('notFound.title')}</h1>
      <p>{t('notFound.subtitle')}</p>
      <Link style={{ color: '#ff5e00', fontWeight: 600 }} to="/app">
        {t('notFound.goToDashboard')}
      </Link>
    </div>
  );
}

