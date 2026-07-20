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
    const puntoDerecho = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.right - base.left + grid.scrollLeft, y: r.top - base.top + grid.scrollTop + r.height / 2 };
    };
    const puntoIzquierdo = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left - base.left + grid.scrollLeft, y: r.top - base.top + grid.scrollTop + r.height / 2 };
    };

    const nuevas = [];
    Object.entries(prereqs).forEach(([curso, lista]) => {
      const destino = cursoRefs.current[curso];
      if (!destino) return;
      const d = puntoIzquierdo(destino);
      lista.forEach((pre) => {
        const origen = cursoRefs.current[pre];
        if (!origen) return;
        const o = puntoDerecho(origen);
        nuevas.push({ key: `${pre}->${curso}`, pre, dest: curso, x1: o.x, y1: o.y, x2: d.x, y2: d.y });
      });
    });

    setLineas(nuevas);
    setSize({ w: grid.scrollWidth, h: grid.scrollHeight });
  }, [prereqs]);

  useLayoutEffect(() => {
    calcular();
    const t = setTimeout(calcular, 300);
    window.addEventListener('resize', calcular);
    return () => { clearTimeout(t); window.removeEventListener('resize', calcular); };
  }, [calcular, carrera]);

  const construirPath = ({ x1, y1, x2, y2 }) => {
    const dx = Math.max(24, (x2 - x1) * 0.4);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
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
        opacity: enCamino ? 1 : 0.08,
        marker: enCamino ? 'flecha-accent' : 'flecha-gris',
      };
    }
    return {
      stroke: aprobado ? 'var(--shell-green-text)' : 'var(--shell-text-muted)',
      opacity: aprobado ? 0.9 : 0.4,
      marker: aprobado ? 'flecha-verde' : 'flecha-gris',
    };
  };

  return (
    <Sidebar active="dashboard" sinNav>
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/home" className="btn"><ArrowLeft size={16} /> Dashboard</Link>
          <div>
            <h1 style={{ fontSize: '20px' }}>Mapa Curricular</h1>
            <p style={{ color: 'var(--shell-text-muted)', fontSize: '13px' }}>{carrera}</p>
          </div>
        </div>
      </header>

      {malla ? (
        <>
          {seleccionado && (
            <div className="malla-panel">
              <strong>{seleccionado}</strong>
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

          <div
            className="malla-grid"
            ref={gridRef}
            style={{ gridTemplateColumns: `repeat(${ciclos.length}, minmax(0, 1fr))` }}
            onClick={() => setSeleccionado(null)}
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
                    strokeDasharray="4 4"
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
                    ref={(el) => { cursoRefs.current[curso] = el; }}
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
            <span className="leyenda-flecha">— — → prerrequisito · haz clic en un curso para ver su camino</span>
          </div>
        </>
      ) : (
        <div className="card">
          <p>Todavía no tenemos la malla completa de {carrera}. Por ahora puedes ver tus cursos generales en el Dashboard.</p>
        </div>
      )}
    </Sidebar>
  );
}
