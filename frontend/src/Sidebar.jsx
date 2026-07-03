import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function Sidebar({ active }) {
  const navigate = useNavigate();

  const manejarLogout = async () => {
    try { await supabase.auth.signOut(); } catch (e) {}
    localStorage.removeItem('user');
    navigate('/');
  };

  const linkStyle = { color: 'inherit', textDecoration: 'none', display: 'block' };

  return (
    <aside className="sidebar">
      <div className="brand">Educateca</div>
      <nav>
        <ul>
          <li className={active === 'dashboard' ? 'active' : ''}>
            <Link to="/home" style={linkStyle}>Dashboard</Link>
          </li>
          <li>Notificaciones</li>
          <li>Mis Cursos</li>
          <li>Feedback</li>
          <li className={active === 'perfil' ? 'active' : ''}>
            <Link to="/perfil" style={linkStyle}>Perfil</Link>
          </li>
        </ul>
      </nav>
      <div className="sidebar-bottom">
        <button className="logout" onClick={manejarLogout}>Cerrar sesión</button>
      </div>
    </aside>
  );
}
