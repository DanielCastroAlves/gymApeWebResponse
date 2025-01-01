import './CriarConta.css';
import BotaoVoltar from '../../../../components/BotaoVoltar';
import Botao from '../../../../components/Botao';
import logo from '../../../../assets/imagens/logoNovoSemBg.png';

interface CriarContaProps {
  voltar: () => void;
}

export default function CriarConta({ voltar }: CriarContaProps) {
  return (
    <div className="criar-conta-container">
      <BotaoVoltar onClick={voltar} />
      <img src={logo} alt="Logo" className="logo" />
      <div className="botoes-sociais">
        <Botao title="Continue with Facebook" onClick={() => console.log('Facebook')} />
        <Botao title="Continue with Google" onClick={() => console.log('Google')} />
        <Botao title="Continue with Apple" onClick={() => console.log('Apple')} />
      </div>
      <p className="divider-text">or</p>
      <Botao title="Sign Up with Email" onClick={() => console.log('Sign Up')} />
      <p className="already-account">
        Already have an account? <a className="login-link" onClick={voltar}>Log in</a>
      </p>
    </div>
  );
}
