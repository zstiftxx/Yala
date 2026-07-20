import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Moon, Sun } from 'lucide-react';

// Pagina 404. No usa el shell (Sidebar) porque puede caer aqui alguien sin
// sesion: reutiliza los tokens de .auth-page, que son los mismos del shell.
export default function NoEncontrado() {
  const [tema, setTema] = useState(localStorage.getItem('tema') || 'light');

  const alternarTema = () => {
    const nuevo = tema === 'light' ? 'dark' : 'light';
    setTema(nuevo);
    localStorage.setItem('tema', nuevo);
  };

  const hayUsuario = !!localStorage.getItem('user');

  return (
    <div className="auth-page" data-theme={tema}>
      <button className="auth-theme-toggle" onClick={alternarTema} aria-label="Cambiar tema">
        {tema === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-brand">
          <Compass size={28} color="var(--shell-accent)" />
          <span>404</span>
        </div>
        <h2 style={{ marginTop: 0 }}>Esta página no existe</h2>
        <p style={{ color: 'var(--shell-text-muted)' }}>
          El enlace puede estar roto o la página se movió.
        </p>
        <Link className="btn primary" style={{ textDecoration: 'none' }} to={hayUsuario ? '/home' : '/'}>
          {hayUsuario ? 'Ir al Dashboard' : 'Ir al inicio'}
        </Link>
      </div>
    </div>
  );
}
