import { useEffect, useMemo, useState } from 'react';
import './pages.css';
import { apiFetch } from '../../api/client';
import { useI18n } from '../../i18n/I18nProvider';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

type Frequency = 'daily' | 'weekly';
type ChallengeRow = {
  id: string;
  title: string;
  points: number;
  frequency: Frequency;
  active_from: string | null;
  active_to: string | null;
  user_id: string | null;
  created_by: string;
  created_at: string;
  completed: boolean;
};

export default function DesafiosAluno() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ChallengeRow[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ challenges: ChallengeRow[] }>('/app/challenges');
      setRows(data.challenges);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('app.challenges.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const freqLabel = (f: Frequency) => (f === 'daily' ? t('app.challenges.daily') : t('app.challenges.weekly'));

  const stats = useMemo(() => {
    const total = rows.length;
    const done = rows.filter((r) => r.completed).length;
    const points = rows.filter((r) => r.completed).reduce((acc, r) => acc + (r.points || 0), 0);
    return { total, done, points };
  }, [rows]);

  const toggle = async (id: string, nextCompleted: boolean) => {
    if (togglingId) return;
    setTogglingId(id);
    setError(null);
    try {
      await apiFetch(`/app/challenges/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ completed: nextCompleted }),
      });
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, completed: nextCompleted } : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('app.challenges.toggleFailed'));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="page">
      <header className="pageHeader">
        <div className="pageTitleRow">
          <button className="backIconBtn" type="button" onClick={() => navigate(-1)} aria-label={t('common.back')}>
            <FaArrowLeft />
          </button>
          <h1>{t('app.challenges.title')}</h1>
        </div>
        <p>{t('app.challenges.subtitle')}</p>
      </header>

      {error && (
        <section className="card" style={{ marginBottom: '1rem' }}>
          <p style={{ margin: 0, color: '#ffd2bf' }}>{error}</p>
        </section>
      )}

      <section className="card" style={{ marginBottom: '1rem' }}>
        <div className="grid3">
          <div className="card" style={{ background: 'rgba(0,0,0,0.22)' }}>
            <div className="statValue">{stats.total}</div>
            <div className="statLabel">{t('app.challenges.total')}</div>
          </div>
          <div className="card" style={{ background: 'rgba(0,0,0,0.22)' }}>
            <div className="statValue">{stats.done}</div>
            <div className="statLabel">{t('app.challenges.done')}</div>
          </div>
          <div className="card" style={{ background: 'rgba(0,0,0,0.22)' }}>
            <div className="statValue">{stats.points}</div>
            <div className="statLabel">{t('app.challenges.points')}</div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="toolbar">
          <h2 style={{ margin: 0 }}>{t('app.challenges.listTitle')}</h2>
          <button className="ghostBtn" type="button" onClick={() => void load()} disabled={loading}>
            {loading ? t('common.loading') : t('common.retry')}
          </button>
        </div>

        {loading ? (
          <p>{t('common.loading')}</p>
        ) : !rows.length ? (
          <p className="muted" style={{ margin: 0 }}>
            {t('app.challenges.empty')}
          </p>
        ) : (
          <div className="grid">
            {rows.map((c) => (
              <div key={c.id} className="card" style={{ background: 'rgba(0,0,0,0.22)' }}>
                <div className="toolbar" style={{ margin: 0 }}>
                  <h2 style={{ margin: 0 }}>{c.title}</h2>
                  <span className="muted" style={{ fontWeight: 800 }}>
                    +{c.points} • {freqLabel(c.frequency)}
                  </span>
                </div>
                <p className="muted" style={{ marginTop: 6, marginBottom: 0 }}>
                  {c.completed ? t('app.challenges.completed') : t('app.challenges.pending')}
                </p>
                <div className="btnRow" style={{ marginTop: 10 }}>
                  <button
                    className={c.completed ? 'ghostBtn' : 'primaryBtn'}
                    type="button"
                    disabled={togglingId === c.id}
                    onClick={() => void toggle(c.id, !c.completed)}
                  >
                    {togglingId === c.id
                      ? t('common.loading')
                      : c.completed
                        ? t('app.challenges.undo')
                        : t('app.challenges.markDone')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

