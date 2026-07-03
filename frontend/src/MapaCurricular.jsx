import Sidebar from './Sidebar.jsx';
import { obtenerMallaCompleta } from './data/mallaCurricular';

export default function MapaCurricular() {
  const usuarioGuardado = JSON.parse(localStorage.getItem('user') || 'null');
  const carrera = usuarioGuardado?.user_metadata?.carrera || 'Tu carrera';
  const cursosAprobados = usuarioGuardado?.user_metadata?.cursosAprobados || [];
  const malla = obtenerMallaCompleta(carrera);
  const ciclos = malla ? Object.keys(malla).map(Number).sort((a, b) => a - b) : [];

  return (
    <div className="dashboard-root">
      <Sidebar active="dashboard" />

      <main className="main-area">
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
                    className={`malla-curso ${cursosAprobados.includes(curso) ? 'aprobado' : 'no-cursado'}`}
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
      </main>
    </div>
  );
}
