import React from 'react';
import { useNavigate } from 'react-router-dom';
import Botao from '../../components/Botao';
import Menu from '../../components/Menu/Menu';
import logo from '../../assets/imagens/logoNovoSemBg.png';
import './HomePage.css';
import { useI18n } from '../../i18n/I18nProvider';

interface HomePageProps {
  onLogout: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const { t } = useI18n();

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
        <h1>{t('home.welcome')}</h1>
        <p>{t('home.subtitle')}</p>
        <Botao title={t('home.logoff')} onClick={handleLogout} />
      </main>
    </div>
  );
};

export default HomePage;
