import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import TelaLogin from './pages/login';

import RequireAuth from './auth/RequireAuth';
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/app/Dashboard';
import Treinos from './pages/app/Treinos';
import Progresso from './pages/app/Progresso';
import Ranking from './pages/app/Ranking';
import NotFound from './pages/NotFound';
import AdminHome from './pages/admin/AdminHome';
import Alunos from './pages/admin/Alunos';
import TreinosAdmin from './pages/admin/Treinos';
import Desafios from './pages/admin/Desafios';
import RankingAdmin from './pages/admin/Ranking';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TelaLogin />} />

        <Route element={<RequireAuth />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="treinos" element={<Treinos />} />
            <Route path="progresso" element={<Progresso />} />
            <Route path="ranking" element={<Ranking />} />
          </Route>
        </Route>

        <Route element={<RequireAuth role="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminHome />} />
            <Route path="alunos" element={<Alunos />} />
            <Route path="treinos" element={<TreinosAdmin />} />
            <Route path="desafios" element={<Desafios />} />
            <Route path="ranking" element={<RankingAdmin />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
