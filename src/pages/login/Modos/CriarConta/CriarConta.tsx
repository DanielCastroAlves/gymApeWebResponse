import './CriarConta.css';
import BotaoVoltar from '../../../../components/BotaoVoltar';
import Botao from '../../../../components/Botao';
import logo from '../../../../assets/imagens/logoNovoSemBg.png';
import { FaFacebook, FaGoogle, FaApple } from 'react-icons/fa';

interface CriarContaProps {
  voltar: () => void;
}

export default function CriarConta({ voltar }: CriarContaProps) {
  return (
    <div className="criar-conta-container">
      <div className="criar-conta-overlay"></div>
      <div className="criar-conta-content">
        <BotaoVoltar onClick={voltar} />
        <img src={logo} alt="Logo" className="logo" />
        <div className="botoes-sociais">
          <Botao title="Continue with Facebook" icon={<FaFacebook />} onClick={() => console.log('Facebook')} />
          <Botao title="Continue with Google" icon={<FaGoogle />} onClick={() => console.log('Google')} />
          <Botao title="Continue with Apple" icon={<FaApple />} onClick={() => console.log('Apple')} />
        </div>
        <p className="divider-text">or</p>
        <Botao title="Sign Up with Email" onClick={() => console.log('Sign Up')} />
        <p className="already-account">
          Already have an account? <a className="login-link" onClick={voltar}>Log in</a>
        </p>
      </div>
    </div>
  );
}
