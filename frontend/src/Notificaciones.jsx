import { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { Bell, UserCog, BookOpen, Map, CheckCheck } from 'lucide-react';

// Carreras que hoy solo tienen ciclos 1-2 (ver CLAUDE.md).
const CARRERAS_PENDIENTES = [
  'Ingenieria Industrial',
  'Marketing',
  'Comunicaciones',
  'Derecho',
  'Ingenieria Ambiental',
];

// Genera las notificaciones a partir del estado local del usuario.
function construirNotificaciones(usuario) {
  const meta = usuario?.user_metadata || {};
  const estadoCursos = meta.estadoCursos || {};
  const enCurso = Object.values(estadoCursos).filter((e) => e === 'en_curso').length;
  const notifs = [];

  notifs.push({
    id: 'bienvenida',
    icono: Bell,
    titulo: 'Bienvenido a Educateca',
    texto: 'Marca tus cursos por estado en el Dashboard para ver tu avance de carrera.',
  });

  if (!meta.nombre || !meta.carrera || !meta.ciclo) {
    notifs.push({
      id: 'perfil-incompleto',
      icono: UserCog,
      titulo: 'Completa tu perfil',
      texto: 'Faltan datos en tu perfil. Agregalos para personalizar tu experiencia.',
      to: '/perfil',
    });
  }

  if (enCurso > 0) {
    notifs.push({
      id: `en-curso-${enCurso}`,
      icono: BookOpen,
      titulo: `Tienes ${enCurso} curso${enCurso === 1 ? '' : 's'} en curso`,
      texto: 'Revisalos en la seccion Mis Cursos.',
      to: '/mis-cursos',
    });
  }

  if (meta.carrera && CARRERAS_PENDIENTES.includes(meta.carrera)) {
    notifs.push({
      id: `malla-pendiente-${meta.carrera}`,
      icono: Map,
      titulo: 'Malla en construccion',
      texto: `La malla de ${meta.carrera} todavia muestra solo los ciclos 1-2. Estamos actualizandola.`,
      to: '/mapa-curricular',
    });
  }

  return notifs;
}

export default function Notificaciones() {
  const usuario = JSON.parse(localStorage.getItem('user') || 'null');
  const notifs = construirNotificaciones(usuario);

  const [leidas, setLeidas] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('notif_leidas') || '[]');
    } catch {
      return [];
    }
  });

  const guardarLeidas = (ids) => {
    setLeidas(ids);
    localStorage.setItem('notif_leidas', JSON.stringify(ids));
  };

  const marcarLeida = (id) => {
    if (leidas.includes(id)) return;
    guardarLeidas([...leidas, id]);
  };

  const marcarTodas = () => {
    guardarLeidas(notifs.map((n) => n.id));
  };

  const sinLeer = notifs.filter((n) => !leidas.includes(n.id)).length;

  return (
    <Sidebar active="notificaciones">
      <header className="topbar">
        <h1>Notificaciones</h1>
        {sinLeer > 0 && (
          <div className="top-actions">
            <button className="btn" onClick={marcarTodas}>
              <CheckCheck size={16} /> Marcar todas como leidas
            </button>
          </div>
        )}
      </header>

      {notifs.length === 0 ? (
        <div className="card">
          <p>No tienes notificaciones por ahora.</p>
        </div>
      ) : (
        <div className="list" style={{ maxWidth: '640px' }}>
          {notifs.map((n) => {
            const Icono = n.icono;
            const noLeida = !leidas.includes(n.id);
            const contenido = (
              <div
                className="list-item"
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  borderLeft: noLeida ? '3px solid var(--shell-accent)' : '3px solid transparent',
                }}
                onClick={() => marcarLeida(n.id)}
              >
                <Icono size={20} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--shell-accent)' }} />
                <div>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {n.titulo}
                    {noLeida && (
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '999px',
                          background: 'var(--shell-accent)',
                          display: 'inline-block',
                        }}
                      />
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--shell-text-muted)', marginTop: '2px' }}>
                    {n.texto}
                  </div>
                </div>
              </div>
            );

            return n.to ? (
              <Link key={n.id} to={n.to} style={{ textDecoration: 'none', color: 'inherit' }}>
                {contenido}
              </Link>
            ) : (
              <div key={n.id}>{contenido}</div>
            );
          })}
        </div>
      )}
    </Sidebar>
  );
}
