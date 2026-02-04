import React, { useState } from 'react';
import './Menu.css';
import { FaBars, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface MenuProps {
  logo: string;
  mode?: 'aluno' | 'admin';
  onLogout?: () => void;
}
const Menu: React.FC<MenuProps> = ({ logo, mode = 'aluno', onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="menu-header">
      <button className="menu-button" onClick={toggleMenu}>
        {menuOpen ? <FaTimes /> : <FaBars />}
      </button>
      <img src={logo} alt="Logo" className="menu-logo" />
      <nav className={`side-menu ${menuOpen ? 'open' : ''}`}>
        <ul>
          {mode === 'aluno' ? (
            <>
              <li>
                <Link to="/app" onClick={closeMenu}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/app/treinos" onClick={closeMenu}>
                  Treinos
                </Link>
              </li>
              <li>
                <Link to="/app/progresso" onClick={closeMenu}>
                  Progresso
                </Link>
              </li>
              <li>
                <Link to="/app/ranking" onClick={closeMenu}>
                  Ranking
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/admin" onClick={closeMenu}>
                  Visão geral
                </Link>
              </li>
              <li>
                <Link to="/admin/alunos" onClick={closeMenu}>
                  Alunos
                </Link>
              </li>
              <li>
                <Link to="/admin/treinos" onClick={closeMenu}>
                  Treinos
                </Link>
              </li>
              <li>
                <Link to="/admin/desafios" onClick={closeMenu}>
                  Desafios
                </Link>
              </li>
              <li>
                <Link to="/admin/ranking" onClick={closeMenu}>
                  Ranking
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
                Sair
              </a>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Menu;
