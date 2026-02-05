import { useEffect, useMemo, useState } from 'react';
import './pages.css';
import { apiFetch } from '../../api/client';
import { useI18n } from '../../i18n/I18nProvider';

type Aluno = { id: string; name: string; email: string };
type Workout = {
  id: string;
  title: string;
  objective: string;
  is_template: number;
  user_id: string | null;
  created_at: string;
};
type WorkoutItemDraft = {
  name: string;
  sets?: number;
  reps?: string;
  weight?: string;
  rest_seconds?: number;
  notes?: string;
};

export default function TreinosAdmin() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const templates = useMemo(() => workouts.filter((w) => w.is_template === 1 && !w.user_id), [workouts]);

  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [items, setItems] = useState<WorkoutItemDraft[]>([{ name: '' }]);
  const [creating, setCreating] = useState(false);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  const canCreateTemplate = useMemo(() => {
    const hasTitle = title.trim().length > 0;
    const hasObjective = objective.trim().length > 0;
    const hasAtLeastOneItem = items.some((it) => it.name.trim().length > 0);
    return hasTitle && hasObjective && hasAtLeastOneItem;
  }, [title, objective, items]);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const [a, w] = await Promise.all([
        apiFetch<{ alunos: Aluno[] }>('/admin/alunos'),
        apiFetch<{ workouts: Workout[] }>('/admin/workouts'),
      ]);
      setAlunos(a.alunos);
      setWorkouts(w.workouts);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.workouts.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreateTemplate = async () => {
    if (!canCreateTemplate) return;
    setCreating(true);
    setError(null);
    try {
      const cleanItems = items
        .filter((it) => it.name.trim())
        .map((it) => ({
          name: it.name.trim(),
          sets: it.sets,
          reps: it.reps?.trim() || undefined,
          weight: it.weight?.trim() || undefined,
          rest_seconds: it.rest_seconds,
          notes: it.notes?.trim() || undefined,
        }));

      await apiFetch('/admin/workouts', {
        method: 'POST',
        body: JSON.stringify({
          title,
          objective,
          is_template: true,
          items: cleanItems,
        }),
      });

      setTitle('');
      setObjective('');
      setItems([{ name: '' }]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.workouts.createFailed'));
    } finally {
      setCreating(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedTemplateId || !selectedAlunoId) return;
    setAssigning(true);
    setError(null);
    try {
      await apiFetch(`/admin/workouts/${selectedTemplateId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ user_id: selectedAlunoId }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.workouts.assignFailed'));
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="page">
      <header className="pageHeader">
        <h1>{t('admin.workouts.title')}</h1>
        <p>{t('admin.workouts.subtitle')}</p>
      </header>

      {error && (
        <section className="card" style={{ marginBottom: '1rem' }}>
          <p className="errorText">{error}</p>
        </section>
      )}

      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2>{t('admin.workouts.createTemplateTitle')}</h2>
        <div className="formGrid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <label className="field">
            <span>{t('admin.workouts.templateTitle')}</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('admin.workouts.templateTitlePlaceholder')}
            />
          </label>
          <label className="field">
            <span>{t('admin.workouts.objective')}</span>
            <input
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder={t('admin.workouts.objectivePlaceholder')}
            />
          </label>
        </div>

        <div className="card" style={{ background: 'rgba(0,0,0,0.25)', borderColor: 'rgba(255,255,255,0.12)' }}>
          <h3 style={{ marginTop: 0 }}>{t('admin.workouts.workoutItemsTitle')}</h3>
          {items.map((it, idx) => (
            <div
              key={idx}
              className="formGrid"
              style={{ gridTemplateColumns: '2fr 0.6fr 0.8fr 0.8fr 0.8fr', alignItems: 'end' }}
            >
              <label className="field">
                <span>{t('admin.workouts.exercise')}</span>
                <input
                  value={it.name}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...next[idx], name: e.target.value };
                    setItems(next);
                  }}
                  placeholder={t('admin.workouts.exercisePlaceholder')}
                />
              </label>
              <label className="field">
                <span>{t('admin.workouts.sets')}</span>
                <input
                  value={it.sets ?? ''}
                  onChange={(e) => {
                    const next = [...items];
                    const v = e.target.value.trim();
                    next[idx] = { ...next[idx], sets: v ? Number(v) : undefined };
                    setItems(next);
                  }}
                  inputMode="numeric"
                  placeholder="4"
                />
              </label>
              <label className="field">
                <span>{t('admin.workouts.reps')}</span>
                <input
                  value={it.reps ?? ''}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...next[idx], reps: e.target.value };
                    setItems(next);
                  }}
                  placeholder="8-12"
                />
              </label>
              <label className="field">
                <span>{t('admin.workouts.weight')}</span>
                <input
                  value={it.weight ?? ''}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...next[idx], weight: e.target.value };
                    setItems(next);
                  }}
                  placeholder="20kg"
                />
              </label>
              <label className="field">
                <span>{t('admin.workouts.restSeconds')}</span>
                <input
                  value={it.rest_seconds ?? ''}
                  onChange={(e) => {
                    const next = [...items];
                    const v = e.target.value.trim();
                    next[idx] = { ...next[idx], rest_seconds: v ? Number(v) : undefined };
                    setItems(next);
                  }}
                  inputMode="numeric"
                  placeholder="60"
                />
              </label>
            </div>
          ))}

          <div className="toolbar">
            <button
              className="primaryBtn"
              type="button"
              onClick={() => setItems((prev) => [...prev, { name: '' }])}
            >
              {t('admin.workouts.addItem')}
            </button>
            <button
              className="primaryBtn"
              type="button"
              onClick={() => setItems((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))}
              disabled={items.length <= 1}
            >
              {t('admin.workouts.removeLast')}
            </button>
          </div>
        </div>

        <button className="primaryBtn" onClick={handleCreateTemplate} disabled={!canCreateTemplate || creating}>
          {creating ? t('admin.workouts.saving') : t('admin.workouts.saveTemplate')}
        </button>
      </section>

      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2>{t('admin.workouts.assignSectionTitle')}</h2>
        {loading ? (
          <p>{t('common.loading')}</p>
        ) : (
          <>
            <div className="formGrid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <label className="field">
                <span>{t('admin.workouts.student')}</span>
                <select
                  value={selectedAlunoId}
                  onChange={(e) => setSelectedAlunoId(e.target.value)}
                  style={{ padding: '0.65rem 0.75rem', borderRadius: 10 }}
                >
                  <option value="">{t('admin.workouts.select')}</option>
                  {alunos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.email})
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{t('admin.workouts.template')}</span>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  style={{ padding: '0.65rem 0.75rem', borderRadius: 10 }}
                >
                  <option value="">{t('admin.workouts.select')}</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} — {t.objective}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button className="primaryBtn" onClick={handleAssign} disabled={!selectedAlunoId || !selectedTemplateId || assigning}>
              {assigning ? t('admin.workouts.assigning') : t('admin.workouts.assignWorkout')}
            </button>
          </>
        )}
      </section>

      <section className="card">
        <h2>{t('admin.workouts.registeredTemplates')}</h2>
        {loading ? (
          <p>{t('common.loading')}</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('admin.workouts.templateTitle')}</th>
                  <th>{t('admin.workouts.objective')}</th>
                  <th>{t('admin.students.createdAt')}</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id}>
                    <td>{t.title}</td>
                    <td>{t.objective}</td>
                    <td>{new Date(t.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {!templates.length && (
                  <tr>
                    <td colSpan={3}>{t('admin.workouts.empty')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

