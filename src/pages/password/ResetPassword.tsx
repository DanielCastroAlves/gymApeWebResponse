import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Input from '../../components/Input';
import Botao from '../../components/Botao';
import BotaoVoltar from '../../components/BotaoVoltar';
import { useI18n } from '../../i18n/I18nProvider';

import './password.css';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ResetPassword() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const query = useQuery();

  const token = query.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!token.trim()) return false;
    if (password.trim().length < 6) return false;
    if (password2.trim().length < 6) return false;
    return password === password2;
  }, [token, password, password2]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const apiBase = import.meta.env.VITE_API_URL as string | undefined;
      if (!apiBase) throw new Error(t('auth.errors.backendNotConfigured'));
      const normalizedBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;

      const res = await fetch(`${normalizedBase}/auth/reset-password`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password, password_confirm: password2 }),
      });

      const text = await res.text();
      const json = text ? (JSON.parse(text) as any) : undefined;
      if (!res.ok) {
        throw new Error(json?.error?.message ?? t('passwordReset.resetFailed'));
      }

      setDone(true);
      setTimeout(() => navigate('/'), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('passwordReset.resetFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const passwordMismatch = password2.length > 0 && password !== password2;

  return (
    <div className="auth-page">
      <div className="auth-page-overlay" />
      <div className="auth-card">
        <BotaoVoltar onClick={() => navigate('/')} />
        <h1 className="auth-title">{t('passwordReset.resetTitle')}</h1>
        <p className="auth-subtitle">{t('passwordReset.resetSubtitle')}</p>

        {!token ? (
          <p className="auth-hint" style={{ color: '#ffd2bf' }}>
            {t('passwordReset.missingToken')}
          </p>
        ) : done ? (
          <p className="auth-hint">{t('passwordReset.resetSuccess')}</p>
        ) : (
          <>
            <Input
              label={t('passwordReset.newPassword')}
              placeholder={t('passwordReset.newPasswordPlaceholder')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label={t('passwordReset.confirmPassword')}
              placeholder={t('passwordReset.confirmPasswordPlaceholder')}
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              error={passwordMismatch ? t('passwordReset.passwordsDontMatch') : undefined}
            />
            <Botao
              title={submitting ? t('passwordReset.saving') : t('passwordReset.savePassword')}
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
            />
            {error && <p className="auth-hint" style={{ color: '#ffd2bf' }}>{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}

