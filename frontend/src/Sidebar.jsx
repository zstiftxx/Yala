import { Link, useNavigate } from 'react-router-dom';
import { useUser } from './useUser';
import { useEsMovil } from './useEsMovil';
import { useTema } from './useTema';
import { LayoutGrid, Bell, BookOpen, MessageSquare, User, LogOut, Moon, Sun, AlertTriangle } from 'lucide-react';

// Fuente unica de la navegacion: el nav lateral y la tab bar movil leen de aqui,
// asi no se desincronizan cuando se agrega una ruta.
// `corto` es la etiqueta de la tab bar: a 375px cada tab mide ~63px y los
// nombres largos se cortan con puntos suspensivos.
const ITEMS_NAV = [
  { clave: 'dashboard', a: '/home', icono: LayoutGrid, texto: 'Dashboard', corto: 'Inicio' },
  { clave: 'mis-cursos', a: '/mis-cursos', icono: BookOpen, texto: 'Mis Cursos', corto: 'Cursos' },
  { clave: 'notificaciones', a: '/notificaciones', icono: Bell, texto: 'Notificaciones', corto: 'Avisos' },
  { clave: 'feedback', a: '/feedback', icono: MessageSquare, texto: 'Feedback', corto: 'Feedback' },
  { clave: 'reportar', a: '/reportar', icono: AlertTriangle, texto: 'Reportar', corto: 'Reportar' },
  { clave: 'perfil', a: '/perfil', icono: User, texto: 'Perfil', corto: 'Perfil' },
];

function NavLateral({ active, onLogout }) {
  return (
    <aside className="sidebar">
      <nav>
        <ul>
          {ITEMS_NAV.map(({ clave, a, icono: Icono, texto }) => (
            <li key={clave} className={active === clave ? 'active' : ''}>
              <Link to={a}><Icono size={18} /> {texto}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-bottom">
        <button className="logout" onClick={onLogout}><LogOut size={16} /> Cerrar sesión</button>
      </div>
    </aside>
  );
}

function TabBar({ active }) {
  return (
    <nav className="tabbar">
      {ITEMS_NAV.map(({ clave, a, icono: Icono, texto, corto }) => (
        <Link
          key={clave}
          to={a}
          className={`tabbar-item${active === clave ? ' active' : ''}`}
          aria-current={active === clave ? 'page' : undefined}
          aria-label={texto}
        >
          <Icono size={20} />
          <span>{corto}</span>
        </Link>
      ))}
    </nav>
  );
}

export default function Sidebar({ active, children, sinNav }) {
  const navigate = useNavigate();
  const esMovil = useEsMovil();
  const { user, nombre: nombreGuardado, cerrarSesion } = useUser();
  const nombre = nombreGuardado || user?.email || 'Estudiante';
  const inicial = (nombre || '?').charAt(0).toUpperCase();

  const { tema, alternarTema } = useTema();

  const manejarLogout = async () => {
    await cerrarSesion();
    navigate('/');
  };

  const conTabBar = esMovil && !sinNav;

  return (
    <div className="app-shell" data-theme={tema}>
      <header className="app-topbar">
        <Link to="/home" className="app-brand">Educateca</Link>
        <div className="app-topbar-actions">
          {!esMovil && (
            <button className="icon-btn" onClick={() => navigate('/notificaciones')} title="Notificaciones">
              <Bell size={18} />
            </button>
          )}
          <button className="icon-btn" onClick={alternarTema} title="Cambiar tema">
            {tema === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          {/* En movil el nav lateral no existe, asi que el logout vive aqui. */}
          {esMovil && (
            <button className="icon-btn" onClick={manejarLogout} title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          )}
          {!esMovil && <span className="app-username">{nombre}</span>}
          <div className="avatar">{inicial}</div>
        </div>
      </header>

      <div className="app-body">
        {!sinNav && !esMovil && <NavLateral active={active} onLogout={manejarLogout} />}
        <main className={`main-area${conTabBar ? ' con-tabbar' : ''}`}>{children}</main>
      </div>

      {conTabBar && <TabBar active={active} />}
    </div>
  );
}
