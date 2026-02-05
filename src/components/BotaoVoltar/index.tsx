import React from 'react';
import './BotaoVoltar.css';
import { FaArrowLeft } from 'react-icons/fa'; // Importa o ícone de seta
import { useI18n } from '../../i18n/I18nProvider';

interface BotaoVoltarProps {
  onClick: () => void;
}

const BotaoVoltar: React.FC<BotaoVoltarProps> = ({ onClick }) => {
  const { t } = useI18n();
  return (
    <button className="botaoVoltar" onClick={onClick}>
      <FaArrowLeft className="icon" />
      {t('common.back')}
    </button>
  );
};

export default BotaoVoltar;
