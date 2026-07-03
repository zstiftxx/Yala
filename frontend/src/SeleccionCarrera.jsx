import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { carreras } from './data/cursosGenerales';

export default function SeleccionCarrera() {
  const navigate = useNavigate();
  const [carrera, setCarrera] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);

  const manejarContinuar = async (e) => {
    e.preventDefault();
    if (!carrera) {
      setMensaje('Selecciona una carrera para continuar.');
      return;
    }

    setGuardando(true);
    setMensaje('');

    const { data, error } = await supabase.auth.updateUser({
      data: { carrera },
    });

    if (error) {
      if (error.message.toLowerCase().includes('session')) {
        // La sesión ya no es válida (expiró o nunca se confirmó el correo)
        localStorage.removeItem('user');
        navigate('/');
        return;
      }
      setMensaje('Error: ' + error.message);
      setGuardando(false);
      return;
    }

    localStorage.setItem('user', JSON.stringify(data.user));
    navigate('/home');
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>¿Qué carrera estás estudiando?</h2>
      <p>Esto nos ayuda a mostrarte los cursos y apuntes correctos.</p>

      <form
        onSubmit={manejarContinuar}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginTop: '20px' }}
      >
        <select
          value={carrera}
          onChange={(e) => setCarrera(e.target.value)}
          style={{ padding: '10px', width: '300px', fontSize: '16px' }}
        >
          <option value="">Selecciona tu carrera...</option>
          {carreras.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button
          type="submit"
          disabled={guardando}
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#36b37e', color: '#fff', fontWeight: 'bold', border: 'none' }}
        >
          {guardando ? 'Guardando...' : 'Continuar'}
        </button>
      </form>

      {mensaje && <p style={{ marginTop: '20px', color: '#ffb7b2' }}>{mensaje}</p>}
    </div>
  );
}
