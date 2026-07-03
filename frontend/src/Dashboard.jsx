import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { cursosGeneralesPorCarrera } from './data/cursosGenerales';
import Sidebar from './Sidebar.jsx';

export default function Dashboard() {
  const navigate = useNavigate();
  const usuarioGuardado = JSON.parse(localStorage.getItem('user') || 'null');
  const carrera = usuarioGuardado?.user_metadata?.carrera || 'Tu carrera';
  const nombreUsuario = usuarioGuardado?.user_metadata?.nombre || '';
  const cursosGenerales = cursosGeneralesPorCarrera[carrera];
  const inicialAvatar = (nombreUsuario || usuarioGuardado?.email || '?').charAt(0).toUpperCase();

  const [cursosAprobados, setCursosAprobados] = useState(
    usuarioGuardado?.user_metadata?.cursosAprobados || []
  );

  const todosLosCursos = cursosGenerales ? [...cursosGenerales[1], ...cursosGenerales[2]] : [];
  const totalCursos = todosLosCursos.length;
  const aprobadosCount = cursosAprobados.filter((c) => todosLosCursos.includes(c)).length;
  const progreso = totalCursos > 0 ? Math.round((aprobadosCount / totalCursos) * 100) : 0;

  const alternarCurso = async (curso) => {
    const anterior = cursosAprobados;
    const nuevo = anterior.includes(curso)
      ? anterior.filter((c) => c !== curso)
      : [...anterior, curso];

    setCursosAprobados(nuevo);

    const { data, error } = await supabase.auth.updateUser({
      data: { cursosAprobados: nuevo },
    });

    if (error) {
      if (error.message.toLowerCase().includes('session')) {
        localStorage.removeItem('user');
        navigate('/');
        return;
      }
      setCursosAprobados(anterior); // revertir si falló el guardado
      return;
    }

    localStorage.setItem('user', JSON.stringify(data.user));
  };

  return (
    <div className="dashboard-root">
      <Sidebar active="dashboard" />

      <main className="main-area">
        <header className="topbar">
          <h1>{carrera}</h1>
          <div className="top-actions">
            <button className="btn ghost">Actualizar cursos</button>
            <button className="btn primary" onClick={() => navigate('/mapa-curricular')}>Ver mapa curricular</button>
            <div className="avatar">{inicialAvatar}</div>
          </div>
        </header>

        <section className="overview">
          <div className="stat-card progress">
            <div className="label">Progreso</div>
            <div className="value">{progreso}%</div>
          </div>
          <div className="stat-card green">
            <div className="label">Aprobados</div>
            <div className="value">{aprobadosCount}/{totalCursos}</div>
          </div>
        </section>

        <section className="cards">
          {cursosGenerales ? (
            <>
              <div className="card courses">
                <h3>Cursos Generales · Ciclo 1</h3>
                <div className="course-grid">
                  {cursosGenerales[1].map((curso) => (
                    <label key={curso} className="course-item course-item-check">
                      <input
                        type="checkbox"
                        checked={cursosAprobados.includes(curso)}
                        onChange={() => alternarCurso(curso)}
                      />
                      <div className="course-title">{curso}</div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="card completed">
                <h3>Cursos Generales · Ciclo 2</h3>
                <div className="list">
                  {cursosGenerales[2].map((curso) => (
                    <label key={curso} className="list-item list-item-check">
                      <input
                        type="checkbox"
                        checked={cursosAprobados.includes(curso)}
                        onChange={() => alternarCurso(curso)}
                      />
                      {curso}
                    </label>
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
      </main>
    </div>
  );
}
