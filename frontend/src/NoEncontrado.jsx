import { Link } from 'react-router-dom';
import { Compass, Moon, Sun } from 'lucide-react';
import { useTema } from './useTema';

// Pagina 404. No usa el shell (Sidebar) porque puede caer aqui alguien sin
// sesion: reutiliza los tokens de .auth-page, que son los mismos del shell.
export default function NoEncontrado() {
  const { tema, alternarTema } = useTema();
  const hayUsuario = !!localStorage.getItem('user');

  return (
    <div className="auth-page">
      <button className="auth-theme-toggle" onClick={alternarTema} aria-label="Cambiar tema">
        {tema === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div className="auth-card centrado">
        <div className="auth-brand">
          <Compass size={28} />
          <span>404</span>
        </div>
        <h2 className="auth-title">Esta página no existe</h2>
        <p className="auth-subtitle">El enlace puede estar roto o la página se movió.</p>
        <Link className="auth-btn primary" to={hayUsuario ? '/home' : '/'}>
          {hayUsuario ? 'Ir al Dashboard' : 'Ir al inicio'}
        </Link>
      </div>
    </div>
  );
}
