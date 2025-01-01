import React from 'react';
import './Logo.css';
import logoImage from '../../assets/imagens/logoNovoSemBg.png';

const Logo: React.FC = () => {
  return (
    <div className="logoContainer">
      <img src={logoImage} alt="Logo Ape Gym" className="logoImage" />
      <h1 className="logoTitle">Ape Gym</h1>
      <p className="logoSubtitle">Training</p>
    </div>
  );
};

export default Logo;
