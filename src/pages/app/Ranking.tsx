import './pages.css';
import { useI18n } from '../../i18n/I18nProvider';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

export default function Ranking() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Array<{ user_id: string; name: string; email: string; points: number }>>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{ leaderboard: Array<{ user_id: string; name: string; email: string; points: number }> }>('/app/leaderboard');
        setRows(data.leaderboard);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const top3 = useMemo(() => rows.slice(0, 3), [rows]);

  return (
    <div className="page">
      <header className="pageHeader">
        <div className="pageTitleRow">
          <button className="backIconBtn" type="button" onClick={() => navigate(-1)} aria-label={t('common.back')}>
            <FaArrowLeft />
          </button>
          <h1>{t('app.ranking.title')}</h1>
        </div>
        <p>{t('app.ranking.subtitle')}</p>
      </header>

      {error && (
        <section className="card" style={{ marginBottom: '1rem' }}>
          <p className="errorText" style={{ margin: 0 }}>
            {error}
          </p>
        </section>
      )}

      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2>{t('app.ranking.top3')}</h2>
        {loading ? (
          <p className="muted" style={{ margin: 0 }}>
            {t('common.loading')}
          </p>
        ) : !top3.length ? (
          <p className="muted" style={{ margin: 0 }}>
            {t('app.ranking.empty')}
          </p>
        ) : (
          <div className="podium">
            {top3.map((r, idx) => (
              <div key={r.user_id} className={`card podiumCard ${user?.id === r.user_id ? 'meRow' : ''}`}>
                <div className="podiumPos">#{idx + 1}</div>
                <div className="podiumName">
                  {r.name} {user?.id === r.user_id ? `(${t('app.ranking.you')})` : ''}
                </div>
                <div className="podiumPoints">
                  {t('app.ranking.points')}: <b>{r.points}</b>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2>{t('app.ranking.fullList')}</h2>
        {loading ? (
          <p className="muted" style={{ margin: 0 }}>
            {t('common.loading')}
          </p>
        ) : !rows.length ? (
          <p className="muted" style={{ margin: 0 }}>
            {t('app.ranking.empty')}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('app.ranking.position')}</th>
                  <th>{t('app.ranking.name')}</th>
                  <th>{t('app.ranking.points')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.user_id} className={user?.id === r.user_id ? 'meRow' : undefined}>
                    <td>#{idx + 1}</td>
                    <td>
                      {r.name} {user?.id === r.user_id ? `(${t('app.ranking.you')})` : ''}
                    </td>
                    <td>{r.points}</td>
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

