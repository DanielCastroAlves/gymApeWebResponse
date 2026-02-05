import Menu from '../../components/Menu/Menu';
import logo from '../../assets/imagens/logoNovoSemBg.png';
import './styles.css';
import { useI18n } from '../../i18n/I18nProvider';

export default function Treino() {
  const { t } = useI18n();
  return (
    <div className="page-container">
      <Menu logo={logo} />
      <div className="page-overlay"></div>
      <header className="page-header">
        <h1>{t('legacyPages.trainingPageWelcome')}</h1>
      </header>
      <main className="page-content">
        <p>{t('legacyPages.trainingPageSubtitle')}</p>
      </main>
      <div className="under-construction-message">
        <img src={logo} alt={t('menu.logoAlt')} className="under-construction-logo" />
        <p>{t('common.underConstruction')}</p>
      </div>
    </div>
  );
}
