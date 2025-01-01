import Menu from '../../components/Menu/Menu';
import logo from '../../assets/imagens/logoNovoSemBg.png';
import './styles.css';

export default function Treino() {
  return (
    <div className="page-container">
      <Menu logo={logo} />
      <div className="page-overlay"></div>
      <header className="page-header">
        <h1>Bem-vindo à página de Treino!</h1>
      </header>
      <main className="page-content">
        <p>Explore seus treinos aqui e acompanhe seu progresso físico.</p>
      </main>
      <div className="under-construction-message">
        <img src={logo} alt="Logo" className="under-construction-logo" />
        <p>Esta página está em construção!</p>
      </div>
    </div>
  );
}
