import { Outlet, useNavigate } from 'react-router-dom';
import Menu from '../components/Menu/Menu';
import logo from '../assets/imagens/logoNovoSemBg.png';
import { useAuth } from '../auth/AuthContext';
import './AppLayout.css';

export default function AppLayout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <div className="app-shell">
      <Menu
        logo={logo}
        onLogout={() => {
          signOut();
          navigate('/');
        }}
      />
      <div className="app-shell-overlay" />
      <main className="app-shell-content">
        <Outlet />
      </main>
    </div>
  );
}

