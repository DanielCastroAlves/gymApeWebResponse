import { useEffect, useMemo, useState } from 'react';
import './pages.css';
import { apiFetch } from '../../api/client';

type Aluno = { id: string; name: string; email: string; created_at: string };

export default function Alunos() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const canCreate = useMemo(() => name.trim() && email.trim() && password.trim().length >= 6, [name, email, password]);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{ alunos: Aluno[] }>('/admin/alunos');
      setAlunos(data.alunos);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar alunos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreating(true);
    setError(null);
    try {
      await apiFetch('/admin/alunos', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      setName('');
      setEmail('');
      setPassword('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao criar aluno.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page">
      <header className="pageHeader">
        <h1>Alunos</h1>
        <p>Cadastre alunos e acompanhe os treinos atribuídos.</p>
      </header>

      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2>Cadastrar aluno</h2>
        <div className="formGrid">
          <label className="field">
            <span>Nome</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: João" />
          </label>
          <label className="field">
            <span>E-mail</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joao@email.com" />
          </label>
          <label className="field">
            <span>Senha (mín. 6)</span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="******" />
          </label>
        </div>
        <button className="primaryBtn" onClick={handleCreate} disabled={!canCreate || creating}>
          {creating ? 'Criando...' : 'Criar aluno'}
        </button>
        {error && <p className="errorText">{error}</p>}
        <p className="hintText">
          Dica: para usar este painel, rode o backend e defina <code>VITE_API_URL</code> no front.
        </p>
      </section>

      <section className="card">
        <h2>Lista de alunos</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Criado em</th>
                </tr>
              </thead>
              <tbody>
                {alunos.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.email}</td>
                    <td>{new Date(a.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {!alunos.length && (
                  <tr>
                    <td colSpan={3}>Nenhum aluno cadastrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

