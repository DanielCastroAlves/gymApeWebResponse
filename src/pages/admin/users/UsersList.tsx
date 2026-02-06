import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../pages.css';
import { apiFetch } from '../../../api/client';
import { useI18n } from '../../../i18n/I18nProvider';
import Modal from '../../../components/Modal/Modal';
import { FaArrowLeft } from 'react-icons/fa';

type UserRole = 'aluno' | 'professor' | 'admin';
type UserRow = { id: string; name: string; email: string; role: UserRole; created_at: string };

export default function UsersList() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [modal, setModal] = useState<{
    open: boolean;
    title: string;
    message?: string;
    actions?: Array<{ label: string; onClick: () => void; variant?: 'primary' | 'ghost' }>;
  }>({ open: false, title: '' });

  const [adminActionMsg, setAdminActionMsg] = useState<string | null>(null);
  const [sendingResetFor, setSendingResetFor] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{ users: UserRow[] }>('/admin/users');
      setUsers(data.users);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('admin.users.loadFailed');
      setError(msg);
      setModal({
        open: true,
        title: t('admin.users.loadFailed'),
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

  const handleCopyEmail = async (emailValue: string) => {
    setAdminActionMsg(null);
    try {
      await navigator.clipboard.writeText(emailValue);
      setAdminActionMsg(t('admin.admins.copied'));
    } catch {
      window.prompt(t('admin.admins.copyEmail'), emailValue);
    }
  };

  const handleSendReset = async (userId: string) => {
    setAdminActionMsg(null);
    if (sendingResetFor) return;
    setSendingResetFor(userId);
    try {
      await apiFetch(`/admin/users/${userId}/password-reset`, { method: 'POST' });
      setAdminActionMsg(t('admin.admins.resetSent'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.admins.resetFailed'));
    } finally {
      setSendingResetFor(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter;
      const matchesQuery = !q ? true : u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      return matchesRole && matchesQuery;
    });
  }, [users, roleFilter, search]);

  return (
    <div className="page">
      <Modal open={modal.open} title={modal.title} message={modal.message} actions={modal.actions} onClose={() => setModal({ open: false, title: '' })} />

      <header className="pageHeader">
        <div className="pageTitleRow">
          <button className="backIconBtn" type="button" onClick={() => navigate(-1)} aria-label={t('common.back')}>
            <FaArrowLeft />
          </button>
          <h1>{t('admin.users.title')}</h1>
        </div>
        <p>{t('admin.users.subtitle')}</p>
      </header>

      <section className="card" style={{ marginBottom: '1rem' }}>
        <div className="toolbar">
          <h2 style={{ margin: 0 }}>{t('admin.users.listTitle')}</h2>
          <Link className="primaryBtn" to="/admin/usuarios/novo" style={{ textDecoration: 'none', display: 'inline-block' }}>
            {t('admin.users.newUser')}
          </Link>
        </div>

        <div className="formGrid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 240px)' }}>
          <label className="field">
            <span>{t('admin.users.searchLabel')}</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.users.searchPlaceholder')} />
          </label>
          <label className="field">
            <span>{t('admin.users.roleFilterLabel')}</span>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as any)} style={{ padding: '0.65rem 0.75rem', borderRadius: 10 }}>
              <option value="all">{t('admin.users.allRoles')}</option>
              <option value="aluno">{t('auth.roles.student')}</option>
              <option value="professor">{t('auth.roles.teacher')}</option>
              <option value="admin">{t('auth.roles.admin')}</option>
            </select>
          </label>
        </div>

        {adminActionMsg && (
          <p className="hintText" style={{ marginTop: 0 }}>
            {adminActionMsg}
          </p>
        )}

        {loading ? (
          <p>{t('common.loading')}</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('admin.students.name')}</th>
                  <th>{t('admin.students.email')}</th>
                  <th>{t('admin.users.role')}</th>
                  <th>{t('admin.students.createdAt')}</th>
                  <th>{t('admin.admins.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role === 'admin' ? t('auth.roles.admin') : u.role === 'professor' ? t('auth.roles.teacher') : t('auth.roles.student')}</td>
                    <td>{new Date(u.created_at).toLocaleString()}</td>
                    <td>
                      <span className="actionRow">
                        <button className="ghostBtn" type="button" onClick={() => navigate(`/admin/usuarios/${u.id}`)}>
                          {t('admin.users.details')}
                        </button>
                        <button className="ghostBtn" type="button" onClick={() => void handleCopyEmail(u.email)}>
                          {t('admin.admins.copyEmail')}
                        </button>
                        <button className="primaryBtn" type="button" onClick={() => void handleSendReset(u.id)} disabled={sendingResetFor === u.id}>
                          {t('admin.admins.sendReset')}
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
                {!filteredUsers.length && (
                  <tr>
                    <td colSpan={5}>{t('admin.users.empty')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {error && <p className="errorText">{error}</p>}
      </section>
    </div>
  );
}

