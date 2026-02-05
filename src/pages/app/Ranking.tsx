import './pages.css';
import { useI18n } from '../../i18n/I18nProvider';

export default function Ranking() {
  const { t } = useI18n();
  return (
    <div className="page">
      <header className="pageHeader">
        <h1>{t('app.ranking.title')}</h1>
        <p>{t('app.ranking.subtitle')}</p>
      </header>

      <section className="card">
        <h2>{t('app.ranking.mockTitle')}</h2>
        <ol className="list">
          <li>{t('app.ranking.you')}</li>
          <li>{t('app.ranking.student2')}</li>
          <li>{t('app.ranking.student3')}</li>
        </ol>
      </section>
    </div>
  );
}

