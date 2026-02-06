import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TelaLogin from './pages/login';

import RequireAuth from './auth/RequireAuth';
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/app/Dashboard';
import Treinos from './pages/app/Treinos';
import Progresso from './pages/app/Progresso';
import Ranking from './pages/app/Ranking';
import DesafiosAluno from './pages/app/Desafios';
import Pontos from './pages/app/Pontos';
import NotFound from './pages/NotFound';
import AdminHome from './pages/admin/AdminHome';
import UsersList from './pages/admin/users/UsersList';
import UserCreate from './pages/admin/users/UserCreate';
import UserDetails from './pages/admin/users/UserDetails';
import TreinosAdmin from './pages/admin/Treinos';
import Desafios from './pages/admin/Desafios';
import RankingAdmin from './pages/admin/Ranking';
import ForgotPassword from './pages/password/ForgotPassword';
import ResetPassword from './pages/password/ResetPassword';
import TreinoDetalhe from './pages/app/TreinoDetalhe';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TelaLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<RequireAuth />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="treinos" element={<Treinos />} />
            <Route path="treinos/:id" element={<TreinoDetalhe />} />
            <Route path="progresso" element={<Progresso />} />
            <Route path="desafios" element={<DesafiosAluno />} />
            <Route path="pontos" element={<Pontos />} />
            <Route path="ranking" element={<Ranking />} />
          </Route>
        </Route>

        <Route element={<RequireAuth roles={['admin', 'professor']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminHome />} />
            <Route path="alunos" element={<Navigate to="/admin/usuarios" replace />} />
            <Route path="usuarios" element={<UsersList />} />
            <Route path="usuarios/novo" element={<UserCreate />} />
            <Route path="usuarios/:id" element={<UserDetails />} />
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
