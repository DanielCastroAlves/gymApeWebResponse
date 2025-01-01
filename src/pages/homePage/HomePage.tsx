import React from 'react';
import { useNavigate } from 'react-router-dom';
import Botao from '../../components/Botao';
import Menu from '../../components/Menu/Menu';
import logo from '../../assets/imagens/logoNovoSemBg.png';
import './HomePage.css';

interface HomePageProps {
  onLogout: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Lógica para finalizar a sessão do usuário
    onLogout();

    // Redireciona para a página de login
    navigate('/');
  };

  return (
    <div className="home-page-container">
      <div className="home-page-overlay"></div>
      <Menu logo={logo} />
      <main className="home-page-content">
        <h1>Bem-vindo ao Ape Gym!</h1>
        <p>Essa é uma página de teste da home. Explore seus treinos e acompanhe seu progresso!</p>
        <Botao title="Logoff" onClick={handleLogout} />
      </main>
    </div>
  );
};

export default HomePage;
