import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TelaLogin from './pages/login';
import HomePage from './pages/homePage/HomePage';
import Progresso from './pages/progresso';
import Treino from './pages/treino';

const App: React.FC = () => {
  const handleLogout = () => {
    // Lógica para logout
    console.log('Usuário deslogado');
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<TelaLogin />} />
        <Route path="/home" element={<HomePage onLogout={handleLogout} />} />
        <Route path="/treino" element={<Treino />} />
        <Route path="/progresso" element={<Progresso />} />
      </Routes>
    </Router>
  );
};

export default App;
