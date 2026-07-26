import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import RespuestaIA from './RespuestaIA.jsx';
import { useUser } from './useUser';
import { obtenerMallaCompleta } from './data/mallaCurricular';
import { preguntarAlAsistente, consultasDeHoy } from './asistente';
import {
  Sparkles,
  Upload,
  FileText,
  X,
  Send,
  Copy,
  Check,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

// Atajos: la pantalla en blanco es el problema de todo asistente. Estos tres
// cubren lo que se le pide de verdad a un examen viejo.
const SUGERENCIAS = [
  {
    etiqueta: 'Ejercicios parecidos',
    texto:
      'Genera 5 ejercicios del mismo nivel y estilo que este material. Ponlos primero todos juntos y las soluciones al final, para poder intentarlos antes de verlas.',
  },
  {
    etiqueta: 'Explicame un problema',
    texto:
      'Explicame el problema 1 paso a paso: que dato entrega cada parte del enunciado, que formula aplica y por que.',
  },
  {
    etiqueta: 'Que temas entran',
    texto:
      'Haz una lista de los temas que evalua este material y, en cada uno, que tengo que saber hacer para resolverlo.',
  },
];

function pesoLegible(bytes) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function Asistente() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { carrera } = useUser();

  const [archivo, setArchivo] = useState(null);
  const [pregunta, setPregunta] = useState('');
  const [curso, setCurso] = useState(params.get('curso') || '');
  const [enviando, setEnviando] = useState(false);
  const [respuesta, setRespuesta] = useState(null);
  const [error, setError] = useState(null);
  const [encima, setEncima] = useState(false);
  const [copiado, setCopiado] = useState(false);
  // El limite no se conoce hasta la primera respuesta: lo decide la Edge
  // Function (LIMITE_DIARIO_IA) y el navegador no tiene por que saberlo.
  const [cuota, setCuota] = useState({ usadas: 0, limite: null });

  const inputArchivo = useRef(null);
  const zonaRespuesta = useRef(null);

  const malla = carrera ? obtenerMallaCompleta(carrera) : null;

  useEffect(() => {
    consultasDeHoy().then(({ usadas }) => setCuota((c) => ({ ...c, usadas })));
  }, []);

  const elegirArchivo = useCallback((f) => {
    if (!f) return;
    setArchivo(f);
    setError(null);
  }, []);

  const soltar = (e) => {
    e.preventDefault();
    setEncima(false);
    elegirArchivo(e.dataTransfer.files?.[0]);
  };

  const quitarArchivo = () => {
    setArchivo(null);
    // Sin esto, volver a elegir el MISMO archivo no dispara onChange y parece
    // que el boton no hace nada.
    if (inputArchivo.current) inputArchivo.current.value = '';
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;

    setEnviando(true);
    setError(null);
    setRespuesta(null);

    const res = await preguntarAlAsistente({ pregunta, archivo, curso: curso || undefined });
    setEnviando(false);

    if (res.error) {
      if (res.error.sesion) {
        localStorage.removeItem('user');
        navigate('/');
        return;
      }
      setError(res.error.mensaje);
      // El 429 de la cuota si trae el contador: sirve para que el aviso de
      // "te quedan N" quede al dia aunque la consulta no haya salido.
      if (res.usadas != null) setCuota({ usadas: res.usadas, limite: res.limite ?? null });
      return;
    }

    setRespuesta(res);
    setCuota({ usadas: res.usadas ?? cuota.usadas + 1, limite: res.limite ?? null });
    // La respuesta aparece debajo del formulario; en movil queda fuera de
    // pantalla y sin esto parece que no paso nada.
    requestAnimationFrame(() => {
      zonaRespuesta.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(respuesta.texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* sin permiso de portapapeles: no hay nada que avisar */
    }
  };

  const restantes = cuota.limite != null ? Math.max(cuota.limite - cuota.usadas, 0) : null;

  return (
    <Sidebar active="asistente">
      <header className="page-head">
        <div className="page-head-texto">
          <p className="page-eyebrow">Asistente de estudio</p>
          <h1>Practica con tu propio material</h1>
          <p className="page-intro">
            Sube un examen, una practica o tus apuntes y pide lo que necesites: ejercicios
            parecidos, una explicacion paso a paso o un repaso de los temas.
          </p>
        </div>
        <div className="page-head-acciones">
          <span className="cuota-ia" title="Cada consulta gasta una del dia">
            {restantes != null
              ? `Te quedan ${restantes} de ${cuota.limite} hoy`
              : `Llevas ${cuota.usadas} consultas hoy`}
          </span>
        </div>
      </header>

      <section className="card">
        <form onSubmit={enviar}>
          {/* ---- Material ---- */}
          {!archivo ? (
            <label
              className={`zona-archivo${encima ? ' encima' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setEncima(true);
              }}
              onDragLeave={() => setEncima(false)}
              onDrop={soltar}
            >
              {/* El input NO va con `hidden`: un input escondido asi no recibe
                  foco y quien navega con teclado se queda sin poder abrir el
                  selector. Se tapa por CSS (.input-archivo) y la zona entera
                  se ilumina con :focus-within. */}
              <input
                ref={inputArchivo}
                className="input-archivo"
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => elegirArchivo(e.target.files?.[0])}
              />
              <Upload size={22} />
              <span className="zona-archivo-titulo">Arrastra tu PDF o imagen, o haz clic</span>
              <span className="zona-archivo-sub">PDF, JPG, PNG, GIF o WebP · maximo 6 MB</span>
            </label>
          ) : (
            <div className="archivo-elegido">
              <FileText size={18} />
              <div className="archivo-datos">
                <span className="archivo-nombre">{archivo.name}</span>
                <span className="archivo-peso">{pesoLegible(archivo.size)}</span>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={quitarArchivo}
                title="Quitar archivo"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <p className="nota-privacidad">
            <ShieldAlert size={14} />
            Tu material lo procesa un servicio de IA externo. No subas nada con datos
            personales tuyos o de terceros.
          </p>

          {/* ---- Pregunta ---- */}
          <div className="filtros sugerencias">
            {SUGERENCIAS.map((s) => (
              <button
                key={s.etiqueta}
                type="button"
                className="chip"
                onClick={() => setPregunta(s.texto)}
              >
                {s.etiqueta}
              </button>
            ))}
          </div>

          <label className="form-label">
            Que quieres que haga
            <textarea
              className="form-input area-pregunta"
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              rows={4}
              placeholder="Ej: explicame el problema 3 del examen paso a paso"
            />
          </label>

          <div className="asistente-envio">
            {malla && (
              <label className="form-label curso-opcional">
                Curso (opcional)
                <select
                  className="form-input"
                  value={curso}
                  onChange={(e) => setCurso(e.target.value)}
                >
                  <option value="">Sin curso</option>
                  {Object.entries(malla)
                    .sort((a, b) => Number(a[0]) - Number(b[0]))
                    .map(([ciclo, cursos]) => (
                      <optgroup key={ciclo} label={`Ciclo ${ciclo}`}>
                        {cursos.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                </select>
              </label>
            )}

            <button
              type="submit"
              className="btn primary"
              disabled={enviando || !pregunta.trim()}
            >
              {enviando ? <Loader2 size={16} className="girando" /> : <Send size={16} />}
              {enviando ? 'Pensando...' : 'Preguntar'}
            </button>
          </div>

          {error && <p className="auth-msg error">{error}</p>}
        </form>
      </section>

      <div ref={zonaRespuesta} aria-live="polite">
        {enviando && (
          <section className="card respuesta-card">
            <p className="vacio">
              Leyendo {archivo ? 'tu material' : 'tu pregunta'} y preparando la respuesta. Con un
              PDF de varias paginas puede tardar medio minuto.
            </p>
            <div className="esqueleto" />
            <div className="esqueleto corto" />
            <div className="esqueleto" />
          </section>
        )}

        {respuesta && !enviando && (
          <section className="card respuesta-card">
            <div className="materiales-head">
              <h3 className="card-titulo">
                <Sparkles size={16} /> Respuesta
              </h3>
              <button type="button" className="btn" onClick={copiar}>
                {copiado ? <Check size={16} /> : <Copy size={16} />}
                {copiado ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            <RespuestaIA texto={respuesta.texto} />

            <p className="respuesta-pie">
              Lo genera una IA a partir de tu material: revisa los resultados antes de darlos por
              buenos. Puedes seguir preguntando sobre el mismo archivo sin volver a subirlo.
            </p>
          </section>
        )}
      </div>
    </Sidebar>
  );
}
