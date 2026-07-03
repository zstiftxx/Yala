import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { LayoutGrid, Bell, BookOpen, MessageSquare, User, LogOut, Moon, Sun } from 'lucide-react';

export default function Sidebar({ active, children, sinNav }) {
  const navigate = useNavigate();
  const usuarioGuardado = JSON.parse(localStorage.getItem('user') || 'null');
  const nombre = usuarioGuardado?.user_metadata?.nombre || usuarioGuardado?.email || 'Estudiante';
  const inicial = (nombre || '?').charAt(0).toUpperCase();

  const [tema, setTema] = useState(localStorage.getItem('tema') || 'light');

  const alternarTema = () => {
    const nuevo = tema === 'light' ? 'dark' : 'light';
    setTema(nuevo);
    localStorage.setItem('tema', nuevo);
  };

  const manejarLogout = async () => {
    try { await supabase.auth.signOut(); } catch (e) {}
    localStorage.removeItem('user');
    navigate('/');
  };

  const linkStyle = { color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' };

  return (
    <div className="app-shell" data-theme={tema}>
      <header className="app-topbar">
        <Link to="/home" className="app-brand" style={{ textDecoration: 'none' }}>Educateca</Link>
        <div className="app-topbar-actions">
          <button className="icon-btn" title="Notificaciones">
            <Bell size={18} />
          </button>
          <button className="icon-btn" onClick={alternarTema} title="Cambiar tema">
            {tema === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <span className="app-username">{nombre}</span>
          <div className="avatar">{inicial}</div>
        </div>
      </header>

      <div className="app-body">
        {!sinNav && (
          <aside className="sidebar">
            <nav>
              <ul>
                <li className={active === 'dashboard' ? 'active' : ''}>
                  <Link to="/home" style={linkStyle}><LayoutGrid size={18} /> Dashboard</Link>
                </li>
                <li><Bell size={18} /> Notificaciones</li>
                <li className={active === 'mis-cursos' ? 'active' : ''}>
                  <Link to="/mis-cursos" style={linkStyle}><BookOpen size={18} /> Mis Cursos</Link>
                </li>
                <li><MessageSquare size={18} /> Feedback</li>
                <li className={active === 'perfil' ? 'active' : ''}>
                  <Link to="/perfil" style={linkStyle}><User size={18} /> Perfil</Link>
                </li>
              </ul>
            </nav>
            <div className="sidebar-bottom">
              <button className="logout" onClick={manejarLogout}><LogOut size={16} /> Cerrar sesión</button>
            </div>
          </aside>
        )}

        <main className="main-area">{children}</main>
      </div>
    </div>
  );
}
