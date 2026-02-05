import './pages.css';
import { useI18n } from '../../i18n/I18nProvider';

export default function RankingAdmin() {
  const { t } = useI18n();
  return (
    <div className="page">
      <header className="pageHeader">
        <h1>{t('admin.ranking.title')}</h1>
        <p>{t('admin.ranking.subtitle')}</p>
      </header>

      <section className="card">
        <h2>{t('admin.ranking.buildingTitle')}</h2>
        <p>{t('admin.ranking.buildingSubtitle')}</p>
      </section>
    </div>
  );
}

