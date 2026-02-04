import './pages.css';

export default function Ranking() {
  return (
    <div className="page">
      <header className="pageHeader">
        <h1>Ranking</h1>
        <p>Ranking semanal e pontuação por desafios concluídos.</p>
      </header>

      <section className="card">
        <h2>Mock</h2>
        <ol className="list">
          <li>Você (0 pts)</li>
          <li>Aluno 2 (0 pts)</li>
          <li>Aluno 3 (0 pts)</li>
        </ol>
      </section>
    </div>
  );
}

