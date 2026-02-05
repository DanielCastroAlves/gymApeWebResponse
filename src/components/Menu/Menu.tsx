import React, { useState } from 'react';
import './Menu.css';
import { FaBars, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';

interface MenuProps {
  logo: string;
  mode?: 'aluno' | 'admin';
  onLogout?: () => void;
}
const Menu: React.FC<MenuProps> = ({ logo, mode = 'aluno', onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useI18n();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="menu-header">
      <button className="menu-button" onClick={toggleMenu}>
        {menuOpen ? <FaTimes /> : <FaBars />}
      </button>
      <img src={logo} alt={t('menu.logoAlt')} className="menu-logo" />
      <div className="menu-right">
        <LanguageSwitcher />
      </div>
      <nav className={`side-menu ${menuOpen ? 'open' : ''}`}>
        <ul>
          {mode === 'aluno' ? (
            <>
              <li>
                <Link to="/app" onClick={closeMenu}>
                  {t('menu.dashboard')}
                </Link>
              </li>
              <li>
                <Link to="/app/treinos" onClick={closeMenu}>
                  {t('menu.workouts')}
                </Link>
              </li>
              <li>
                <Link to="/app/progresso" onClick={closeMenu}>
                  {t('menu.progress')}
                </Link>
              </li>
              <li>
                <Link to="/app/ranking" onClick={closeMenu}>
                  {t('menu.ranking')}
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/admin" onClick={closeMenu}>
                  {t('menu.overview')}
                </Link>
              </li>
              <li>
                <Link to="/admin/alunos" onClick={closeMenu}>
                  {t('menu.students')}
                </Link>
              </li>
              <li>
                <Link to="/admin/treinos" onClick={closeMenu}>
                  {t('menu.workouts')}
                </Link>
              </li>
              <li>
                <Link to="/admin/desafios" onClick={closeMenu}>
                  {t('menu.challenges')}
                </Link>
              </li>
              <li>
                <Link to="/admin/ranking" onClick={closeMenu}>
                  {t('menu.ranking')}
                </Link>
              </li>
            </>
          )}

          {onLogout && (
            <li>
              {/* Mantém o estilo do menu e executa ação */}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  closeMenu();
                  onLogout();
                }}
              >
                {t('menu.logout')}
              </a>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Menu;
