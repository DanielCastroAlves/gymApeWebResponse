import './pages.css';
import { useI18n } from '../../i18n/I18nProvider';

export default function Desafios() {
  const { t } = useI18n();
  return (
    <div className="page">
      <header className="pageHeader">
        <h1>{t('admin.challenges.title')}</h1>
        <p>{t('admin.challenges.subtitle')}</p>
      </header>

      <section className="card">
        <h2>{t('admin.challenges.buildingTitle')}</h2>
        <p>{t('admin.challenges.buildingSubtitle')}</p>
      </section>
    </div>
  );
}

