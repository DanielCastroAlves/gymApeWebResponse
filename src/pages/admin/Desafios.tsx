import { useEffect, useMemo, useState } from 'react';
import './pages.css';
import { useI18n } from '../../i18n/I18nProvider';
import { apiFetch } from '../../api/client';
import Modal from '../../components/Modal/Modal';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

type Frequency = 'daily' | 'weekly';
type Aluno = { id: string; name: string; email: string };
type ChallengeRow = {
  id: string;
  title: string;
  points: number;
  frequency: Frequency;
  active_from: string | null;
  active_to: string | null;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  created_by: string;
  created_at: string;
};

function toIsoFromDatetimeLocal(v: string) {
  if (!v?.trim()) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export default function Desafios() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createLock, setCreateLock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [challenges, setChallenges] = useState<ChallengeRow[]>([]);

  const [title, setTitle] = useState('');
  const [points, setPoints] = useState<number>(10);
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [scope, setScope] = useState<'all' | 'one'>('all');
  const [userId, setUserId] = useState<string>('');
  const [activeFrom, setActiveFrom] = useState<string>('');
  const [activeTo, setActiveTo] = useState<string>('');

  const [modal, setModal] = useState<{
    open: boolean;
    title: string;
    message?: string;
    actions?: Array<{ label: string; onClick: () => void; variant?: 'primary' | 'ghost' }>;
  }>({ open: false, title: '' });

  const canCreate = useMemo(() => title.trim().length > 0 && points >= 0 && (scope === 'all' || !!userId), [title, points, scope, userId]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, c] = await Promise.all([
        apiFetch<{ alunos: Aluno[] }>('/admin/alunos'),
        apiFetch<{ challenges: ChallengeRow[] }>('/admin/challenges'),
      ]);
      setAlunos(a.alunos);
      setChallenges(c.challenges);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('admin.challenges.loadFailed');
      setError(msg);
      setModal({
        open: true,
        title: t('admin.challenges.loadFailed'),
        message: msg,
        actions: [
          {
            label: t('common.retry'),
            variant: 'primary',
            onClick: () => {
              setModal({ open: false, title: '' });
              void load();
            },
          },
          { label: t('common.close'), variant: 'ghost', onClick: () => setModal({ open: false, title: '' }) },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async () => {
    if (!canCreate) return;
    if (createLock || creating) return;
    setCreateLock(true);
    setCreating(true);
    setError(null);
    try {
      await apiFetch('/admin/challenges', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          points,
          frequency,
          user_id: scope === 'one' ? userId : null,
          active_from: toIsoFromDatetimeLocal(activeFrom),
          active_to: toIsoFromDatetimeLocal(activeTo),
        }),
      });
      setTitle('');
      setPoints(10);
      setFrequency('daily');
      setScope('all');
      setUserId('');
      setActiveFrom('');
      setActiveTo('');
      await load();
      setModal({
        open: true,
        title: t('admin.challenges.createdTitle'),
        message: t('admin.challenges.createdMessage'),
        actions: [{ label: t('common.ok'), variant: 'primary', onClick: () => setModal({ open: false, title: '' }) }],
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('admin.challenges.createFailed');
      setError(msg);
      setModal({
        open: true,
        title: t('admin.challenges.createFailed'),
        message: msg,
        actions: [{ label: t('common.ok'), variant: 'primary', onClick: () => setModal({ open: false, title: '' }) }],
      });
    } finally {
      setCreating(false);
      setCreateLock(false);
    }
  };

  const freqLabel = (f: Frequency) => (f === 'daily' ? t('admin.challenges.frequencyDaily') : t('admin.challenges.frequencyWeekly'));

  return (
    <div className="page">
      <Modal open={modal.open} title={modal.title} message={modal.message} actions={modal.actions} onClose={() => setModal({ open: false, title: '' })} />

      <header className="pageHeader">
        <div className="pageTitleRow">
          <button className="backIconBtn" type="button" onClick={() => navigate(-1)} aria-label={t('common.back')}>
            <FaArrowLeft />
          </button>
          <h1>{t('admin.challenges.title')}</h1>
        </div>
        <p>{t('admin.challenges.subtitle')}</p>
      </header>

      {error && (
        <section className="card" style={{ marginBottom: '1rem' }}>
          <p className="errorText" style={{ margin: 0 }}>
            {error}
          </p>
        </section>
      )}

      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2>{t('admin.challenges.createTitle')}</h2>
        <div className="formGrid">
          <label className="field">
            <span>{t('admin.challenges.challengeTitle')}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('admin.challenges.challengeTitlePlaceholder')} />
          </label>
          <label className="field">
            <span>{t('admin.challenges.points')}</span>
            <input
              value={String(points)}
              onChange={(e) => setPoints(Math.max(0, Number(e.target.value || '0')))}
              inputMode="numeric"
              placeholder="10"
            />
          </label>
          <label className="field">
            <span>{t('admin.challenges.frequency')}</span>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
              <option value="daily">{t('admin.challenges.frequencyDaily')}</option>
              <option value="weekly">{t('admin.challenges.frequencyWeekly')}</option>
            </select>
          </label>
          <label className="field">
            <span>{t('admin.challenges.scope')}</span>
            <select value={scope} onChange={(e) => setScope(e.target.value as any)}>
              <option value="all">{t('admin.challenges.scopeAll')}</option>
              <option value="one">{t('admin.challenges.scopeOne')}</option>
            </select>
          </label>
          {scope === 'one' && (
            <label className="field">
              <span>{t('admin.challenges.student')}</span>
              <select value={userId} onChange={(e) => setUserId(e.target.value)}>
                <option value="">{t('admin.workouts.select')}</option>
                {alunos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.email})
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="field">
            <span>{t('admin.challenges.activeFrom')}</span>
            <input value={activeFrom} onChange={(e) => setActiveFrom(e.target.value)} type="datetime-local" />
          </label>
          <label className="field">
            <span>{t('admin.challenges.activeTo')}</span>
            <input value={activeTo} onChange={(e) => setActiveTo(e.target.value)} type="datetime-local" />
          </label>
        </div>

        <button className="primaryBtn" type="button" onClick={() => void handleCreate()} disabled={!canCreate || creating}>
          {creating ? t('admin.challenges.creating') : t('admin.challenges.create')}
        </button>
        <p className="hintText">
          {t('admin.challenges.hint')}
        </p>
      </section>

      <section className="card">
        <div className="toolbar">
          <h2 style={{ margin: 0 }}>{t('admin.challenges.listTitle')}</h2>
          <button className="ghostBtn" type="button" onClick={() => void load()} disabled={loading}>
            {loading ? t('common.loading') : t('common.retry')}
          </button>
        </div>

        {loading ? (
          <p>{t('common.loading')}</p>
        ) : !challenges.length ? (
          <p className="muted" style={{ margin: 0 }}>
            {t('admin.challenges.empty')}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('admin.challenges.challengeTitle')}</th>
                  <th>{t('admin.challenges.points')}</th>
                  <th>{t('admin.challenges.frequency')}</th>
                  <th>{t('admin.challenges.scope')}</th>
                  <th>{t('admin.challenges.active')}</th>
                </tr>
              </thead>
              <tbody>
                {challenges.map((c) => (
                  <tr key={c.id}>
                    <td>{c.title}</td>
                    <td>{c.points}</td>
                    <td>{freqLabel(c.frequency)}</td>
                    <td>{c.user_id ? `${c.user_name ?? ''}`.trim() || (c.user_email ?? c.user_id) : t('admin.challenges.scopeAll')}</td>
                    <td>
                      {(c.active_from || c.active_to)
                        ? `${c.active_from ? new Date(c.active_from).toLocaleString() : '—'} → ${c.active_to ? new Date(c.active_to).toLocaleString() : '—'}`
                        : '—'}
                    </td>
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

