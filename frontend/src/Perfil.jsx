import { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import { useUser } from './useUser';
import { carreras } from './data/cursosGenerales';

export default function Perfil() {
  const { user, nombre: nombreGuardado, carrera: carreraGuardada, ciclo: cicloGuardado, actualizarMetadata } = useUser();
  // Copia local del formulario: solo se sincroniza al contexto al enviar.
  const [nombre, setNombre] = useState(nombreGuardado);
  const [carrera, setCarrera] = useState(carreraGuardada);
  const [ciclo, setCiclo] = useState(cicloGuardado);
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);

  const manejarGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje('');
    await actualizarMetadata({ nombre, carrera, ciclo }, { inmediato: true });
    setMensaje('Perfil actualizado.');
    setGuardando(false);
  };

  return (
    <Sidebar active="perfil">
      <header className="topbar">
        <h1>Mi Perfil</h1>
      </header>

      <section className="card" style={{ maxWidth: '480px' }}>
        <form onSubmit={manejarGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <label>
            Correo
            <input
              type="email"
              value={user?.email || ''}
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
    </Sidebar>
  );
}
