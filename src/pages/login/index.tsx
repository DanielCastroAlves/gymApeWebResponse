import { useState } from 'react';
import './TelaLogin.css';
import Login from './Modos/Login/Login';
import BemVindo from './Modos/BemVindo/BemVindo';
import CriarConta from './Modos/CriarConta/CriarConta';

export default function TelaLogin() {
  const [modo, setModo] = useState<'login' | 'bemVindo' | 'criarConta'>('login');

  return (
    <div className="tela-login-container">
      {modo === 'login' && (
        <Login
          irParaBemVindo={() => setModo('bemVindo')}
          irParaCriarConta={() => setModo('criarConta')}
        />
      )}
      {modo === 'bemVindo' && <BemVindo voltar={() => setModo('login')} />}
      {modo === 'criarConta' && <CriarConta voltar={() => setModo('login')} />}
    </div>
  );
}
