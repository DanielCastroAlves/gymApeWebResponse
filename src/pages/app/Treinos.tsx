import './pages.css';
import { useI18n } from '../../i18n/I18nProvider';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api/client';
import { FaArrowLeft } from 'react-icons/fa';

export default function Treinos() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<Array<{ id: string; title: string; objective: string; user_id: string | null; created_at: string }>>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{ workouts: Array<{ id: string; title: string; objective: string; user_id: string | null; created_at: string }> }>(
          '/app/workouts',
        );
        setWorkouts(data.workouts);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const myWorkouts = useMemo(() => workouts.filter((w) => Boolean(w.user_id)), [workouts]);
  const templates = useMemo(() => workouts.filter((w) => !w.user_id), [workouts]);

  return (
    <div className="page">
      <header className="pageHeader">
        <div className="pageTitleRow">
          <button className="backIconBtn" type="button" onClick={() => navigate(-1)} aria-label={t('common.back')}>
            <FaArrowLeft />
          </button>
          <h1>{t('app.workouts.title')}</h1>
        </div>
        <p>{t('app.workouts.subtitle')}</p>
      </header>

      {error && (
        <section className="card" style={{ marginBottom: '1rem' }}>
          <p className="errorText" style={{ margin: 0 }}>
            {error}
          </p>
        </section>
      )}

      <section className="grid" style={{ marginBottom: '1rem' }}>
        <section className="card">
          <h2>{t('app.workouts.myWorkoutsTitle')}</h2>
          {loading ? (
            <p className="muted" style={{ margin: 0 }}>
              {t('common.loading')}
            </p>
          ) : !myWorkouts.length ? (
            <p className="muted" style={{ margin: 0 }}>
              {t('app.workouts.emptyMyWorkouts')}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('admin.workouts.templateTitle')}</th>
                    <th>{t('admin.workouts.objective')}</th>
                  </tr>
                </thead>
                <tbody>
                  {myWorkouts.map((w) => (
                    <tr key={w.id}>
                      <td>
                        <Link className="cardLink" to={`/app/treinos/${w.id}`}>
                          {w.title}
                        </Link>
                      </td>
                      <td>{w.objective}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <h2>{t('app.workouts.templatesTitle')}</h2>
          {loading ? (
            <p className="muted" style={{ margin: 0 }}>
              {t('common.loading')}
            </p>
          ) : !templates.length ? (
            <p className="muted" style={{ margin: 0 }}>
              {t('app.workouts.emptyTemplates')}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('admin.workouts.templateTitle')}</th>
                    <th>{t('admin.workouts.objective')}</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((w) => (
                    <tr key={w.id}>
                      <td>
                        <Link className="cardLink" to={`/app/treinos/${w.id}`}>
                          {w.title}
                        </Link>
                      </td>
                      <td>{w.objective}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

