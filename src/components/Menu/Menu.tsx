import React, { useState } from 'react';
import './Menu.css';
import { FaBars, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface MenuProps {
  logo: string;
}
const Menu: React.FC<MenuProps> = ({ logo }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="menu-header">
      <button className="menu-button" onClick={toggleMenu}>
        {menuOpen ? <FaTimes /> : <FaBars />}
      </button>
      <img src={logo} alt="Logo" className="menu-logo" />
      <nav className={`side-menu ${menuOpen ? 'open' : ''}`}>
        <ul>
          <li>
            <Link to="/home">Início</Link>
          </li>
          <li>
            <Link to="/treino">Treinos</Link>
          </li>
          <li>
            <Link to="/progresso">Progresso</Link>
          </li>
        
        </ul>
      </nav>
    </header>
  );
};

export default Menu;
