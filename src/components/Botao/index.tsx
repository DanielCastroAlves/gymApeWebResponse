import React from 'react';
import './Botao.css';

interface BotaoProps {
  title: string; // Texto do botão
  onClick: () => void; // Função chamada ao clicar no botão
  style?: React.CSSProperties; // Estilo customizado opcional
  disabled?: boolean; // Desabilitar o botão
  icon?: React.ReactNode; // Ícone opcional
}

const Botao: React.FC<BotaoProps> = ({ title, onClick, style, disabled, icon }) => {
  return (
    <button
      className={`botao ${disabled ? 'botaoDesabilitado' : ''}`}
      style={style}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="conteudoBotao">
        {icon && <span className="icone">{icon}</span>}
        {title}
      </div>
    </button>
  );
};

export default Botao;
