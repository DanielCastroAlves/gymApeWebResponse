import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../pages.css';
import { apiFetch } from '../../../api/client';
import { useI18n } from '../../../i18n/I18nProvider';
import Modal from '../../../components/Modal/Modal';
import { FaArrowLeft } from 'react-icons/fa';

type UserRole = 'aluno' | 'professor' | 'admin';

export default function UserCreate() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [modal, setModal] = useState<{
    open: boolean;
    title: string;
    message?: string;
    actions?: Array<{ label: string; onClick: () => void; variant?: 'primary' | 'ghost' }>;
  }>({ open: false, title: '' });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('aluno');
  const [password, setPassword] = useState('');

  // optional profile fields
  const [phone, setPhone] = useState('');
  const [birthdate, setBirthdate] = useState(''); // YYYY-MM-DD
  const [avatarUrl, setAvatarUrl] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createLock, setCreateLock] = useState(false);

  const canCreate = useMemo(() => name.trim() && email.trim() && password.trim().length >= 6, [name, email, password]);

  const handleCreate = async () => {
    if (!canCreate) return;
    if (createLock || creating) return;
    setCreateLock(true);
    setCreating(true);
    setError(null);

    try {
      const data = await apiFetch<{ user: { id: string } }>('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          role,
          password,
          phone: phone.trim() || undefined,
          birthdate: birthdate.trim() || undefined,
          avatar_url: avatarUrl.trim() || undefined,
          address_line1: address1.trim() || undefined,
          address_line2: address2.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          zip: zip.trim() || undefined,
          country: country.trim() || undefined,
        }),
      });

      setModal({
        open: true,
        title: t('admin.users.createdTitle'),
        message: t('admin.users.createdMessage'),
        actions: [
          {
            label: t('admin.users.goToDetails'),
            variant: 'primary',
            onClick: () => {
              setModal({ open: false, title: '' });
              navigate(`/admin/usuarios/${data.user.id}`);
            },
          },
          { label: t('common.close'), variant: 'ghost', onClick: () => setModal({ open: false, title: '' }) },
        ],
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('admin.users.createFailed');
      setError(msg);
      setModal({
        open: true,
        title: t('admin.users.createFailed'),
        message: msg,
        actions: [{ label: t('common.ok'), variant: 'primary', onClick: () => setModal({ open: false, title: '' }) }],
      });
    } finally {
      setCreating(false);
      setCreateLock(false);
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
          <h1>{t('admin.users.newUser')}</h1>
        </div>
        <p>
          <Link to="/admin/usuarios" style={{ color: '#ff5e00', fontWeight: 700, textDecoration: 'none' }}>
            {t('admin.users.backToList')}
          </Link>
        </p>
      </header>

      <section className="card">
        <h2>{t('admin.users.registerTitle')}</h2>

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
            <span>{t('admin.users.role')}</span>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} style={{ padding: '0.65rem 0.75rem', borderRadius: 10 }}>
              <option value="aluno">{t('auth.roles.student')}</option>
              <option value="professor">{t('auth.roles.teacher')}</option>
              <option value="admin">{t('auth.roles.admin')}</option>
            </select>
          </label>
          <label className="field">
            <span>{t('admin.students.password')}</span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder={t('admin.students.passwordPlaceholder')} />
          </label>
        </div>

        <h2 style={{ marginTop: '0.75rem' }}>{t('admin.users.profileSection')}</h2>
        <div className="formGrid">
          <label className="field">
            <span>{t('admin.users.avatarUrl')}</span>
            <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder={t('admin.users.avatarUrlPlaceholder')} />
          </label>
          <label className="field">
            <span>{t('admin.users.phone')}</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('admin.users.phonePlaceholder')} />
          </label>
          <label className="field">
            <span>{t('admin.users.birthdate')}</span>
            <input value={birthdate} onChange={(e) => setBirthdate(e.target.value)} placeholder="YYYY-MM-DD" />
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

        <button className="primaryBtn" onClick={handleCreate} disabled={!canCreate || creating}>
          {creating ? t('admin.users.creating') : t('admin.users.create')}
        </button>
        {error && <p className="errorText">{error}</p>}
      </section>
    </div>
  );
}

