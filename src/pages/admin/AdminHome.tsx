import './pages.css';
import { useI18n } from '../../i18n/I18nProvider';

export default function AdminHome() {
  const { t } = useI18n();
  return (
    <div className="page">
      <header className="pageHeader">
        <h1>{t('admin.home.title')}</h1>
        <p>{t('admin.home.subtitle')}</p>
      </header>

      <section className="card">
        <h2>{t('admin.home.suggestedMvp')}</h2>
        <ul className="list">
          <li>{t('admin.home.item1')}</li>
          <li>{t('admin.home.item2')}</li>
          <li>{t('admin.home.item3')}</li>
        </ul>
      </section>
    </div>
  );
}

