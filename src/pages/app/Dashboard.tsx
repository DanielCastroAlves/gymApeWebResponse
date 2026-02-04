import { Link } from 'react-router-dom';
import './pages.css';

export default function Dashboard() {
  return (
    <div className="page">
      <header className="pageHeader">
        <h1>Dashboard</h1>
        <p>Seu resumo da semana: treinos, desafios, pontos e ranking.</p>
      </header>

      <section className="grid">
        <div className="card">
          <h2>Treino da semana</h2>
          <p>Escolha um treino e marque o que foi concluído.</p>
          <Link className="cardLink" to="/app/treinos">
            Ver treinos
          </Link>
        </div>

        <div className="card">
          <h2>Desafios</h2>
          <p>Checklist diário/semanal (MVP). Cada item rende pontos.</p>
          <span className="hint">Próximo passo: buscar isso do backend.</span>
        </div>

        <div className="card">
          <h2>Pontos</h2>
          <p>Você ainda não tem pontos (mock).</p>
          <span className="hint">Depois: recompensas e trocas.</span>
        </div>

        <div className="card">
          <h2>Ranking</h2>
          <p>Compare sua evolução com outros alunos.</p>
          <Link className="cardLink" to="/app/ranking">
            Ver ranking
          </Link>
        </div>
      </section>
    </div>
  );
}

