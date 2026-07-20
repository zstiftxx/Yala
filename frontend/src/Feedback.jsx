import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Sidebar from './Sidebar.jsx';
import { useUser } from './useUser';
import { Send } from 'lucide-react';

const TIPOS = [
  { valor: 'sugerencia', etiqueta: 'Sugerencia' },
  { valor: 'idea', etiqueta: 'Idea nueva' },
  { valor: 'queja', etiqueta: 'Queja' },
  { valor: 'otro', etiqueta: 'Otro' },
];

export default function Feedback() {
  const navigate = useNavigate();
  const { user: usuario } = useUser();

  const [tipo, setTipo] = useState('sugerencia');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null); // { clase, texto }

  const manejarEnviar = async (e) => {
    e.preventDefault();
    if (!mensaje.trim()) {
      setAviso({ clase: 'error', texto: 'Escribe tu mensaje antes de enviar.' });
      return;
    }
    setEnviando(true);
    setAviso(null);

    const { error } = await supabase.from('feedback').insert({
      user_id: usuario?.id || null,
      email: usuario?.email || null,
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
          ? 'La tabla de feedback aun no existe en Supabase. Corre el SQL de supabase/tablas.sql.'
          : 'No se pudo enviar: ' + error.message,
      });
      setEnviando(false);
      return;
    }

    setMensaje('');
    setAviso({ clase: 'success', texto: 'Gracias por tu feedback. Lo recibimos.' });
    setEnviando(false);
  };

  return (
    <Sidebar active="feedback">
      <header className="topbar">
        <h1>Feedback</h1>
      </header>
      <p style={{ marginBottom: '20px', color: 'var(--shell-text-muted)' }}>
        Cuentanos que te parece la app, que te gustaria ver o que podriamos mejorar.
      </p>

      <section className="card" style={{ maxWidth: '520px' }}>
        <form onSubmit={manejarEnviar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ fontWeight: 600, fontSize: '14px' }}>
            Tipo
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
            Mensaje
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribe tu comentario..."
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
            <Send size={16} /> {enviando ? 'Enviando...' : 'Enviar feedback'}
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
