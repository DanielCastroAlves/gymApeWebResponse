import { useEffect, useMemo, useState } from 'react';
import './pages.css';
import { apiFetch } from '../../api/client';
import { useI18n } from '../../i18n/I18nProvider';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

type Frequency = 'daily' | 'weekly';
type ChallengeRow = {
  id: string;
  title: string;
  points: number;
  frequency: Frequency;
  completed: boolean;
};

export default function Pontos() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ChallengeRow[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ challenges: ChallengeRow[] }>('/app/challenges');
      setRows(data.challenges);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('app.points.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(() => {
    const done = rows.filter((r) => r.completed);
    const points = done.reduce((acc, r) => acc + (r.points || 0), 0);
    const dailyDone = done.filter((r) => r.frequency === 'daily').length;
    const weeklyDone = done.filter((r) => r.frequency === 'weekly').length;
    return { points, dailyDone, weeklyDone };
  }, [rows]);

  return (
    <div className="page">
      <header className="pageHeader">
        <div className="pageTitleRow">
          <button className="backIconBtn" type="button" onClick={() => navigate(-1)} aria-label={t('common.back')}>
            <FaArrowLeft />
          </button>
          <h1>{t('app.points.title')}</h1>
        </div>
        <p>{t('app.points.subtitle')}</p>
      </header>

      {error && (
        <section className="card" style={{ marginBottom: '1rem' }}>
          <p className="errorText" style={{ margin: 0 }}>
            {error}
          </p>
        </section>
      )}

      <section className="card" style={{ marginBottom: '1rem' }}>
        <div className="grid3">
          <div className="card" style={{ background: 'rgba(0,0,0,0.22)' }}>
            <div className="statValue">{stats.points}</div>
            <div className="statLabel">{t('app.points.totalPoints')}</div>
          </div>
          <div className="card" style={{ background: 'rgba(0,0,0,0.22)' }}>
            <div className="statValue">{stats.dailyDone}</div>
            <div className="statLabel">{t('app.points.dailyDone')}</div>
          </div>
          <div className="card" style={{ background: 'rgba(0,0,0,0.22)' }}>
            <div className="statValue">{stats.weeklyDone}</div>
            <div className="statLabel">{t('app.points.weeklyDone')}</div>
          </div>
        </div>

        <p className="hint" style={{ marginTop: 10 }}>
          {t('app.points.hint')}{' '}
          <Link className="cardLink" to="/app/desafios">
            {t('app.points.goToChallenges')}
          </Link>
        </p>
      </section>

      <section className="card">
        <div className="toolbar">
          <h2 style={{ margin: 0 }}>{t('app.points.listTitle')}</h2>
          <button className="ghostBtn" type="button" onClick={() => void load()} disabled={loading}>
            {loading ? t('common.loading') : t('common.retry')}
          </button>
        </div>

        {loading ? (
          <p>{t('common.loading')}</p>
        ) : !rows.length ? (
          <p className="muted" style={{ margin: 0 }}>
            {t('app.points.empty')}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('app.points.challenge')}</th>
                  <th>{t('app.points.frequency')}</th>
                  <th>{t('app.points.points')}</th>
                  <th>{t('app.points.status')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.title}</td>
                    <td>{r.frequency === 'daily' ? t('app.challenges.daily') : t('app.challenges.weekly')}</td>
                    <td>{r.points}</td>
                    <td>{r.completed ? t('app.challenges.completed') : t('app.challenges.pending')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

