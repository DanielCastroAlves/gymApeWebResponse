import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import '../pages.css';
import { apiFetch } from '../../../api/client';
import { useI18n } from '../../../i18n/I18nProvider';
import Modal from '../../../components/Modal/Modal';
import { FaArrowLeft } from 'react-icons/fa';

type UserRole = 'aluno' | 'professor' | 'admin';
type UserDetails = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  birthdate: string | null;
  avatar_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  created_at: string;
};

function calcAge(birthdate: string): number {
  const [y, m, d] = birthdate.split('-').map((v) => Number(v));
  if (!y || !m || !d) return 0;
  const now = new Date();
  let age = now.getFullYear() - y;
  const beforeBirthday = now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

export default function UserDetailsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<{
    open: boolean;
    title: string;
    message?: string;
    actions?: Array<{ label: string; onClick: () => void; variant?: 'primary' | 'ghost' }>;
  }>({ open: false, title: '' });

  const [user, setUser] = useState<UserDetails | null>(null);

  // editable fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('aluno');
  const [phone, setPhone] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');

  const [sendingReset, setSendingReset] = useState(false);

  const ageText = useMemo(() => {
    if (!birthdate?.trim()) return null;
    const age = calcAge(birthdate.trim());
    if (!age) return null;
    return String(age);
  }, [birthdate]);

  const load = async () => {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{ user: UserDetails }>(`/admin/users/${id}`);
      setUser(data.user);
      setName(data.user.name ?? '');
      setEmail(data.user.email ?? '');
      setRole(data.user.role);
      setPhone(data.user.phone ?? '');
      setBirthdate(data.user.birthdate ?? '');
      setAvatarUrl(data.user.avatar_url ?? '');
      setAddress1(data.user.address_line1 ?? '');
      setAddress2(data.user.address_line2 ?? '');
      setCity(data.user.city ?? '');
      setState(data.user.state ?? '');
      setZip(data.user.zip ?? '');
      setCountry(data.user.country ?? '');
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
          {
            label: t('admin.users.backToList'),
            variant: 'ghost',
            onClick: () => {
              setModal({ open: false, title: '' });
              navigate('/admin/usuarios');
            },
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    if (saving) return;
    setError(null);
    setSaving(true);
    try {
      const data = await apiFetch<{ user: UserDetails }>(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role,
          phone: phone.trim() ? phone.trim() : null,
          birthdate: birthdate.trim() ? birthdate.trim() : null,
          avatar_url: avatarUrl.trim() ? avatarUrl.trim() : null,
          address_line1: address1.trim() ? address1.trim() : null,
          address_line2: address2.trim() ? address2.trim() : null,
          city: city.trim() ? city.trim() : null,
          state: state.trim() ? state.trim() : null,
          zip: zip.trim() ? zip.trim() : null,
          country: country.trim() ? country.trim() : null,
        }),
      });
      setUser(data.user);
      setModal({
        open: true,
        title: t('admin.users.savedTitle'),
        message: t('admin.users.savedMessage'),
        actions: [{ label: t('common.ok'), variant: 'primary', onClick: () => setModal({ open: false, title: '' }) }],
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('admin.users.saveFailed');
      setError(msg);
      setModal({
        open: true,
        title: t('admin.users.saveFailed'),
        message: msg,
        actions: [{ label: t('common.ok'), variant: 'primary', onClick: () => setModal({ open: false, title: '' }) }],
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendReset = async () => {
    if (!id) return;
    if (sendingReset) return;
    setSendingReset(true);
    setError(null);
    try {
      await apiFetch(`/admin/users/${id}/password-reset`, { method: 'POST' });
      setModal({
        open: true,
        title: t('admin.admins.resetSent'),
        message: t('admin.users.resetHint'),
        actions: [{ label: t('common.ok'), variant: 'primary', onClick: () => setModal({ open: false, title: '' }) }],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.admins.resetFailed'));
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="page">
      <Modal open={modal.open} title={modal.title} message={modal.message} actions={modal.actions} onClose={() => setModal({ open: false, title: '' })} />

      <header className="pageHeader">
        <div className="pageTitleRow">
          <button className="backIconBtn" type="button" onClick={() => navigate(-1)} aria-label={t('common.back')}>
            <FaArrowLeft />
          </button>
          <h1>{t('admin.users.detailsTitle')}</h1>
        </div>
        <p>
          <Link to="/admin/usuarios" style={{ color: '#ff5e00', fontWeight: 700, textDecoration: 'none' }}>
            {t('admin.users.backToList')}
          </Link>
        </p>
      </header>

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : !user ? (
        <p className="errorText">{error ?? t('admin.users.loadFailed')}</p>
      ) : (
        <>
          <section className="card" style={{ marginBottom: '1rem' }}>
            <div className="toolbar">
              <h2 style={{ margin: 0 }}>
                {user.name} <span className="muted">({user.email})</span>
              </h2>
              <span className="actionRow">
                <button className="ghostBtn" type="button" onClick={() => void handleSendReset()} disabled={sendingReset}>
                  {t('admin.admins.sendReset')}
                </button>
                <button className="primaryBtn" type="button" onClick={() => void handleSave()} disabled={saving}>
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </span>
            </div>

            {error && <p className="errorText">{error}</p>}

            <div className="grid" style={{ alignItems: 'start' }}>
              <div className="card" style={{ margin: 0 }}>
                <h2>{t('admin.users.profilePreview')}</h2>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 18,
                      border: '1px solid rgba(255,255,255,0.18)',
                      background: 'rgba(0,0,0,0.35)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                    }}
                    title={t('admin.users.avatar')}
                  >
                    {avatarUrl?.trim() ? (
                      <img src={avatarUrl.trim()} alt={t('admin.users.avatar')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span>{user.name?.trim()?.[0]?.toUpperCase() ?? '?'}</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800 }}>{user.name}</div>
                    <div className="muted">{user.role === 'admin' ? t('auth.roles.admin') : user.role === 'professor' ? t('auth.roles.teacher') : t('auth.roles.student')}</div>
                    <div className="hintText" style={{ marginTop: 6 }}>
                      {t('admin.users.createdAtLabel')}: {new Date(user.created_at).toLocaleString()}
                      {ageText ? (
                        <>
                          {' '}
                          • {t('admin.users.age')}: {ageText}
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ margin: 0 }}>
                <h2>{t('admin.users.editSection')}</h2>
                <div className="formGrid">
                  <label className="field">
                    <span>{t('admin.students.name')}</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} />
                  </label>
                  <label className="field">
                    <span>{t('admin.students.email')}</span>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} />
                  </label>
                  <label className="field">
                    <span>{t('admin.users.role')}</span>
                    <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} style={{ padding: '0.65rem 0.75rem', borderRadius: 10 }}>
                      <option value="aluno">{t('auth.roles.student')}</option>
                      <option value="professor">{t('auth.roles.teacher')}</option>
                      <option value="admin">{t('auth.roles.admin')}</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>{t('admin.users.phone')}</span>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('admin.users.phonePlaceholder')} />
                  </label>
                  <label className="field">
                    <span>{t('admin.users.birthdate')}</span>
                    <input value={birthdate} onChange={(e) => setBirthdate(e.target.value)} placeholder="YYYY-MM-DD" />
                  </label>
                  <label className="field">
                    <span>{t('admin.users.avatarUrl')}</span>
                    <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder={t('admin.users.avatarUrlPlaceholder')} />
                  </label>
                </div>

                <h2 style={{ marginTop: '0.75rem' }}>{t('admin.users.addressSection')}</h2>
                <div className="formGrid">
                  <label className="field">
                    <span>{t('admin.users.address1')}</span>
                    <input value={address1} onChange={(e) => setAddress1(e.target.value)} placeholder={t('admin.users.address1Placeholder')} />
                  </label>
                  <label className="field">
                    <span>{t('admin.users.address2')}</span>
                    <input value={address2} onChange={(e) => setAddress2(e.target.value)} placeholder={t('admin.users.address2Placeholder')} />
                  </label>
                  <label className="field">
                    <span>{t('admin.users.city')}</span>
                    <input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t('admin.users.cityPlaceholder')} />
                  </label>
                  <label className="field">
                    <span>{t('admin.users.state')}</span>
                    <input value={state} onChange={(e) => setState(e.target.value)} placeholder={t('admin.users.statePlaceholder')} />
                  </label>
                  <label className="field">
                    <span>{t('admin.users.zip')}</span>
                    <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder={t('admin.users.zipPlaceholder')} />
                  </label>
                  <label className="field">
                    <span>{t('admin.users.country')}</span>
                    <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder={t('admin.users.countryPlaceholder')} />
                  </label>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

