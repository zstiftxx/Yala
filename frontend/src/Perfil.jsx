import { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import { useUser } from './useUser';
import { carreras } from './data/cursosGenerales';
import { Save } from 'lucide-react';

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
      <header className="page-head">
        <div className="page-head-texto">
          <h1>Mi Perfil</h1>
          <p className="page-intro">
            Estos datos personalizan tu Dashboard y las notificaciones.
          </p>
        </div>
      </header>

      <section className="card form-estrecho">
        <form onSubmit={manejarGuardar} className="form-col">
          <label className="form-label">
            Correo
            <input className="form-input" type="email" value={user?.email || ''} disabled />
          </label>

          <label className="form-label">
            Nombre completo
            <input
              className="form-input"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
            />
          </label>

          <label className="form-label">
            Carrera
            <select className="form-input" value={carrera} onChange={(e) => setCarrera(e.target.value)}>
              <option value="">Selecciona tu carrera...</option>
              {carreras.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="form-label">
            Ciclo actual
            <input
              className="form-input"
              type="number"
              min="1"
              max="12"
              value={ciclo}
              onChange={(e) => setCiclo(e.target.value)}
              placeholder="Ej: 3"
            />
          </label>

          <button type="submit" className="btn primary" disabled={guardando}>
            <Save size={16} /> {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>

        {mensaje && <p className="auth-msg success">{mensaje}</p>}
      </section>
    </Sidebar>
  );
}
