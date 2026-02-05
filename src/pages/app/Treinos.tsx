import './pages.css';
import { useI18n } from '../../i18n/I18nProvider';

export default function Treinos() {
  const { t } = useI18n();
  return (
    <div className="page">
      <header className="pageHeader">
        <h1>{t('app.workouts.title')}</h1>
        <p>{t('app.workouts.subtitle')}</p>
      </header>

      <section className="card">
        <h2>{t('app.workouts.buildingTitle')}</h2>
        <p>{t('app.workouts.buildingSubtitle')}</p>
        <ul className="list">
          <li>{t('app.workouts.item1')}</li>
          <li>{t('app.workouts.item2')}</li>
          <li>{t('app.workouts.item3')}</li>
        </ul>
      </section>
    </div>
  );
}

