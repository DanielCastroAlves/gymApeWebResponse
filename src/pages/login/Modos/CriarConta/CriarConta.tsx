import './CriarConta.css';
import BotaoVoltar from '../../../../components/BotaoVoltar';
import Botao from '../../../../components/Botao';
import logo from '../../../../assets/imagens/logoNovoSemBg.png';
import { FaFacebook, FaGoogle, FaApple } from 'react-icons/fa';
import { useI18n } from '../../../../i18n/I18nProvider';

interface CriarContaProps {
  voltar: () => void;
}

export default function CriarConta({ voltar }: CriarContaProps) {
  const { t } = useI18n();
  return (
    <div className="criar-conta-container">
      <div className="criar-conta-overlay"></div>
      <div className="criar-conta-content">
        <BotaoVoltar onClick={voltar} />
        <img src={logo} alt={t('menu.logoAlt')} className="logo" />
        <div className="botoes-sociais">
          <Botao title={t('login.continueWithFacebook')} icon={<FaFacebook />} onClick={() => console.log('Facebook')} />
          <Botao title={t('login.continueWithGoogle')} icon={<FaGoogle />} onClick={() => console.log('Google')} />
          <Botao title={t('login.continueWithApple')} icon={<FaApple />} onClick={() => console.log('Apple')} />
        </div>
        <p className="divider-text">{t('common.or')}</p>
        <Botao title={t('login.signUpWithEmail')} onClick={() => console.log('Sign Up')} />
        <p className="already-account">
          {t('login.alreadyHaveAccount')}{' '}
          <a className="login-link" onClick={voltar}>
            {t('login.loginCta')}
          </a>
        </p>
      </div>
    </div>
  );
}
