import { useEffect, useMemo, useState } from 'react';
import './pages.css';
import { apiFetch } from '../../api/client';
import { useI18n } from '../../i18n/I18nProvider';

type Aluno = { id: string; name: string; email: string; created_at: string };

export default function Alunos() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const canCreate = useMemo(() => name.trim() && email.trim() && password.trim().length >= 6, [name, email, password]);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{ alunos: Aluno[] }>('/admin/alunos');
      setAlunos(data.alunos);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.students.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreating(true);
    setError(null);
    try {
      await apiFetch('/admin/alunos', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      setName('');
      setEmail('');
      setPassword('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.students.createFailed'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page">
      <header className="pageHeader">
        <h1>{t('admin.students.title')}</h1>
        <p>{t('admin.students.subtitle')}</p>
      </header>

      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2>{t('admin.students.registerTitle')}</h2>
        <div className="formGrid">
          <label className="field">
            <span>{t('admin.students.name')}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('admin.students.namePlaceholder')} />
          </label>
          <label className="field">
            <span>{t('admin.students.email')}</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('admin.students.emailPlaceholder')} />
          </label>
          <label className="field">
            <span>{t('admin.students.password')}</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder={t('admin.students.passwordPlaceholder')}
            />
          </label>
        </div>
        <button className="primaryBtn" onClick={handleCreate} disabled={!canCreate || creating}>
          {creating ? t('admin.students.creating') : t('admin.students.createStudent')}
        </button>
        {error && <p className="errorText">{error}</p>}
        <p className="hintText">
          {t('admin.students.tip')} <code>VITE_API_URL</code> {t('admin.students.tipSuffix')}
        </p>
      </section>

      <section className="card">
        <h2>{t('admin.students.listTitle')}</h2>
        {loading ? (
          <p>{t('common.loading')}</p>
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
                {alunos.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.email}</td>
                    <td>{new Date(a.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {!alunos.length && (
                  <tr>
                    <td colSpan={3}>{t('admin.students.empty')}</td>
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

