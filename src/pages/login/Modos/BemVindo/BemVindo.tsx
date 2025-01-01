import './BemVindo.css';
import BotaoVoltar from '../../../../components/BotaoVoltar';
import Botao from '../../../../components/Botao';
import Input from '../../../../components/Input';
import logo from '../../../../assets/imagens/logoNovoSemBg.png';

interface BemVindoProps {
  voltar: () => void;
}

export default function BemVindo({ voltar }: BemVindoProps) {
  return (
    <div className="bem-vindo-container">
      <BotaoVoltar onClick={voltar} />
      <img src={logo} alt="Logo" className="logo" />
      <h1 className="bem-vindo-titulo">Welcome Back!</h1>
      <Input label="Email" placeholder="Digite seu email" />
      <Input label="Password" placeholder="Digite sua senha" type="password" />
      <div className="bem-vindo-links">
        <a href="#" className="bem-vindo-link">Remember me</a>
        <a href="#" className="bem-vindo-link">Forgot my password</a>
      </div>
      <Botao title="Login" onClick={() => console.log('Login')} />
    </div>
  );
}
