import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './useUser';
import { cursosGeneralesPorCarrera, carreras } from './data/cursosGenerales';
import { obtenerMallaCompleta, carrerasConMallaCompleta, cursosDisponibles } from './data/mallaCurricular';
import Sidebar from './Sidebar.jsx';
import { BookOpen, Map, TrendingUp, BookCheck, CalendarClock, BookX, ArrowLeftRight, Info, Unlock } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { estadoCursos, cambiarEstadoCurso, actualizarMetadata, carrera: carreraGuardada, guardado } = useUser();
  const carrera = carreraGuardada || 'Tu carrera';
  const cursosGenerales = cursosGeneralesPorCarrera[carrera];

  const [cambiandoCarrera, setCambiandoCarrera] = useState(false);

  // El progreso se calcula sobre la malla completa (todos los ciclos), no solo
  // los generales. Para las carreras sin malla actualizada, obtenerMallaCompleta
  // devuelve solo los ciclos 1-2 y lo advertimos en pantalla.
  const malla = obtenerMallaCompleta(carrera);
  const mallaCompleta = carrerasConMallaCompleta.includes(carrera);
  const todosLosCursos = malla ? Object.values(malla).flat() : [];
  const totalCursos = todosLosCursos.length;
  const aprobadosCount = todosLosCursos.filter((c) => estadoCursos[c] === 'aprobado').length;
  const enCursoCount = todosLosCursos.filter((c) => estadoCursos[c] === 'en_curso').length;
  const noCursadoCount = totalCursos - aprobadosCount - enCursoCount;
  const { disponibles, sinDatos } = cursosDisponibles(carrera, estadoCursos);
  const progreso = totalCursos > 0 ? Math.round((aprobadosCount / totalCursos) * 100) : 0;

  const cambiarCarrera = async (nuevaCarrera) => {
    setCambiandoCarrera(true);
    await actualizarMetadata({ carrera: nuevaCarrera }, { inmediato: true });
    setCambiandoCarrera(false);
  };

  const selectorEstado = (curso) => (
    <select
      value={estadoCursos[curso] || 'no_cursado'}
      onChange={(e) => cambiarEstadoCurso(curso, e.target.value)}
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
          {guardado !== 'limpio' && (
            <span className={`guardado-estado ${guardado}`}>
              {guardado === 'guardando' ? 'Guardando...' : 'No se pudo guardar'}
            </span>
          )}
          {/* Antes habia aqui un boton "Actualizar cursos" sin onClick: no hacia
              nada al tocarlo. Ahora lleva al catalogo, que es lo que la gente
              buscaba al presionarlo. */}
          <button className="btn" onClick={() => navigate('/mis-cursos')}>
            <BookOpen size={16} /> Todos mis cursos
          </button>
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

      {malla && !mallaCompleta && (
        <div className="aviso-malla">
          <Info size={16} />
          <span>
            Todavia no tenemos la malla actualizada de {carrera}. El avance que ves
            corresponde solo a los ciclos 1 y 2.
          </span>
        </div>
      )}

      <section className="cards">
        {malla && (
          <div className="card disponibles">
            <h3><Unlock size={16} /> Puedes llevar ahora</h3>
            <p className="disponibles-sub">
              Cursos con todos sus prerrequisitos aprobados.
            </p>
            {disponibles.length > 0 ? (
              <div className="list">
                {disponibles.map(({ curso, ciclo }) => (
                  <div key={curso} className="list-item list-item-status">
                    <span>{curso}</span>
                    <span className="disponibles-ciclo">Ciclo {ciclo}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="disponibles-vacio">
                No hay cursos habilitados: ya aprobaste o estas llevando todo lo que
                tus prerrequisitos permiten.
              </p>
            )}

            {sinDatos.length > 0 && (
              <details className="disponibles-sindatos">
                <summary>
                  Sin prerrequisitos registrados ({sinDatos.length})
                </summary>
                <p className="disponibles-nota">
                  No tenemos los prerrequisitos de estos cursos, asi que no podemos
                  confirmar si ya los puedes llevar.
                </p>
                <div className="list">
                  {sinDatos.map(({ curso, ciclo }) => (
                    <div key={curso} className="list-item list-item-status">
                      <span>{curso}</span>
                      <span className="disponibles-ciclo muted">Ciclo {ciclo}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

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
