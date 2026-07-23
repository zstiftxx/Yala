import { useState, useMemo, useLayoutEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import { useUser } from './useUser';
import { obtenerMallaCompleta, obtenerPrerequisitos } from './data/mallaCurricular';

export default function MapaCurricular() {
  const { carrera: carreraGuardada, estadoCursos, cambiarEstadoCurso } = useUser();
  const carrera = carreraGuardada || 'Tu carrera';
  const malla = useMemo(() => obtenerMallaCompleta(carrera), [carrera]);
  const prereqs = useMemo(() => obtenerPrerequisitos(carrera), [carrera]);
  const ciclos = malla ? Object.keys(malla).map(Number).sort((a, b) => a - b) : [];

  const [seleccionado, setSeleccionado] = useState(null);

  const gridRef = useRef(null);
  const cursoRefs = useRef({});
  const [lineas, setLineas] = useState([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Mapa inverso: curso -> cursos que dependen de él (para trazar el camino).
  const dependientes = useMemo(() => {
    const rev = {};
    Object.entries(prereqs).forEach(([curso, lista]) => {
      lista.forEach((pre) => {
        (rev[pre] = rev[pre] || []).push(curso);
      });
    });
    return rev;
  }, [prereqs]);

  // Conjunto de cursos en el camino del seleccionado (prerreqs + dependientes, transitivo).
  const relacionados = useMemo(() => {
    if (!seleccionado) return null;
    const set = new Set([seleccionado]);
    const subir = [seleccionado];
    while (subir.length) {
      const c = subir.pop();
      (prereqs[c] || []).forEach((p) => { if (!set.has(p)) { set.add(p); subir.push(p); } });
    }
    const bajar = [seleccionado];
    while (bajar.length) {
      const c = bajar.pop();
      (dependientes[c] || []).forEach((d) => { if (!set.has(d)) { set.add(d); bajar.push(d); } });
    }
    return set;
  }, [seleccionado, prereqs, dependientes]);

  const calcular = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const base = grid.getBoundingClientRect();
    // El hueco entre columnas es donde corre el tramo vertical de las flechas.
    const hueco = parseFloat(getComputedStyle(grid).columnGap) || 36;

    // getBoundingClientRect ya viene descontado el scroll, asi que se le suma
    // de vuelta: las coordenadas del SVG son del contenido, no de lo visible.
    const punto = (el, lado) => {
      const r = el.getBoundingClientRect();
      return {
        x: (lado === 'der' ? r.right : r.left) - base.left + grid.scrollLeft,
        y: r.top - base.top + grid.scrollTop + r.height / 2,
      };
    };

    const nuevas = [];
    Object.entries(prereqs).forEach(([curso, lista]) => {
      const destino = cursoRefs.current[curso];
      if (!destino) return;
      const d = punto(destino, 'izq');
      lista.forEach((pre) => {
        const origen = cursoRefs.current[pre];
        if (!origen) return;
        const o = punto(origen, 'der');
        nuevas.push({ key: `${pre}->${curso}`, pre, dest: curso, x1: o.x, y1: o.y, x2: d.x, y2: d.y });
      });
    });

    // Cada flecha baja por el hueco que hay justo ANTES de su columna destino.
    // Si todas usaran el centro exacto del hueco, las que apuntan a la misma
    // columna compartirian el tramo vertical y se veria una sola linea gorda;
    // por eso se reparten en abanico dentro del hueco.
    const porColumna = new Map();
    nuevas.forEach((l) => {
      const col = Math.round(l.x2);
      if (!porColumna.has(col)) porColumna.set(col, []);
      porColumna.get(col).push(l);
    });
    porColumna.forEach((grupo) => {
      // Ordenar por altura del destino evita que los canales se crucen entre si.
      grupo.sort((a, b) => a.y2 - b.y2);
      const paso = Math.min(7, (hueco - 14) / Math.max(grupo.length - 1, 1));
      grupo.forEach((l, i) => {
        l.canal = l.x2 - hueco / 2 + (i - (grupo.length - 1) / 2) * paso;
      });
    });

    setLineas(nuevas);
    setSize((previo) => {
      const w = grid.scrollWidth;
      const h = grid.scrollHeight;
      // Sin esta comparacion el ResizeObserver se re-dispara con cada render.
      return previo.w === w && previo.h === h ? previo : { w, h };
    });
  }, [prereqs]);

  useLayoutEffect(() => {
    calcular();
    // Las tarjetas cambian de alto cuando termina de cargar la fuente y cuando
    // el ancho del grid cambia; un setTimeout suelto se perdia esos casos.
    const observador = new ResizeObserver(calcular);
    if (gridRef.current) observador.observe(gridRef.current);
    window.addEventListener('resize', calcular);
    return () => { observador.disconnect(); window.removeEventListener('resize', calcular); };
  }, [calcular, carrera]);

  // Rutas ortogonales con las esquinas redondeadas, no curvas en S: cuando hay
  // cincuenta flechas, las bezier salen todas en angulos distintos y el mapa se
  // lee como un plato de fideos. Asi cada flecha es "sale, baja por su canal,
  // entra", y las que van a ciclos lejanos pasan por DEBAJO de las tarjetas
  // (que son opacas), en vez de cruzarlas a la vista.
  const construirPath = ({ x1, y1, x2, y2, canal }) => {
    const n = (v) => Math.round(v * 10) / 10;
    // Un prerrequisito siempre queda a la izquierda; si un dato malo lo pusiera
    // al reves, la ruta ortogonal se calcularia con radios negativos.
    if (x2 <= x1 + 12) return `M ${n(x1)} ${n(y1)} L ${n(x2)} ${n(y2)}`;
    if (Math.abs(y1 - y2) < 2) return `M ${n(x1)} ${n(y1)} H ${n(x2)}`;

    const xm = Math.min(Math.max(canal, x1 + 6), x2 - 6);
    const dir = y2 > y1 ? 1 : -1;
    const r = Math.min(9, Math.abs(y2 - y1) / 2, xm - x1, x2 - xm);
    return [
      `M ${n(x1)} ${n(y1)}`,
      `H ${n(xm - r)}`,
      `Q ${n(xm)} ${n(y1)} ${n(xm)} ${n(y1 + dir * r)}`,
      `V ${n(y2 - dir * r)}`,
      `Q ${n(xm)} ${n(y2)} ${n(xm + r)} ${n(y2)}`,
      `H ${n(x2)}`,
    ].join(' ');
  };

  const claseCurso = (curso) => {
    const estado = (estadoCursos[curso] || 'no_cursado').replace('_', '-');
    let cls = `malla-curso ${estado}`;
    if (seleccionado === curso) cls += ' sel';
    if (relacionados && !relacionados.has(curso)) cls += ' dim';
    return cls;
  };

  const estiloLinea = (l) => {
    const enCamino = relacionados && relacionados.has(l.pre) && relacionados.has(l.dest);
    const aprobado = estadoCursos[l.pre] === 'aprobado';
    if (relacionados) {
      return {
        stroke: enCamino ? 'var(--shell-accent)' : 'var(--shell-text-muted)',
        opacity: enCamino ? 1 : 0.06,
        marker: enCamino ? 'flecha-accent' : 'flecha-gris',
      };
    }
    // Sin nada seleccionado se ven todas a la vez, asi que van bajitas: son el
    // fondo del mapa, no el contenido. Al elegir un curso, su camino sube a 1.
    return {
      stroke: aprobado ? 'var(--shell-green-text)' : 'var(--shell-text-muted)',
      opacity: aprobado ? 0.55 : 0.22,
      marker: aprobado ? 'flecha-verde' : 'flecha-gris',
    };
  };

  return (
    <Sidebar active="dashboard" sinNav>
      <header className="page-head">
        <div className="malla-titulo">
          <Link to="/home" className="btn"><ArrowLeft size={16} /> Dashboard</Link>
          <div>
            <h1>Mapa Curricular</h1>
            <p className="malla-carrera">{carrera}</p>
          </div>
        </div>
      </header>

      {malla ? (
        <>
          {seleccionado && (
            <div className="malla-panel">
              <div className="malla-panel-curso">
                <strong>{seleccionado}</strong>
                <Link to={`/curso/${encodeURIComponent(seleccionado)}`} className="malla-panel-link">
                  Ver materiales
                </Link>
              </div>
              <div className="malla-panel-btns">
                {[['aprobado', 'Aprobado'], ['en_curso', 'En curso'], ['no_cursado', 'No cursado']].map(([val, txt]) => (
                  <button
                    key={val}
                    className={(estadoCursos[seleccionado] || 'no_cursado') === val ? 'activo' : ''}
                    onClick={() => cambiarEstadoCurso(seleccionado, val)}
                  >
                    {txt}
                  </button>
                ))}
              </div>
              <button className="malla-panel-cerrar" onClick={() => setSeleccionado(null)}>✕</button>
            </div>
          )}

          {/* El grid ya no comprime los ciclos hasta que quepan todos: cada
              columna tiene un ancho minimo legible y el mapa se desliza en
              horizontal. Con 10 ciclos en un telefono, "que entre todo" queria
              decir columnas de 30px. */}
          <div
            className="malla-grid"
            ref={gridRef}
            style={{ gridTemplateColumns: `repeat(${ciclos.length}, minmax(132px, 1fr))` }}
            onClick={() => setSeleccionado(null)}
            role="group"
            aria-label={`Mapa curricular de ${carrera}, ${ciclos.length} ciclos`}
          >
            <svg className="malla-svg" width={size.w} height={size.h}>
              <defs>
                <marker id="flecha-gris" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="var(--shell-text-muted)" />
                </marker>
                <marker id="flecha-verde" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="var(--shell-green-text)" />
                </marker>
                <marker id="flecha-accent" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="var(--shell-accent)" />
                </marker>
              </defs>
              {lineas.map((l) => {
                const s = estiloLinea(l);
                return (
                  <path
                    key={l.key}
                    d={construirPath(l)}
                    fill="none"
                    stroke={s.stroke}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    opacity={s.opacity}
                    markerEnd={`url(#${s.marker})`}
                  />
                );
              })}
            </svg>

            {ciclos.map((ciclo) => (
              <div key={ciclo} className="malla-columna">
                <h4>Ciclo {ciclo}</h4>
                {malla[ciclo].map((curso) => (
                  <div
                    key={curso}
                    ref={(el) => {
                      // Al desmontar (cambio de carrera) React llama con null:
                      // sin borrar la entrada quedaria un nodo suelto en
                      // cursoRefs y calcular() trazaria flechas hacia
                      // coordenadas viejas.
                      if (el) cursoRefs.current[curso] = el;
                      else delete cursoRefs.current[curso];
                    }}
                    className={claseCurso(curso)}
                    onClick={(e) => { e.stopPropagation(); setSeleccionado((prev) => (prev === curso ? null : curso)); }}
                  >
                    {curso}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="malla-leyenda">
            <span><i className="dot aprobado" /> Aprobado</span>
            <span><i className="dot en-curso" /> En curso</span>
            <span><i className="dot no-cursado" /> No cursado</span>
            <span className="leyenda-flecha">→ prerrequisito · toca un curso para ver su camino</span>
            {/* Solo visible en movil: ahi el mapa nunca entra entero y sin
                aviso no es obvio que se pueda arrastrar de lado. */}
            <span className="leyenda-desliza">Desliza de lado para ver los demas ciclos</span>
          </div>
        </>
      ) : (
        <div className="card">
          {/* obtenerMallaCompleta solo devuelve null cuando la carrera no existe
              en los datos, y el unico caso real es que aun no eligieron una. */}
          <p className="vacio">
            Todavia no elegiste tu carrera, asi que no podemos armar tu mapa curricular.
          </p>
          <Link to="/carrera" className="btn primary vacio-accion">Elegir carrera</Link>
        </div>
      )}
    </Sidebar>
  );
}
