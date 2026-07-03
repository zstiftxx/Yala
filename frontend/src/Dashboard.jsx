import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { cursosGeneralesPorCarrera, carreras } from './data/cursosGenerales';
import Sidebar from './Sidebar.jsx';
import { RefreshCw, Map, TrendingUp, BookCheck, CalendarClock, BookX, ArrowLeftRight } from 'lucide-react';

function estadoInicialDesde(metadata) {
  if (metadata?.estadoCursos) return metadata.estadoCursos;
  // Compatibilidad con el modelo anterior (solo aprobado/no cursado)
  const previo = {};
  (metadata?.cursosAprobados || []).forEach((curso) => {
    previo[curso] = 'aprobado';
  });
  return previo;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const usuarioGuardado = JSON.parse(localStorage.getItem('user') || 'null');
  const [carrera, setCarrera] = useState(usuarioGuardado?.user_metadata?.carrera || 'Tu carrera');
  const cursosGenerales = cursosGeneralesPorCarrera[carrera];

  const [estadoCursos, setEstadoCursos] = useState(estadoInicialDesde(usuarioGuardado?.user_metadata));
  const [cambiandoCarrera, setCambiandoCarrera] = useState(false);

  const todosLosCursos = cursosGenerales ? [...cursosGenerales[1], ...cursosGenerales[2]] : [];
  const totalCursos = todosLosCursos.length;
  const aprobadosCount = todosLosCursos.filter((c) => estadoCursos[c] === 'aprobado').length;
  const enCursoCount = todosLosCursos.filter((c) => estadoCursos[c] === 'en_curso').length;
  const noCursadoCount = totalCursos - aprobadosCount - enCursoCount;
  const progreso = totalCursos > 0 ? Math.round((aprobadosCount / totalCursos) * 100) : 0;

  const cambiarEstado = async (curso, nuevoEstado) => {
    const anterior = estadoCursos;
    const nuevo = { ...anterior };
    if (nuevoEstado === 'no_cursado') {
      delete nuevo[curso];
    } else {
      nuevo[curso] = nuevoEstado;
    }

    setEstadoCursos(nuevo);

    const { data, error } = await supabase.auth.updateUser({
      data: { estadoCursos: nuevo },
    });

    if (error) {
      if (error.message.toLowerCase().includes('session')) {
        localStorage.removeItem('user');
        navigate('/');
        return;
      }
      setEstadoCursos(anterior); // revertir si falló el guardado
      return;
    }

    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const cambiarCarrera = async (nuevaCarrera) => {
    const anterior = carrera;
    setCarrera(nuevaCarrera);
    setCambiandoCarrera(true);

    const { data, error } = await supabase.auth.updateUser({
      data: { carrera: nuevaCarrera },
    });

    if (error) {
      if (error.message.toLowerCase().includes('session')) {
        localStorage.removeItem('user');
        navigate('/');
        return;
      }
      setCarrera(anterior);
      setCambiandoCarrera(false);
      return;
    }

    localStorage.setItem('user', JSON.stringify(data.user));
    setCambiandoCarrera(false);
  };

  const selectorEstado = (curso) => (
    <select
      value={estadoCursos[curso] || 'no_cursado'}
      onChange={(e) => cambiarEstado(curso, e.target.value)}
      className="estado-curso-select"
    >
      <option value="no_cursado">No cursado</option>
      <option value="en_curso">En curso</option>
      <option value="aprobado">Aprobado</option>
    </select>
  );

  return (
    <Sidebar active="dashboard">
      <header className="topbar">
        <h1>{carrera}</h1>
        <div className="top-actions">
          <ArrowLeftRight size={16} />
          <select
            value={carrera}
            onChange={(e) => cambiarCarrera(e.target.value)}
            disabled={cambiandoCarrera}
            className="estado-curso-select"
          >
            {carreras.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button className="btn ghost"><RefreshCw size={16} /> Actualizar cursos</button>
          <button className="btn primary" onClick={() => navigate('/mapa-curricular')}>
            <Map size={16} /> Ver mapa curricular
          </button>
        </div>
      </header>

      <section className="overview">
        <div className="stat-card progress">
          <div className="icon-row"><TrendingUp size={18} /> {progreso}%</div>
          <div className="label">Progreso</div>
        </div>
        <div className="stat-card green">
          <div className="icon-row"><BookCheck size={18} /> {aprobadosCount}/{totalCursos}</div>
          <div className="label">Aprobados</div>
        </div>
        <div className="stat-card blue">
          <div className="icon-row"><CalendarClock size={18} /> {enCursoCount}</div>
          <div className="label">En curso</div>
        </div>
        <div className="stat-card muted">
          <div className="icon-row"><BookX size={18} /> {noCursadoCount}</div>
          <div className="label">No cursados</div>
        </div>
      </section>

      <section className="cards">
        {cursosGenerales ? (
          <>
            <div className="card courses">
              <h3>Cursos Generales · Ciclo 1</h3>
              <div className="course-grid">
                {cursosGenerales[1].map((curso) => (
                  <div key={curso} className="course-item course-item-status">
                    <div className="course-title">{curso}</div>
                    {selectorEstado(curso)}
                  </div>
                ))}
              </div>
            </div>

            <div className="card completed">
              <h3>Cursos Generales · Ciclo 2</h3>
              <div className="list">
                {cursosGenerales[2].map((curso) => (
                  <div key={curso} className="list-item list-item-status">
                    <span>{curso}</span>
                    {selectorEstado(curso)}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="card courses">
            <h3>Cursos Generales</h3>
            <p>Selecciona tu carrera para ver los cursos generales que te corresponden.</p>
          </div>
        )}
      </section>
    </Sidebar>
  );
}
