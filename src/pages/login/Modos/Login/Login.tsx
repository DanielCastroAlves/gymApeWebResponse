import './Login.css';
import Botao from '../../../../components/Botao';
import logo from '../../../../assets/imagens/logoNovoSemBg.png';
import { useI18n } from '../../../../i18n/I18nProvider';

interface LoginProps {
  irParaBemVindo: () => void;
  irParaCriarConta: () => void;
}

export default function Login({ irParaBemVindo, irParaCriarConta }: LoginProps) {
  const { t } = useI18n();
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <img src={logo} alt={t('menu.logoAlt')} className="login-logo-image" />
          <h1 className="login-title">{t('common.appName')}</h1>
          <p className="login-subtitle">{t('common.training')}</p>
        </div>
        <Botao title={t('login.loginCta')} onClick={irParaBemVindo} />
        <p className="signup-text">
          {t('login.noAccount')}{' '}
          <a className="signup-link" onClick={irParaCriarConta}>
            {t('login.signUp')}
          </a>
        </p>
      </div>
    </div>
  );
}
