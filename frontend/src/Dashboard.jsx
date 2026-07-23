import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from './useUser';
import { cursosGeneralesPorCarrera, carreras } from './data/cursosGenerales';
import { obtenerMallaCompleta, carrerasConMallaCompleta, cursosDisponibles } from './data/mallaCurricular';
import Sidebar from './Sidebar.jsx';
import EstadoCurso from './EstadoCurso.jsx';
import AnilloProgreso from './AnilloProgreso.jsx';
import { BookOpen, Map, BookCheck, CalendarClock, BookX, Info, Unlock, ChevronRight } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    estadoCursos,
    cambiarEstadoCurso,
    actualizarMetadata,
    carrera: carreraGuardada,
    nombre,
    guardado,
  } = useUser();
  const carrera = carreraGuardada || 'Tu carrera';
  const cursosGenerales = cursosGeneralesPorCarrera[carrera];
  const primerNombre = (nombre || '').trim().split(' ')[0];

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

  const filaCurso = (curso) => (
    <div key={curso} className="curso-fila">
      <Link to={`/curso/${encodeURIComponent(curso)}`} className="curso-enlace">
        {curso}
      </Link>
      <EstadoCurso
        curso={curso}
        estado={estadoCursos[curso] || 'no_cursado'}
        onCambiar={(valor) => cambiarEstadoCurso(curso, valor)}
      />
    </div>
  );

  return (
    <Sidebar active="dashboard">
      <header className="page-head">
        <div className="page-head-texto">
          {primerNombre && <p className="page-eyebrow">Hola, {primerNombre}</p>}
          <h1>{carrera}</h1>
        </div>
        <div className="page-head-acciones">
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

      {/* El heroe de la pantalla: una sola cifra grande en vez de cuatro
          tarjetas del mismo peso, donde nada indicaba que mirar primero. */}
      <section className="hero">
        <AnilloProgreso porcentaje={progreso} />
        <div className="hero-texto">
          <h2>
            {progreso === 0
              ? 'Empecemos a marcar tu avance'
              : progreso === 100
                ? 'Terminaste la carrera'
                : `Llevas ${progreso}% de tu carrera`}
          </h2>
          <p className="hero-sub">
            {totalCursos > 0
              ? `${aprobadosCount} de ${totalCursos} cursos aprobados`
              : 'Elige tu carrera para ver tu avance'}
          </p>
          <dl className="hero-stats">
            <div className="hero-stat green">
              <dt><BookCheck size={15} /> Aprobados</dt>
              <dd>{aprobadosCount}</dd>
            </div>
            <div className="hero-stat blue">
              <dt><CalendarClock size={15} /> En curso</dt>
              <dd>{enCursoCount}</dd>
            </div>
            <div className="hero-stat muted">
              <dt><BookX size={15} /> Pendientes</dt>
              <dd>{noCursadoCount}</dd>
            </div>
          </dl>
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
            <h3 className="card-titulo"><Unlock size={16} /> Puedes llevar ahora</h3>
            <p className="card-sub">Cursos con todos sus prerrequisitos aprobados.</p>
            {disponibles.length > 0 ? (
              <div className="lista-filas">
                {disponibles.map(({ curso, ciclo }) => (
                  <Link
                    key={curso}
                    to={`/curso/${encodeURIComponent(curso)}`}
                    className="curso-fila enlace"
                  >
                    <span className="curso-enlace">{curso}</span>
                    <span className="pastilla-ciclo">Ciclo {ciclo}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="vacio">
                No hay cursos habilitados: ya aprobaste o estas llevando todo lo que
                tus prerrequisitos permiten.
              </p>
            )}

            {sinDatos.length > 0 && (
              <details className="disponibles-sindatos">
                <summary>Sin prerrequisitos registrados ({sinDatos.length})</summary>
                <p className="card-sub">
                  No tenemos los prerrequisitos de estos cursos, asi que no podemos
                  confirmar si ya los puedes llevar.
                </p>
                <div className="lista-filas">
                  {sinDatos.map(({ curso, ciclo }) => (
                    <Link
                      key={curso}
                      to={`/curso/${encodeURIComponent(curso)}`}
                      className="curso-fila enlace"
                    >
                      <span className="curso-enlace">{curso}</span>
                      <span className="pastilla-ciclo muted">Ciclo {ciclo}</span>
                    </Link>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {cursosGenerales ? (
          <>
            <div className="card courses">
              <h3 className="card-titulo">Cursos Generales · Ciclo 1</h3>
              <div className="lista-filas">{cursosGenerales[1].map(filaCurso)}</div>
            </div>

            <div className="card completed">
              <h3 className="card-titulo">Cursos Generales · Ciclo 2</h3>
              <div className="lista-filas">{cursosGenerales[2].map(filaCurso)}</div>
            </div>
          </>
        ) : (
          <div className="card courses">
            <h3 className="card-titulo">Cursos Generales</h3>
            <p className="vacio">
              Selecciona tu carrera para ver los cursos generales que te corresponden.
            </p>
            <Link to="/carrera" className="btn primary vacio-accion">
              Elegir carrera <ChevronRight size={16} />
            </Link>
          </div>
        )}
      </section>

      {/* Cambiar de carrera es una accion rara y destructiva (reencuadra todo el
          avance), asi que baja al pie en vez de competir con las acciones
          principales arriba. */}
      <section className="pie-carrera">
        <label className="pie-carrera-label" htmlFor="cambiar-carrera">
          Estudias otra carrera?
        </label>
        <select
          id="cambiar-carrera"
          value={carrera}
          onChange={(e) => cambiarCarrera(e.target.value)}
          disabled={cambiandoCarrera}
          className="select-suave"
        >
          {carreras.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </section>
    </Sidebar>
  );
}
