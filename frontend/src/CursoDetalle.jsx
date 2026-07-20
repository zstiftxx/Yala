import { useParams, Link } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function CursoDetalle() {
  const { curso } = useParams();
  const nombreCurso = decodeURIComponent(curso || '');

  return (
    <Sidebar active="mis-cursos">
      <header className="topbar">
        <h1>{nombreCurso}</h1>
      </header>

      <div className="card">
        <p>Aquí pondremos los apuntes, resúmenes y exámenes de este curso.</p>
        <Link to="/mis-cursos" style={{ color: 'var(--shell-accent)', display: 'inline-block', marginTop: '10px' }}>
          ⬅️ Volver a Mis Cursos
        </Link>
      </div>
    </Sidebar>
  );
}
