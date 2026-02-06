import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../api/client';
import { useI18n } from '../../i18n/I18nProvider';
import './pages.css';
import { FaArrowLeft } from 'react-icons/fa';

type Workout = {
  id: string;
  title: string;
  objective: string;
};

type WorkoutItem = {
  id: string;
  name: string;
  sets: number | null;
  reps: string | null;
  weight: string | null;
  rest_seconds: number | null;
  notes: string | null;
};

export default function TreinoDetalhe() {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [items, setItems] = useState<WorkoutItem[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{ workout: Workout; items: WorkoutItem[] }>(`/app/workouts/${id}`);
        setWorkout(data.workout);
        setItems(data.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [id]);

  return (
    <div className="page">
      <header className="pageHeader">
        <div className="pageTitleRow">
          <button className="backIconBtn" type="button" onClick={() => navigate(-1)} aria-label={t('common.back')}>
            <FaArrowLeft />
          </button>
          <h1>{t('app.workouts.detailsTitle')}</h1>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          <Link className="cardLink" to="/app/treinos">
            {t('app.workouts.backToList')}
          </Link>
        </p>
      </header>

      {error && (
        <section className="card" style={{ marginBottom: '1rem' }}>
          <p className="errorText" style={{ margin: 0 }}>
            {error}
          </p>
        </section>
      )}

      <section className="card" style={{ marginBottom: '1rem' }}>
        {loading ? (
          <p className="muted" style={{ margin: 0 }}>
            {t('common.loading')}
          </p>
        ) : workout ? (
          <>
            <h2 style={{ marginTop: 0 }}>{workout.title}</h2>
            <p className="muted" style={{ margin: 0 }}>
              {workout.objective}
            </p>
          </>
        ) : null}
      </section>

      <section className="card">
        <h2>{t('app.workouts.itemsTitle')}</h2>
        {loading ? (
          <p className="muted" style={{ margin: 0 }}>
            {t('common.loading')}
          </p>
        ) : !items.length ? (
          <p className="muted" style={{ margin: 0 }}>
            {t('common.underConstruction')}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('admin.workouts.exercise')}</th>
                  <th>{t('admin.workouts.sets')}</th>
                  <th>{t('admin.workouts.reps')}</th>
                  <th>{t('admin.workouts.weight')}</th>
                  <th>{t('admin.workouts.restSeconds')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.name}</td>
                    <td>{it.sets ?? '-'}</td>
                    <td>{it.reps ?? '-'}</td>
                    <td>{it.weight ?? '-'}</td>
                    <td>{it.rest_seconds ?? '-'}</td>
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

