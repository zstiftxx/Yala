import Sidebar from './Sidebar.jsx';
import { obtenerMallaCompleta } from './data/mallaCurricular';

export default function MapaCurricular() {
  const usuarioGuardado = JSON.parse(localStorage.getItem('user') || 'null');
  const carrera = usuarioGuardado?.user_metadata?.carrera || 'Tu carrera';
  const estadoCursos = usuarioGuardado?.user_metadata?.estadoCursos || {};
  const malla = obtenerMallaCompleta(carrera);
  const ciclos = malla ? Object.keys(malla).map(Number).sort((a, b) => a - b) : [];

  return (
    <Sidebar active="dashboard">
      <header className="topbar">
        <h1>Mapa Curricular</h1>
      </header>
      <p style={{ marginBottom: '20px' }}>{carrera}</p>

      {malla ? (
        <div className="malla-grid">
          {ciclos.map((ciclo) => (
            <div key={ciclo} className="malla-columna">
              <h4>Ciclo {ciclo}</h4>
              {malla[ciclo].map((curso) => (
                <div
                  key={curso}
                  className={`malla-curso ${(estadoCursos[curso] || 'no_cursado').replace('_', '-')}`}
                >
                  {curso}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <p>Todavía no tenemos la malla completa de {carrera}. Por ahora puedes ver tus cursos generales en el Dashboard.</p>
        </div>
      )}
    </Sidebar>
  );
}
