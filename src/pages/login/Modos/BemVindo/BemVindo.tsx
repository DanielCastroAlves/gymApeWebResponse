import './BemVindo.css';
import BotaoVoltar from '../../../../components/BotaoVoltar';
import Botao from '../../../../components/Botao';
import Input from '../../../../components/Input';
import logo from '../../../../assets/imagens/logoNovoSemBg.png';
import { FaFacebook, FaGoogle, FaApple } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'; // Importa o hook de navegação
import { useState } from 'react';
import { useAuth } from '../../../../auth/AuthContext';
import { useI18n } from '../../../../i18n/I18nProvider';

interface BemVindoProps {
  voltar: () => void;
}

export default function BemVindo({ voltar }: BemVindoProps) {
  const navigate = useNavigate(); // Inicializa o hook de navegação
  const { signIn } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    setError(undefined);
    setSubmitting(true);
    try {
      const user = await signIn({ email, password });
      navigate(user.role === 'admin' ? '/admin' : '/app', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : t('auth.errors.unableToSignIn'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bem-vindo-container">
      <div className="bem-vindo-overlay"></div>
      <div className="bem-vindo-content">
        <BotaoVoltar onClick={voltar} />
        <img src={logo} alt={t('menu.logoAlt')} className="logo" />
        <h1 className="bem-vindo-titulo">{t('login.welcomeBack')}</h1>
        <div className="input-group">
          <Input
            label={t('login.email')}
            placeholder={t('login.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />
          <Input
            label={t('login.password')}
            placeholder={t('login.passwordPlaceholder')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="bem-vindo-links">
          <a href="#" className="bem-vindo-link">
            {t('login.rememberMe')}
          </a>
          <a href="#" className="bem-vindo-link">
            {t('login.forgotPassword')}
          </a>
        </div>
        <Botao title={submitting ? t('login.entering') : t('login.login')} onClick={handleLogin} disabled={submitting} />
        <p className="or-divider">{t('common.or')}</p>
        <div className="social-media">
          <FaFacebook className="social-media-icon facebook" />
          <FaGoogle className="social-media-icon google" />
          <FaApple className="social-media-icon apple" />
        </div>
      </div>
    </div>
  );
}
