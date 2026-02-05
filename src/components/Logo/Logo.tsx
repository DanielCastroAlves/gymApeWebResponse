import React from 'react';
import './Logo.css';
import logoImage from '../../assets/imagens/logoNovoSemBg.png';
import { useI18n } from '../../i18n/I18nProvider';

const Logo: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="logoContainer">
      <img src={logoImage} alt={t('menu.logoAlt')} className="logoImage" />
      <h1 className="logoTitle">{t('common.appName')}</h1>
      <p className="logoSubtitle">{t('common.training')}</p>
    </div>
  );
};

export default Logo;
