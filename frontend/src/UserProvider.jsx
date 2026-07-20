import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import { UserContext } from './useUser';

// Fuente unica del estado del usuario. Antes cada pagina parseaba
// localStorage['user'] por su cuenta y guardaba con su propio updateUser, asi
// que un cambio en el Mapa no se reflejaba en el Dashboard hasta recargar.
//
// Aca el `metadata` local es la verdad optimista de la sesion: la UI lo lee y
// lo escribe al instante, y los cambios se acumulan en `pendienteRef` para
// mandarlos a Supabase en UNA request (ver `programarGuardado`).

const MS_DEBOUNCE = 800;

function leerEspejo() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

// Compatibilidad con el modelo anterior, que solo tenia aprobado/no cursado.
function estadoCursosDesde(metadata) {
  if (metadata?.estadoCursos) return metadata.estadoCursos;
  const previo = {};
  (metadata?.cursosAprobados || []).forEach((curso) => {
    previo[curso] = 'aprobado';
  });
  return previo;
}

function normalizar(user) {
  const metadata = user?.user_metadata || {};
  return { ...metadata, estadoCursos: estadoCursosDesde(metadata) };
}

export function UserProvider({ children }) {
  const espejo = leerEspejo();
  // undefined = todavia verificando la sesion contra Supabase.
  const [user, setUser] = useState(espejo ? undefined : null);
  const [metadata, setMetadata] = useState(() => normalizar(espejo));
  // 'limpio' | 'guardando' | 'error'
  const [guardado, setGuardado] = useState('limpio');

  const pendienteRef = useRef({});
  const timerRef = useRef(null);
  const colaRef = useRef(Promise.resolve());

  const cerrarPorSesion = useCallback(() => {
    pendienteRef.current = {};
    localStorage.removeItem('user');
    setUser(null);
    setMetadata({ estadoCursos: {} });
  }, []);

  // Manda TODO lo acumulado en una sola llamada. Las llamadas se encadenan en
  // `colaRef` para que dos flushes seguidos no se pisen.
  const guardarAhora = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = null;

    colaRef.current = colaRef.current.then(async () => {
      const cambios = pendienteRef.current;
      if (Object.keys(cambios).length === 0) return;
      pendienteRef.current = {}; // lo que llegue durante el request va al siguiente lote
      setGuardado('guardando');

      const { data, error } = await supabase.auth.updateUser({ data: cambios });

      if (error) {
        if (error.message.toLowerCase().includes('session')) {
          cerrarPorSesion();
          return;
        }
        setGuardado('error');
        return;
      }

      // Solo se refresca la identidad: `metadata` local puede tener ediciones
      // mas nuevas que la respuesta, asi que no se sobrescribe.
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      setGuardado('limpio');
    });

    return colaRef.current;
  }, [cerrarPorSesion]);

  // Aplica el cambio en local ya mismo y agenda el guardado agrupado.
  const actualizarMetadata = useCallback((parcial, { inmediato = false } = {}) => {
    setMetadata((previo) => ({ ...previo, ...parcial }));
    pendienteRef.current = { ...pendienteRef.current, ...parcial };

    if (inmediato) return guardarAhora();

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(guardarAhora, MS_DEBOUNCE);
    return Promise.resolve();
  }, [guardarAhora]);

  const cambiarEstadoCurso = useCallback((curso, nuevoEstado) => {
    setMetadata((previo) => {
      const estadoCursos = { ...previo.estadoCursos };
      if (nuevoEstado === 'no_cursado') delete estadoCursos[curso];
      else estadoCursos[curso] = nuevoEstado;

      pendienteRef.current = { ...pendienteRef.current, estadoCursos };
      return { ...previo, estadoCursos };
    });

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(guardarAhora, MS_DEBOUNCE);
  }, [guardarAhora]);

  const cerrarSesion = useCallback(async () => {
    clearTimeout(timerRef.current);
    pendienteRef.current = {};
    try { await supabase.auth.signOut(); } catch { /* la sesion local se limpia igual */ }
    localStorage.removeItem('user');
    setUser(null);
    setMetadata({ estadoCursos: {} });
  }, []);

  useEffect(() => {
    let vigente = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!vigente) return;
      const nuevo = data.session?.user ?? null;
      setUser(nuevo);
      if (nuevo) {
        setMetadata(normalizar(nuevo));
        localStorage.setItem('user', JSON.stringify(nuevo));
      } else {
        localStorage.removeItem('user');
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((evento, sesion) => {
      if (!vigente) return;
      if (!sesion) {
        cerrarPorSesion();
        return;
      }
      setUser(sesion.user);
      localStorage.setItem('user', JSON.stringify(sesion.user));
      // USER_UPDATED es el eco de nuestro propio guardado: reseedear metadata
      // ahi pisaria ediciones que el usuario hizo mientras volaba el request.
      if (evento !== 'USER_UPDATED') setMetadata(normalizar(sesion.user));
    });

    return () => {
      vigente = false;
      sub.subscription.unsubscribe();
    };
  }, [cerrarPorSesion]);

  // Si cierran la pestania con un lote agendado, se manda antes de salir.
  useEffect(() => {
    const alSalir = () => {
      if (timerRef.current) guardarAhora();
    };
    // El listener de visibilitychange se declara aparte para poder quitarlo:
    // antes era una funcion anonima, asi que el cleanup solo desmontaba
    // pagehide y cada re-registro del efecto dejaba un listener vivo.
    const alOcultar = () => {
      if (document.visibilityState === 'hidden') alSalir();
    };

    window.addEventListener('pagehide', alSalir);
    document.addEventListener('visibilitychange', alOcultar);
    return () => {
      window.removeEventListener('pagehide', alSalir);
      document.removeEventListener('visibilitychange', alOcultar);
    };
  }, [guardarAhora]);

  const valor = {
    user,
    metadata,
    carrera: metadata.carrera || '',
    nombre: metadata.nombre || '',
    ciclo: metadata.ciclo || '',
    estadoCursos: metadata.estadoCursos || {},
    cargandoSesion: user === undefined,
    guardado,
    actualizarMetadata,
    cambiarEstadoCurso,
    guardarAhora,
    cerrarSesion,
  };

  return <UserContext.Provider value={valor}>{children}</UserContext.Provider>;
}
