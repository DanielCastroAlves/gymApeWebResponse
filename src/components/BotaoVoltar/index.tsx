import React from 'react';
import './BotaoVoltar.css';
import { FaArrowLeft } from 'react-icons/fa'; // Importa o ícone de seta

interface BotaoVoltarProps {
  onClick: () => void;
}

const BotaoVoltar: React.FC<BotaoVoltarProps> = ({ onClick }) => {
  return (
    <button className="botaoVoltar" onClick={onClick}>
      <FaArrowLeft className="icon" />
      Voltar
    </button>
  );
};

export default BotaoVoltar;
