import './pages.css';

export default function AdminHome() {
  return (
    <div className="page">
      <header className="pageHeader">
        <h1>Painel do Admin</h1>
        <p>Gerencie alunos, treinos, desafios e acompanhe relatórios.</p>
      </header>

      <section className="card">
        <h2>MVP sugerido</h2>
        <ul className="list">
          <li>Listagem de alunos + status</li>
          <li>Criar/atribuir treinos e desafios</li>
          <li>Ver completados, pontuação e ranking</li>
        </ul>
      </section>
    </div>
  );
}

