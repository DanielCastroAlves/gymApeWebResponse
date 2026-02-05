import './pages.css';
import { useI18n } from '../../i18n/I18nProvider';

export default function Progresso() {
  const { t } = useI18n();
  return (
    <div className="page">
      <header className="pageHeader">
        <h1>{t('app.progress.title')}</h1>
        <p>{t('app.progress.subtitle')}</p>
      </header>

      <section className="card">
        <h2>{t('app.progress.buildingTitle')}</h2>
        <p>{t('app.progress.buildingSubtitle')}</p>
      </section>
    </div>
  );
}

