import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ color: '#fff', padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Página não encontrada</h1>
      <p>O link que você acessou não existe.</p>
      <Link style={{ color: '#ff5e00', fontWeight: 600 }} to="/app">
        Ir para o Dashboard
      </Link>
    </div>
  );
}

