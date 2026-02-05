import { Link } from 'react-router-dom';
import './pages.css';
import { useI18n } from '../../i18n/I18nProvider';

export default function Dashboard() {
  const { t } = useI18n();
  return (
    <div className="page">
      <header className="pageHeader">
        <h1>{t('app.dashboard.title')}</h1>
        <p>{t('app.dashboard.subtitle')}</p>
      </header>

      <section className="grid">
        <div className="card">
          <h2>{t('app.dashboard.weeklyWorkoutTitle')}</h2>
          <p>{t('app.dashboard.weeklyWorkoutDesc')}</p>
          <Link className="cardLink" to="/app/treinos">
            {t('app.dashboard.seeWorkouts')}
          </Link>
        </div>

        <div className="card">
          <h2>{t('app.dashboard.challengesTitle')}</h2>
          <p>{t('app.dashboard.challengesDesc')}</p>
          <span className="hint">{t('app.dashboard.nextStepFetchBackend')}</span>
        </div>

        <div className="card">
          <h2>{t('app.dashboard.pointsTitle')}</h2>
          <p>{t('app.dashboard.pointsDesc')}</p>
          <span className="hint">{t('app.dashboard.rewardsNext')}</span>
        </div>

        <div className="card">
          <h2>{t('app.dashboard.rankingTitle')}</h2>
          <p>{t('app.dashboard.rankingDesc')}</p>
          <Link className="cardLink" to="/app/ranking">
            {t('app.dashboard.seeRanking')}
          </Link>
        </div>
      </section>
    </div>
  );
}

