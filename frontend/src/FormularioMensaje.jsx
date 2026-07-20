import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Sidebar from './Sidebar.jsx';
import { useUser } from './useUser';
import { faltaLaTabla, sesionInvalida } from './erroresSupabase';

// Feedback y Reportar son la misma pantalla con otros textos: un selector de
// tipo, un textarea y un insert en Supabase. Estaban duplicadas linea por
// linea, incluido el manejo de "la tabla no existe todavia", asi que cualquier
// arreglo habia que hacerlo dos veces.
//
// `extra` son las columnas propias de cada tabla (Reportar guarda la carrera).

export default function FormularioMensaje({
  active,
  titulo,
  intro,
  tabla,
  tipos,
  tipoInicial,
  etiquetaTipo,
  etiquetaMensaje,
  placeholder,
  vacio,
  textoBoton,
  textoEnviando,
  exito,
  icono: Icono,
  extra,
}) {
  const navigate = useNavigate();
  const { user: usuario, carrera } = useUser();

  const [tipo, setTipo] = useState(tipoInicial);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null); // { clase, texto }

  const manejarEnviar = async (e) => {
    e.preventDefault();
    if (!mensaje.trim()) {
      setAviso({ clase: 'error', texto: vacio });
      return;
    }
    setEnviando(true);
    setAviso(null);

    const { error } = await supabase.from(tabla).insert({
      user_id: usuario?.id || null,
      email: usuario?.email || null,
      tipo,
      mensaje: mensaje.trim(),
      ...(extra ? extra({ carrera }) : {}),
    });

    if (error) {
      if (sesionInvalida(error)) {
        localStorage.removeItem('user');
        navigate('/');
        return;
      }
      setAviso({
        clase: 'error',
        texto: faltaLaTabla(error)
          ? `La tabla ${tabla} aun no existe en Supabase. Corre el SQL de supabase/tablas.sql.`
          : 'No se pudo enviar: ' + error.message,
      });
      setEnviando(false);
      return;
    }

    setMensaje('');
    setAviso({ clase: 'success', texto: exito });
    setEnviando(false);
  };

  return (
    <Sidebar active={active}>
      <header className="topbar">
        <h1>{titulo}</h1>
      </header>
      <p className="page-intro">{intro}</p>

      <section className="card form-estrecho">
        <form onSubmit={manejarEnviar} className="form-col">
          <label className="form-label">
            {etiquetaTipo}
            <select className="form-input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {tipos.map((t) => (
                <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
              ))}
            </select>
          </label>

          <label className="form-label">
            {etiquetaMensaje}
            <textarea
              className="form-input"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder={placeholder}
              rows={5}
            />
          </label>

          <button type="submit" className="btn primary" disabled={enviando}>
            <Icono size={16} /> {enviando ? textoEnviando : textoBoton}
          </button>
        </form>

        {aviso && <p className={`auth-msg ${aviso.clase}`}>{aviso.texto}</p>}
      </section>
    </Sidebar>
  );
}
