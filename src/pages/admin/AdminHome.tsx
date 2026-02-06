import './pages.css';
import { useI18n } from '../../i18n/I18nProvider';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api/client';

export default function AdminHome() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Array<{ id: string; name: string; email: string; created_at: string }>>([]);
  const [workouts, setWorkouts] = useState<Array<{ id: string; is_template: number; user_id: string | null }>>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [u, w] = await Promise.all([
          apiFetch<{ users: Array<{ id: string; name: string; email: string; role: 'aluno' | 'professor' | 'admin'; created_at: string }> }>('/admin/users'),
          apiFetch<{ workouts: Array<{ id: string; is_template: number; user_id: string | null }> }>('/admin/workouts'),
        ]);
        setStudents(u.users.filter((x) => x.role === 'aluno'));
        setWorkouts(w.workouts);
      } catch (e) {
        setError(e instanceof Error ? e.message : t('admin.home.unableToLoad'));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [t]);

  const stats = useMemo(() => {
    const studentsCount = students.length;
    const templatesCount = workouts.filter((w) => w.is_template === 1 && !w.user_id).length;
    const assignedCount = workouts.filter((w) => w.is_template === 0 && w.user_id).length;
    return { studentsCount, templatesCount, assignedCount };
  }, [students.length, workouts]);

  const recentStudents = useMemo(() => students.slice(0, 5), [students]);

  return (
    <div className="page">
      <header className="pageHeader">
        <h1>{t('admin.home.title')}</h1>
        <p>{t('admin.home.subtitle')}</p>
      </header>

      {error && (
        <section className="card" style={{ marginBottom: '1rem' }}>
          <p className="errorText" style={{ margin: 0 }}>
            {error}
          </p>
        </section>
      )}

      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2>{t('admin.home.stats')}</h2>
        {loading ? (
          <p className="muted" style={{ margin: 0 }}>
            {t('common.loading')}
          </p>
        ) : (
          <div className="grid3">
            <div className="card" style={{ background: 'rgba(0,0,0,0.22)' }}>
              <div className="statValue">{stats.studentsCount}</div>
              <div className="statLabel">{t('admin.home.statsStudents')}</div>
              <Link className="cardLink" to="/admin/usuarios">
                {t('admin.home.viewAll')}
              </Link>
            </div>
            <div className="card" style={{ background: 'rgba(0,0,0,0.22)' }}>
              <div className="statValue">{stats.templatesCount}</div>
              <div className="statLabel">{t('admin.home.statsTemplates')}</div>
              <Link className="cardLink" to="/admin/treinos">
                {t('admin.home.viewAll')}
              </Link>
            </div>
            <div className="card" style={{ background: 'rgba(0,0,0,0.22)' }}>
              <div className="statValue">{stats.assignedCount}</div>
              <div className="statLabel">{t('admin.home.statsAssignedWorkouts')}</div>
              <Link className="cardLink" to="/admin/treinos">
                {t('admin.home.viewAll')}
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2>{t('admin.home.quickActions')}</h2>
        <div className="grid">
          <div className="card" style={{ background: 'rgba(0,0,0,0.22)' }}>
            <h2>{t('admin.home.manageStudentsTitle')}</h2>
            <p className="muted" style={{ margin: 0 }}>
              {t('admin.home.manageStudentsDesc')}
            </p>
            <Link className="cardLink" to="/admin/usuarios">
              {t('admin.home.viewAll')}
            </Link>
          </div>
          <div className="card" style={{ background: 'rgba(0,0,0,0.22)' }}>
            <h2>{t('admin.home.manageWorkoutsTitle')}</h2>
            <p className="muted" style={{ margin: 0 }}>
              {t('admin.home.manageWorkoutsDesc')}
            </p>
            <Link className="cardLink" to="/admin/treinos">
              {t('admin.home.viewAll')}
            </Link>
          </div>
          <div className="card" style={{ background: 'rgba(0,0,0,0.22)' }}>
            <h2>{t('admin.home.manageChallengesTitle')}</h2>
            <p className="muted" style={{ margin: 0 }}>
              {t('admin.home.manageChallengesDesc')}
            </p>
            <Link className="cardLink" to="/admin/desafios">
              {t('admin.home.viewAll')}
            </Link>
          </div>
          <div className="card" style={{ background: 'rgba(0,0,0,0.22)' }}>
            <h2>{t('admin.home.viewRankingTitle')}</h2>
            <p className="muted" style={{ margin: 0 }}>
              {t('admin.home.viewRankingDesc')}
            </p>
            <Link className="cardLink" to="/admin/ranking">
              {t('admin.home.viewAll')}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid" style={{ marginBottom: '1rem' }}>
        <section className="card">
          <h2>{t('admin.home.suggestedMvp')}</h2>
          <ul className="list">
            <li>{t('admin.home.item1')}</li>
            <li>{t('admin.home.item2')}</li>
            <li>{t('admin.home.item3')}</li>
          </ul>
        </section>

        <section className="card">
          <h2>{t('admin.home.recentStudents')}</h2>
          {loading ? (
            <p className="muted" style={{ margin: 0 }}>
              {t('common.loading')}
            </p>
          ) : !recentStudents.length ? (
            <p className="muted" style={{ margin: 0 }}>
              {t('admin.students.empty')}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('admin.students.name')}</th>
                    <th>{t('admin.students.email')}</th>
                    <th>{t('admin.students.createdAt')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentStudents.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.email}</td>
                      <td>{new Date(s.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Link className="cardLink" to="/admin/usuarios">
            {t('admin.home.viewAll')}
          </Link>
        </section>
      </section>
    </div>
  );
}

