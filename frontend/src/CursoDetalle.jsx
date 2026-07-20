import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { useUser } from './useUser';
import { cicloDeCurso, obtenerPrerequisitos } from './data/mallaCurricular';
import {
  TIPOS_MATERIAL,
  etiquetaTipo,
  listarMateriales,
  crearMaterial,
  borrarMaterial,
  normalizarUrl,
} from './materiales';
import { ArrowLeft, ExternalLink, Plus, Trash2, FileText, X } from 'lucide-react';

const FILTROS = [{ valor: 'todos', etiqueta: 'Todos' }, ...TIPOS_MATERIAL];

function fechaCorta(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

// Solo el host: el titulo ya dice que es, y la URL completa de un Drive es
// ilegible en una tarjeta.
function dominio(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function CursoDetalle() {
  const { curso } = useParams();
  const nombreCurso = decodeURIComponent(curso || '');
  const { carrera, estadoCursos, cambiarEstadoCurso } = useUser();

  const ciclo = cicloDeCurso(carrera, nombreCurso);
  const prerequisitos = obtenerPrerequisitos(carrera)[nombreCurso] || [];
  const estado = estadoCursos[nombreCurso] || 'no_cursado';

  return (
    <Sidebar active="mis-cursos">
      <header className="topbar">
        <div>
          <Link to="/mis-cursos" className="volver">
            <ArrowLeft size={15} /> Mis Cursos
          </Link>
          <h1>{nombreCurso}</h1>
        </div>
        <div className="top-actions">
          <select
            value={estado}
            onChange={(e) => cambiarEstadoCurso(nombreCurso, e.target.value)}
            className="estado-curso-select"
            aria-label="Estado del curso"
          >
            <option value="no_cursado">No cursado</option>
            <option value="en_curso">En curso</option>
            <option value="aprobado">Aprobado</option>
          </select>
        </div>
      </header>

      <div className="curso-chips">
        {ciclo ? (
          <span className="disponibles-ciclo">Ciclo {ciclo}</span>
        ) : (
          <span className="disponibles-ciclo muted">Fuera de tu malla</span>
        )}
        {prerequisitos.length > 0 && (
          <span className="curso-prereqs">Requiere: {prerequisitos.join(', ')}</span>
        )}
      </div>

      {/* `key` remonta la lista al pasar de un curso a otro: sin eso quedarian
          visibles los materiales del curso anterior mientras carga el nuevo. */}
      <Materiales key={nombreCurso} curso={nombreCurso} />
    </Sidebar>
  );
}

function Materiales({ curso }) {
  const navigate = useNavigate();
  const { user, carrera } = useUser();

  const [materiales, setMateriales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [abierto, setAbierto] = useState(false);

  const manejarError = useCallback(
    (err) => {
      if (err.sesion) {
        localStorage.removeItem('user');
        navigate('/');
        return;
      }
      setError(err.mensaje);
    },
    [navigate],
  );

  useEffect(() => {
    let vigente = true;
    listarMateriales(curso).then((res) => {
      if (!vigente) return;
      if (res.error) manejarError(res.error);
      else setMateriales(res.materiales);
      setCargando(false);
    });
    return () => {
      vigente = false;
    };
  }, [curso, manejarError]);

  const alCrear = (material) => {
    setMateriales((previos) => [material, ...previos]);
    setAbierto(false);
  };

  const eliminar = async (id) => {
    const previos = materiales;
    setMateriales((lista) => lista.filter((m) => m.id !== id)); // optimista
    const { error: err } = await borrarMaterial(id);
    if (err) {
      setMateriales(previos);
      manejarError(err);
    }
  };

  const visibles = filtro === 'todos' ? materiales : materiales.filter((m) => m.tipo === filtro);

  return (
    <section className="card">
      <div className="materiales-head">
        <h3>
          <FileText size={16} /> Materiales
        </h3>
        <button className="btn primary" onClick={() => setAbierto((v) => !v)}>
          {abierto ? <X size={16} /> : <Plus size={16} />}
          {abierto ? 'Cancelar' : 'Agregar material'}
        </button>
      </div>
      <p className="page-intro">
        Apuntes, resumenes y examenes que comparten los estudiantes. Todo es un enlace (Drive,
        Notion, lo que uses).
      </p>

      {abierto && (
        <FormularioMaterial
          curso={curso}
          carrera={carrera}
          usuario={user}
          onCreado={alCrear}
          onError={manejarError}
        />
      )}

      <div className="filtros">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            className={`chip${filtro === f.valor ? ' activo' : ''}`}
            onClick={() => setFiltro(f.valor)}
          >
            {f.etiqueta}
          </button>
        ))}
      </div>

      {error && <p className="auth-msg error">{error}</p>}

      {cargando && <p className="vacio">Cargando materiales...</p>}

      {!cargando && !error && visibles.length === 0 && (
        <p className="vacio">
          {materiales.length === 0
            ? 'Todavia no hay materiales de este curso. Se el primero en compartir uno.'
            : 'Ningun material de ese tipo por ahora.'}
        </p>
      )}

      {visibles.length > 0 && (
        <div className="list">
          {visibles.map((m) => (
            <div key={m.id} className="list-item material">
              <div className="material-info">
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="material-titulo"
                >
                  {m.titulo} <ExternalLink size={13} />
                </a>
                <div className="material-meta">
                  <span className="chip estatico">{etiquetaTipo(m.tipo)}</span>
                  {m.ciclo && <span>{m.ciclo}</span>}
                  <span>{dominio(m.url)}</span>
                  <span>{fechaCorta(m.created_at)}</span>
                  {!m.aprobado && <span className="pendiente">Pendiente de revision</span>}
                </div>
              </div>
              {m.user_id === user?.id && (
                <button
                  className="icon-btn"
                  onClick={() => eliminar(m.id)}
                  title="Eliminar material"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FormularioMaterial({ curso, carrera, usuario, onCreado, onError }) {
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('apunte');
  const [url, setUrl] = useState('');
  const [ciclo, setCiclo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const enviar = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setAviso('Ponle un titulo al material.');
      return;
    }
    const urlValida = normalizarUrl(url);
    if (!urlValida) {
      setAviso('El enlace no es valido. Debe empezar con http:// o https://');
      return;
    }

    setEnviando(true);
    setAviso(null);
    const { material, error } = await crearMaterial({
      usuario,
      carrera,
      curso,
      tipo,
      titulo,
      url: urlValida,
      ciclo,
    });
    setEnviando(false);

    if (error) {
      if (error.sesion) return onError(error);
      setAviso(error.mensaje);
      return;
    }
    onCreado(material);
  };

  return (
    <form onSubmit={enviar} className="form-material">
      <label className="form-label">
        Titulo
        <input
          className="form-input"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej: Resumen del parcial 2025-2"
        />
      </label>

      <div className="form-fila">
        <label className="form-label">
          Tipo
          <select className="form-input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS_MATERIAL.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.etiqueta}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Ciclo (opcional)
          <input
            className="form-input"
            value={ciclo}
            onChange={(e) => setCiclo(e.target.value)}
            placeholder="2025-1"
          />
        </label>
      </div>

      <label className="form-label">
        Enlace
        <input
          className="form-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://drive.google.com/..."
        />
      </label>

      <button type="submit" className="btn primary" disabled={enviando}>
        <Plus size={16} /> {enviando ? 'Guardando...' : 'Compartir material'}
      </button>

      {aviso && <p className="auth-msg error">{aviso}</p>}
    </form>
  );
}
