import './Login.css';
import Botao from '../../../../components/Botao';
import logo from '../../../../assets/imagens/logoNovoSemBg.png';

interface LoginProps {
  irParaBemVindo: () => void;
  irParaCriarConta: () => void;
}

export default function Login({ irParaBemVindo, irParaCriarConta }: LoginProps) {
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <img src={logo} alt="Logo" className="login-logo-image" />
          <h1 className="login-title">Ape Gym</h1>
          <p className="login-subtitle">Training</p>
        </div>
        <Botao title="Log in" onClick={irParaBemVindo} />
        <p className="signup-text">
          Don't have an account?{' '}
          <a className="signup-link" onClick={irParaCriarConta}>
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
