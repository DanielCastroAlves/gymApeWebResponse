import { Link } from 'react-router-dom';
import './pages.css';
import { useI18n } from '../../i18n/I18nProvider';
import { useAuth } from '../../auth/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../api/client';

export default function Dashboard() {
  const { t } = useI18n();
  const { user } = useAuth();

  const [pointsLoading, setPointsLoading] = useState(true);
  const [points, setPoints] = useState<number | null>(null);

  useEffect(() => {
    const run = async () => {
      setPointsLoading(true);
      try {
        const data = await apiFetch<{ challenges: Array<{ points: number; completed: boolean }> }>('/app/challenges');
        const sum = data.challenges.filter((c) => c.completed).reduce((acc, c) => acc + (c.points || 0), 0);
        setPoints(sum);
      } catch {
        setPoints(null);
      } finally {
        setPointsLoading(false);
      }
    };
    void run();
  }, []);

  const pointsText = useMemo(() => {
    if (pointsLoading) return t('common.loading');
    if (points === null) return t('app.dashboard.pointsDescFallback');
    return t('app.dashboard.pointsDesc', { points });
  }, [points, pointsLoading, t]);

  return (
    <div className="page">
      <header className="pageHeader">
        <h1>{user?.name ? t('app.dashboard.hello', { name: user.name }) : t('app.dashboard.title')}</h1>
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
          <Link className="cardLink" to="/app/desafios">
            {t('app.dashboard.seeChallenges')}
          </Link>
        </div>

        <div className="card">
          <h2>{t('app.dashboard.pointsTitle')}</h2>
          <p>{pointsText}</p>
          <Link className="cardLink" to="/app/pontos">
            {t('app.dashboard.seePoints')}
          </Link>
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

