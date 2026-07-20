import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './useUser';
import { useTema } from './useTema';
import { carreras } from './data/cursosGenerales';
import { GraduationCap, ArrowRight, Moon, Sun } from 'lucide-react';

export default function SeleccionCarrera() {
  const navigate = useNavigate();
  const { actualizarMetadata } = useUser();
  const { tema, alternarTema } = useTema();
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

    // Si la sesion ya no es valida, el contexto la limpia y RequireAuth manda a /.
    await actualizarMetadata({ carrera }, { inmediato: true });
    navigate('/home');
  };

  return (
    <div className="auth-page" data-theme={tema}>
      <button className="auth-theme-toggle" onClick={alternarTema} title="Cambiar tema" type="button">
        {tema === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div className="auth-card">
        <div className="auth-brand">
          <GraduationCap size={26} /> Educateca
        </div>
        <h1 className="auth-title">Que carrera estas estudiando?</h1>
        <p className="auth-subtitle">
          Con esto armamos tu malla, tu avance y los apuntes que te tocan. Lo puedes
          cambiar despues desde tu perfil.
        </p>

        <form onSubmit={manejarContinuar}>
          <label className="auth-label" htmlFor="carrera">Carrera</label>
          <select
            id="carrera"
            className="auth-input sin-icono"
            value={carrera}
            onChange={(e) => setCarrera(e.target.value)}
          >
            <option value="">Selecciona tu carrera...</option>
            {carreras.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button type="submit" className="auth-btn primary" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Continuar'} <ArrowRight size={18} />
          </button>
        </form>

        {mensaje && <p className="auth-msg error">{mensaje}</p>}
      </div>
    </div>
  );
}
