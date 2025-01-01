import React from 'react';
import './BotaoVoltar.css';

interface BotaoVoltarProps {
  onClick: () => void;
}

const BotaoVoltar: React.FC<BotaoVoltarProps> = ({ onClick }) => {
  return (
    <button className="botaoVoltar" onClick={onClick}>
      ← Voltar
    </button>
  );
};

export default BotaoVoltar;
