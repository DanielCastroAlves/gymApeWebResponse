import { useEffect, useMemo, useState } from 'react';
import './pages.css';
import { apiFetch } from '../../api/client';
import { useI18n } from '../../i18n/I18nProvider';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

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

const SETS_PRESETS = [2, 3, 4, 5, 6] as const;
const REPS_PRESETS = ['6', '8', '10', '12', '15', '8-12', '10-12', '12-15', 'até a falha'] as const;
const WEIGHT_PRESETS = ['barra', '2.5kg', '5kg', '7.5kg', '10kg', '12.5kg', '15kg', '20kg', '25kg', '30kg', '40kg', '50kg'] as const;
const REST_PRESETS = [30, 45, 60, 90, 120, 150, 180] as const;

export default function TreinosAdmin() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const templates = useMemo(() => workouts.filter((w) => w.is_template === 1 && !w.user_id), [workouts]);

  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [items, setItems] = useState<WorkoutItemDraft[]>([{ name: '' }]);
  const [creating, setCreating] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string>('');
  const [loadingTemplate, setLoadingTemplate] = useState(false);

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
    if (creating) return;
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
      setEditingTemplateId('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.workouts.createFailed'));
    } finally {
      setCreating(false);
    }
  };

  const handleLoadTemplate = async () => {
    if (!editingTemplateId) return;
    if (loadingTemplate) return;
    setLoadingTemplate(true);
    setError(null);
    try {
      const data = await apiFetch<{
        workout: { id: string; title: string; objective: string };
        items: Array<{ name: string; sets: number | null; reps: string | null; weight: string | null; rest_seconds: number | null; notes: string | null }>;
      }>(`/admin/workouts/${editingTemplateId}`);
      setTitle(data.workout.title);
      setObjective(data.workout.objective);
      setItems(
        data.items.length
          ? data.items.map((it) => ({
              name: it.name,
              sets: it.sets ?? undefined,
              reps: it.reps ?? undefined,
              weight: it.weight ?? undefined,
              rest_seconds: it.rest_seconds ?? undefined,
              notes: it.notes ?? undefined,
            }))
          : [{ name: '' }],
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.workouts.loadFailed'));
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedTemplateId || !selectedAlunoId) return;
    if (assigning) return;
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
        <div className="pageTitleRow">
          <button className="backIconBtn" type="button" onClick={() => navigate(-1)} aria-label={t('common.back')}>
            <FaArrowLeft />
          </button>
          <h1>{t('admin.workouts.title')}</h1>
        </div>
        <p>{t('admin.workouts.subtitle')}</p>
      </header>

      {error && (
        <section className="card" style={{ marginBottom: '1rem' }}>
          <p className="errorText">{error}</p>
        </section>
      )}

      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2>{t('admin.workouts.createTemplateTitle')}</h2>

        <div className="toolbar">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'end' }}>
            <label className="field" style={{ minWidth: 260 }}>
              <span>{t('admin.workouts.editExisting')}</span>
              <select value={editingTemplateId} onChange={(e) => setEditingTemplateId(e.target.value)}>
                <option value="">{t('admin.workouts.select')}</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.title} — {tpl.objective}
                  </option>
                ))}
              </select>
            </label>
            <button className="ghostBtn" type="button" onClick={() => void handleLoadTemplate()} disabled={!editingTemplateId || loadingTemplate}>
              {loadingTemplate ? t('common.loading') : t('admin.workouts.loadTemplate')}
            </button>
          </div>
          <button
            className="ghostBtn"
            type="button"
            onClick={() => {
              setEditingTemplateId('');
              setTitle('');
              setObjective('');
              setItems([{ name: '' }]);
            }}
          >
            {t('admin.workouts.newFromScratch')}
          </button>
        </div>

        <div className="formGrid2">
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
            <div key={idx} className="workoutItemGrid">
              <datalist id="sets-presets">
                {SETS_PRESETS.map((v) => (
                  <option key={v} value={String(v)} />
                ))}
              </datalist>
              <datalist id="reps-presets">
                {REPS_PRESETS.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <datalist id="weight-presets">
                {WEIGHT_PRESETS.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <datalist id="rest-presets">
                {REST_PRESETS.map((v) => (
                  <option key={v} value={String(v)} />
                ))}
              </datalist>

              <label className="field workoutItemExercise">
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
                  list="sets-presets"
                  value={it.sets ?? ''}
                  onChange={(e) => {
                    const next = [...items];
                    const v = e.target.value.trim();
                    const n = v ? Number(v) : NaN;
                    next[idx] = { ...next[idx], sets: !v ? undefined : Number.isFinite(n) ? n : next[idx].sets };
                    setItems(next);
                  }}
                  inputMode="numeric"
                  placeholder="4"
                />
              </label>
              <label className="field">
                <span>{t('admin.workouts.reps')}</span>
                <input
                  list="reps-presets"
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
                  list="weight-presets"
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
                  list="rest-presets"
                  value={it.rest_seconds ?? ''}
                  onChange={(e) => {
                    const next = [...items];
                    const v = e.target.value.trim();
                    const n = v ? Number(v) : NaN;
                    next[idx] = { ...next[idx], rest_seconds: !v ? undefined : Number.isFinite(n) ? n : next[idx].rest_seconds };
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
            <div className="formGrid2">
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

