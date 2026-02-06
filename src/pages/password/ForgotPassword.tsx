import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../components/Input';
import Botao from '../../components/Botao';
import BotaoVoltar from '../../components/BotaoVoltar';
import { useI18n } from '../../i18n/I18nProvider';

import './password.css';

export default function ForgotPassword() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => email.trim().length > 3 && email.includes('@'), [email]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const apiBase = import.meta.env.VITE_API_URL as string | undefined;
      if (!apiBase) throw new Error(t('auth.errors.backendNotConfigured'));
      const normalizedBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;

      const res = await fetch(`${normalizedBase}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Mesmo se der erro, não expõe se email existe; mas precisamos lidar com falha de rede.
      if (!res.ok) {
        const text = await res.text();
        let message = t('passwordReset.requestFailed');
        try {
          const json = text ? (JSON.parse(text) as any) : undefined;
          message = json?.error?.message ?? message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('passwordReset.requestFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page-overlay" />
      <div className="auth-card">
        <BotaoVoltar onClick={() => navigate('/')} />
        <h1 className="auth-title">{t('passwordReset.forgotTitle')}</h1>
        <p className="auth-subtitle">{t('passwordReset.forgotSubtitle')}</p>

        {done ? (
          <p className="auth-hint">{t('passwordReset.emailSentHint')}</p>
        ) : (
          <>
            <Input
              label={t('passwordReset.emailLabel')}
              placeholder={t('passwordReset.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Botao
              title={submitting ? t('passwordReset.sending') : t('passwordReset.sendLink')}
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

