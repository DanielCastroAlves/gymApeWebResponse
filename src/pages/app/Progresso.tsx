import './pages.css';
import { useI18n } from '../../i18n/I18nProvider';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

export default function Progresso() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const STORAGE_KEY = 'apegym.progress.sessions';

  type Session = { day: string; minutes: number };

  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Session[]) : [];
    } catch {
      return [];
    }
  });

  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [minutes, setMinutes] = useState<string>('');

  const [workoutsCount, setWorkoutsCount] = useState<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // ignore
    }
  }, [sessions]);

  useEffect(() => {
    const run = async () => {
      try {
        const data = await apiFetch<{ workouts: Array<{ id: string }> }>('/app/workouts');
        setWorkoutsCount(data.workouts.length);
      } catch {
        setWorkoutsCount(null);
      }
    };
    void run();
  }, []);

  const last7Days = useMemo(() => {
    const days: string[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }, []);

  const minutesByDay = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((s) => {
      map.set(s.day, (map.get(s.day) ?? 0) + s.minutes);
    });
    return map;
  }, [sessions]);

  const last7 = useMemo(() => last7Days.map((d) => ({ day: d, minutes: minutesByDay.get(d) ?? 0 })), [last7Days, minutesByDay]);

  const weekMinutes = useMemo(() => last7.reduce((sum, s) => sum + s.minutes, 0), [last7]);
  const weekDays = useMemo(() => last7.filter((s) => s.minutes > 0).length, [last7]);

  const streak = useMemo(() => {
    // streak = dias consecutivos (a partir de hoje) com treino registrado
    let count = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const m = minutesByDay.get(key) ?? 0;
      if (m > 0) count += 1;
      else break;
    }
    return count;
  }, [minutesByDay]);

  const maxBar = useMemo(() => Math.max(1, ...last7.map((s) => s.minutes)), [last7]);

  const canAdd = useMemo(() => {
    const m = Number(minutes);
    return Boolean(day) && Number.isFinite(m) && m > 0;
  }, [day, minutes]);

  const handleAdd = () => {
    const m = Number(minutes);
    if (!day || !Number.isFinite(m) || m <= 0) return;
    setSessions((prev) => [...prev, { day, minutes: Math.round(m) }]);
    setMinutes('');
  };

  const handleClear = () => {
    if (!confirm(t('app.progress.clearConfirm'))) return;
    setSessions([]);
  };

  return (
    <div className="page">
      <header className="pageHeader">
        <div className="pageTitleRow">
          <button className="backIconBtn" type="button" onClick={() => navigate(-1)} aria-label={t('common.back')}>
            <FaArrowLeft />
          </button>
          <h1>{t('app.progress.title')}</h1>
        </div>
        <p>{t('app.progress.subtitle')}</p>
      </header>

      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2>{t('app.progress.weekSummary')}</h2>
        <div className="grid3">
          <div className="card" style={{ background: 'rgba(0,0,0,0.22)' }}>
            <div className="statValue">{weekMinutes}</div>
            <div className="statLabel">{t('app.progress.weekMinutes')}</div>
          </div>
          <div className="card" style={{ background: 'rgba(0,0,0,0.22)' }}>
            <div className="statValue">{weekDays}</div>
            <div className="statLabel">{t('app.progress.weekDays')}</div>
          </div>
          <div className="card" style={{ background: 'rgba(0,0,0,0.22)' }}>
            <div className="statValue">{streak}</div>
            <div className="statLabel">{t('app.progress.streak')}</div>
            <div className="muted">{t('app.progress.streakDays', { days: streak })}</div>
          </div>
        </div>
      </section>

      <section className="grid" style={{ marginBottom: '1rem' }}>
        <section className="card">
          <h2>{t('app.progress.last7Days')}</h2>
          <div className="progressBars">
            {last7.map((s) => {
              const height = Math.max(8, Math.round((s.minutes / maxBar) * 120));
              const label = s.day.slice(8, 10);
              return (
                <div key={s.day}>
                  <div className={`progressBar ${s.minutes ? '' : 'progressBarMuted'}`} style={{ height }} title={`${s.minutes} min`} />
                  <div className="progressBarLabel">{label}</div>
                </div>
              );
            })}
          </div>
          <p className="muted" style={{ margin: '0.75rem 0 0' }}>
            {t('app.progress.backendWorkouts')}: <b>{workoutsCount ?? '—'}</b> <span className="muted">({t('app.progress.backendWorkoutsHint')})</span>
          </p>
        </section>

        <section className="card">
          <h2>{t('app.progress.logWorkout')}</h2>
          <div className="row">
            <label className="fieldInline">
              <span>{t('app.progress.date')}</span>
              <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
            </label>
            <label className="fieldInline">
              <span>{t('app.progress.minutes')}</span>
              <input
                inputMode="numeric"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder={t('app.progress.minutesPlaceholder')}
              />
            </label>
            <div className="btnRow">
              <button className="primaryBtn" type="button" onClick={handleAdd} disabled={!canAdd}>
                {t('app.progress.add')}
              </button>
              <button className="ghostBtn" type="button" onClick={handleClear} disabled={!sessions.length}>
                {t('app.progress.clear')}
              </button>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

