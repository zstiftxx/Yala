import { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { useUser } from './useUser';
import { carrerasConMallaCompleta } from './data/mallaCurricular';
import { Bell, UserCog, BookOpen, Map, CheckCheck } from 'lucide-react';

// Genera las notificaciones a partir del estado local del usuario.
function construirNotificaciones(meta) {
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

  if (meta.carrera && !carrerasConMallaCompleta.includes(meta.carrera)) {
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
  const { metadata } = useUser();
  const notifs = construirNotificaciones(metadata);

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
        <div className="list notif-lista">
          {notifs.map((n) => {
            const Icono = n.icono;
            const noLeida = !leidas.includes(n.id);
            const contenido = (
              <div
                className={`list-item notif${noLeida ? ' no-leida' : ''}`}
                onClick={() => marcarLeida(n.id)}
              >
                <Icono size={20} className="notif-icono" />
                <div>
                  <div className="notif-titulo">
                    {n.titulo}
                    {noLeida && <span className="notif-punto" />}
                  </div>
                  <div className="notif-texto">{n.texto}</div>
                </div>
              </div>
            );

            return n.to ? (
              <Link key={n.id} to={n.to} className="notif-enlace">
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
