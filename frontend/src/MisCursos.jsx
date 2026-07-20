import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { useUser } from './useUser';
import { obtenerMallaCompleta, carrerasConMallaCompleta } from './data/mallaCurricular';
import { Search, ChevronRight, Info } from 'lucide-react';

const FILTROS = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'en_curso', etiqueta: 'En curso' },
  { valor: 'aprobado', etiqueta: 'Aprobados' },
  { valor: 'no_cursado', etiqueta: 'No cursados' },
];

// Nadie escribe "Cálculo" con tilde en un buscador. Se comparan las dos
// cadenas sin tildes y en minusculas para que "calculo" encuentre el curso.
function sinTildes(texto) {
  // ̀-ͯ es el bloque de tildes que NFD deja sueltas.
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export default function MisCursos() {
  const { carrera, estadoCursos, cambiarEstadoCurso } = useUser();

  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');

  const malla = obtenerMallaCompleta(carrera);
  const mallaCompleta = carrerasConMallaCompleta.includes(carrera);

  // [{ ciclo, cursos: [...] }] ya filtrado, sin los ciclos que quedan vacios.
  const ciclos = useMemo(() => {
    if (!malla) return [];
    const termino = sinTildes(busqueda.trim());

    return Object.entries(malla)
      .map(([ciclo, cursos]) => ({
        ciclo: Number(ciclo),
        cursos: cursos.filter((curso) => {
          const estado = estadoCursos[curso] || 'no_cursado';
          if (filtro !== 'todos' && estado !== filtro) return false;
          return !termino || sinTildes(curso).includes(termino);
        }),
      }))
      .filter((grupo) => grupo.cursos.length > 0)
      .sort((a, b) => a.ciclo - b.ciclo);
  }, [malla, estadoCursos, busqueda, filtro]);

  const totales = useMemo(() => {
    const cursos = malla ? Object.values(malla).flat() : [];
    const cuenta = (estado) =>
      cursos.filter((c) => (estadoCursos[c] || 'no_cursado') === estado).length;
    return {
      todos: cursos.length,
      en_curso: cuenta('en_curso'),
      aprobado: cuenta('aprobado'),
      no_cursado: cuenta('no_cursado'),
    };
  }, [malla, estadoCursos]);

  const encontrados = ciclos.reduce((n, g) => n + g.cursos.length, 0);

  if (!malla) {
    return (
      <Sidebar active="mis-cursos">
        <header className="topbar">
          <h1>Mis Cursos</h1>
        </header>
        <div className="card">
          <p className="vacio">
            Todavia no elegiste tu carrera, asi que no sabemos que cursos mostrarte.
          </p>
          <Link to="/carrera" className="btn primary vacio-accion">
            Elegir carrera
          </Link>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar active="mis-cursos">
      <header className="topbar">
        <h1>Mis Cursos</h1>
      </header>
      <p className="page-intro">
        Todos los cursos de {carrera}. Busca uno para ver sus apuntes, resumenes y
        examenes, o cambia su estado desde aca.
      </p>

      <div className="buscador">
        <Search size={16} className="buscador-icono" />
        <input
          className="form-input"
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar un curso..."
          aria-label="Buscar un curso"
        />
      </div>

      <div className="filtros">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            className={`chip${filtro === f.valor ? ' activo' : ''}`}
            onClick={() => setFiltro(f.valor)}
          >
            {f.etiqueta} ({totales[f.valor]})
          </button>
        ))}
      </div>

      {!mallaCompleta && (
        <div className="aviso-malla">
          <Info size={16} />
          <span>
            Todavia no tenemos la malla actualizada de {carrera}: por ahora solo
            aparecen los cursos de los ciclos 1 y 2.
          </span>
        </div>
      )}

      {encontrados === 0 ? (
        <div className="card">
          <p className="vacio">
            {busqueda
              ? `Ningun curso de tu malla coincide con "${busqueda}".`
              : 'No hay cursos con ese estado.'}
          </p>
        </div>
      ) : (
        ciclos.map(({ ciclo, cursos }) => (
          <section className="card ciclo-bloque" key={ciclo}>
            <h3>Ciclo {ciclo}</h3>
            <div className="list">
              {cursos.map((curso) => (
                <div key={curso} className="list-item list-item-status">
                  <Link to={`/curso/${encodeURIComponent(curso)}`} className="curso-enlace">
                    {curso} <ChevronRight size={15} />
                  </Link>
                  <select
                    value={estadoCursos[curso] || 'no_cursado'}
                    onChange={(e) => cambiarEstadoCurso(curso, e.target.value)}
                    className="estado-curso-select"
                    aria-label={`Estado de ${curso}`}
                  >
                    <option value="no_cursado">No cursado</option>
                    <option value="en_curso">En curso</option>
                    <option value="aprobado">Aprobado</option>
                  </select>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </Sidebar>
  );
}
