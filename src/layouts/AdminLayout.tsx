import { Outlet, useNavigate } from 'react-router-dom';
import Menu from '../components/Menu/Menu';
import logo from '../assets/imagens/logoNovoSemBg.png';
import { useAuth } from '../auth/AuthContext';
import './AdminLayout.css';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <div className="admin-shell">
      <Menu
        logo={logo}
        mode="admin"
        onLogout={() => {
          signOut();
          navigate('/');
        }}
      />
      <div className="admin-shell-overlay" />
      <main className="admin-shell-content">
        <Outlet />
      </main>
    </div>
  );
}

