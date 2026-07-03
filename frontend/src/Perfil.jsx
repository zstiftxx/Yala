import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Sidebar from './Sidebar.jsx';
import { carreras } from './data/cursosGenerales';

export default function Perfil() {
  const navigate = useNavigate();
  const usuarioGuardado = JSON.parse(localStorage.getItem('user') || 'null');
  const [nombre, setNombre] = useState(usuarioGuardado?.user_metadata?.nombre || '');
  const [carrera, setCarrera] = useState(usuarioGuardado?.user_metadata?.carrera || '');
  const [ciclo, setCiclo] = useState(usuarioGuardado?.user_metadata?.ciclo || '');
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);

  const manejarGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje('');

    const { data, error } = await supabase.auth.updateUser({
      data: { nombre, carrera, ciclo },
    });

    if (error) {
      if (error.message.toLowerCase().includes('session')) {
        localStorage.removeItem('user');
        navigate('/');
        return;
      }
      setMensaje('Error: ' + error.message);
      setGuardando(false);
      return;
    }

    localStorage.setItem('user', JSON.stringify(data.user));
    setMensaje('Perfil actualizado.');
    setGuardando(false);
  };

  return (
    <div className="dashboard-root">
      <Sidebar active="perfil" />

      <main className="main-area">
        <header className="topbar">
          <h1>Mi Perfil</h1>
        </header>

        <section className="card" style={{ maxWidth: '480px' }}>
          <form onSubmit={manejarGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <label>
              Correo
              <input
                type="email"
                value={usuarioGuardado?.email || ''}
                disabled
                style={{ padding: '10px', width: '100%', fontSize: '16px', marginTop: '5px', boxSizing: 'border-box' }}
              />
            </label>

            <label>
              Nombre completo
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                style={{ padding: '10px', width: '100%', fontSize: '16px', marginTop: '5px', boxSizing: 'border-box' }}
              />
            </label>

            <label>
              Carrera
              <select
                value={carrera}
                onChange={(e) => setCarrera(e.target.value)}
                style={{ padding: '10px', width: '100%', fontSize: '16px', marginTop: '5px', boxSizing: 'border-box' }}
              >
                <option value="">Selecciona tu carrera...</option>
                {carreras.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label>
              Ciclo actual
              <input
                type="number"
                min="1"
                max="12"
                value={ciclo}
                onChange={(e) => setCiclo(e.target.value)}
                placeholder="Ej: 3"
                style={{ padding: '10px', width: '100%', fontSize: '16px', marginTop: '5px', boxSizing: 'border-box' }}
              />
            </label>

            <button
              type="submit"
              disabled={guardando}
              style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#36b37e', color: '#fff', fontWeight: 'bold', border: 'none' }}
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>

          {mensaje && <p style={{ marginTop: '15px', color: '#ffb7b2' }}>{mensaje}</p>}
        </section>
      </main>
    </div>
  );
}
