import { Link } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { cursosGeneralesPorCarrera } from './data/cursosGenerales';
import { obtenerMallaCompleta } from './data/mallaCurricular';

export default function MisCursos() {
  const usuarioGuardado = JSON.parse(localStorage.getItem('user') || 'null');
  const carrera = usuarioGuardado?.user_metadata?.carrera || '';
  const estadoCursos = usuarioGuardado?.user_metadata?.estadoCursos || {};

  const malla = obtenerMallaCompleta(carrera) || cursosGeneralesPorCarrera[carrera];
  const todosLosCursos = malla ? Object.values(malla).flat() : [];
  const cursosEnCurso = todosLosCursos.filter((curso) => estadoCursos[curso] === 'en_curso');

  return (
    <Sidebar active="mis-cursos">
      <header className="topbar">
        <h1>Mis Cursos</h1>
      </header>
      <p style={{ marginBottom: '20px' }}>Cursos que marcaste como "En curso" en el Dashboard.</p>

      {cursosEnCurso.length > 0 ? (
        <div className="course-grid">
          {cursosEnCurso.map((curso) => (
            <Link
              key={curso}
              to={`/curso/${encodeURIComponent(curso)}`}
              className="course-item"
              style={{ textDecoration: 'none', display: 'block', color: 'inherit' }}
            >
              <div className="course-title">{curso}</div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card">
          <p>Todavía no marcaste ningún curso como "En curso". Ve al Dashboard y cambia el estado de tus cursos.</p>
        </div>
      )}
    </Sidebar>
  );
}
