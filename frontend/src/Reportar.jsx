import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Sidebar from './Sidebar.jsx';
import { AlertTriangle } from 'lucide-react';

const TIPOS = [
  { valor: 'bug', etiqueta: 'Error o falla de la app' },
  { valor: 'dato_malla', etiqueta: 'Dato incorrecto en una malla' },
  { valor: 'curso', etiqueta: 'Problema con un curso' },
  { valor: 'otro', etiqueta: 'Otro' },
];

export default function Reportar() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('user') || 'null');
  const carrera = usuario?.user_metadata?.carrera || null;

  const [tipo, setTipo] = useState('bug');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null); // { clase, texto }

  const manejarEnviar = async (e) => {
    e.preventDefault();
    if (!mensaje.trim()) {
      setAviso({ clase: 'error', texto: 'Describe el problema antes de enviar.' });
      return;
    }
    setEnviando(true);
    setAviso(null);

    const { error } = await supabase.from('reportes').insert({
      user_id: usuario?.id || null,
      email: usuario?.email || null,
      carrera,
      tipo,
      mensaje: mensaje.trim(),
    });

    if (error) {
      if (error.message.toLowerCase().includes('session')) {
        localStorage.removeItem('user');
        navigate('/');
        return;
      }
      const faltaTabla = error.code === '42P01' || error.message.toLowerCase().includes('does not exist');
      setAviso({
        clase: 'error',
        texto: faltaTabla
          ? 'La tabla de reportes aun no existe en Supabase. Corre el SQL de supabase/tablas.sql.'
          : 'No se pudo enviar: ' + error.message,
      });
      setEnviando(false);
      return;
    }

    setMensaje('');
    setAviso({ clase: 'success', texto: 'Reporte enviado. Gracias por avisarnos.' });
    setEnviando(false);
  };

  return (
    <Sidebar active="reportar">
      <header className="topbar">
        <h1>Reportar un problema</h1>
      </header>
      <p style={{ marginBottom: '20px', color: 'var(--shell-text-muted)' }}>
        Encontraste un error o un dato mal puesto en una malla? Cuentanos para corregirlo.
      </p>

      <section className="card" style={{ maxWidth: '520px' }}>
        <form onSubmit={manejarEnviar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ fontWeight: 600, fontSize: '14px' }}>
            Tipo de problema
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="estado-curso-select"
              style={{ display: 'block', width: '100%', marginTop: '6px', padding: '10px', fontSize: '15px' }}
            >
              {TIPOS.map((t) => (
                <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
              ))}
            </select>
          </label>

          <label style={{ fontWeight: 600, fontSize: '14px' }}>
            Descripcion
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Describe el problema con el mayor detalle posible..."
              rows={5}
              className="estado-curso-select"
              style={{
                display: 'block',
                width: '100%',
                marginTop: '6px',
                padding: '10px',
                fontSize: '15px',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </label>

          <button type="submit" className="btn primary" disabled={enviando} style={{ justifyContent: 'center' }}>
            <AlertTriangle size={16} /> {enviando ? 'Enviando...' : 'Enviar reporte'}
          </button>
        </form>

        {aviso && (
          <p className={`auth-msg ${aviso.clase}`} style={{ marginBottom: 0 }}>
            {aviso.texto}
          </p>
        )}
      </section>
    </Sidebar>
  );
}
