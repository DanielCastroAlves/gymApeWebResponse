import './pages.css';
import { useI18n } from '../../i18n/I18nProvider';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

export default function RankingAdmin() {
  const { t } = useI18n();
  const navigate = useNavigate();
  return (
    <div className="page">
      <header className="pageHeader">
        <div className="pageTitleRow">
          <button className="backIconBtn" type="button" onClick={() => navigate(-1)} aria-label={t('common.back')}>
            <FaArrowLeft />
          </button>
          <h1>{t('admin.ranking.title')}</h1>
        </div>
        <p>{t('admin.ranking.subtitle')}</p>
      </header>

      <section className="card">
        <h2>{t('admin.ranking.buildingTitle')}</h2>
        <p>{t('admin.ranking.buildingSubtitle')}</p>
      </section>
    </div>
  );
}

