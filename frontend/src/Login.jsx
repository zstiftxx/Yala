import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Eye, EyeOff, LogIn, Moon, Sun } from 'lucide-react';
// Importamos la "tuberia" que creaste con Claude
import { supabase } from './supabaseClient';
import { useTema } from './useTema';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState(null); // { tipo: 'error'|'success'|'info', texto }
  const [cargando, setCargando] = useState(false);
  const [verPass, setVerPass] = useState(false);
  const { tema, alternarTema } = useTema();
  const navigate = useNavigate();

  const destinoSegunUsuario = (user) => (user?.user_metadata?.carrera ? '/home' : '/carrera');

  // Registro (sign up)
  const manejarRegistro = async (e) => {
    e?.preventDefault();
    setCargando(true);
    setMensaje({ tipo: 'info', texto: 'Procesando...' });

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } else if (data && data.session) {
      // Solo hay sesion real si la confirmacion por correo esta desactivada
      setMensaje({ tipo: 'success', texto: 'Registro exitoso!' });
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate(destinoSegunUsuario(data.user));
    } else {
      // Sin sesion: el proyecto exige confirmar el correo antes de poder ingresar
      setMensaje({
        tipo: 'success',
        texto: 'Registro exitoso! Revisa tu correo para confirmar tu cuenta y luego inicia sesion.',
      });
    }
    setCargando(false);
  };

  // Inicio de sesion (sign in)
  const manejarIngreso = async (e) => {
    e?.preventDefault();
    setCargando(true);
    setMensaje({ tipo: 'info', texto: 'Ingresando...' });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMensaje({ tipo: 'error', texto: error.message });
      setCargando(false);
    } else if (data && data.user) {
      setMensaje({ tipo: 'success', texto: 'Ingreso exitoso! Redirigiendo...' });
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate(destinoSegunUsuario(data.user));
    } else {
      setMensaje({ tipo: 'info', texto: 'Ingreso completado.' });
      setCargando(false);
    }
  };

  return (
    <div className="auth-page">
      <button className="auth-theme-toggle" onClick={alternarTema} title="Cambiar tema" type="button">
        {tema === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div className="auth-card">
        <div className="auth-brand">
          <GraduationCap size={28} /> Educateca
        </div>
        <h2 className="auth-title">Bienvenido de vuelta</h2>
        <p className="auth-subtitle">Ingresa con tu correo universitario</p>

        <form onSubmit={manejarIngreso}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">Correo</label>
            <div className="auth-input-wrap">
              <Mail className="auth-lead-icon" size={18} />
              <input
                id="email"
                className="auth-input"
                type="email"
                placeholder="estudiante@ulima.edu.pe"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">Contrase&ntilde;a</label>
            <div className="auth-input-wrap">
              <Lock className="auth-lead-icon" size={18} />
              <input
                id="password"
                className="auth-input"
                type={verPass ? 'text' : 'password'}
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                className="auth-eye"
                type="button"
                onClick={() => setVerPass((v) => !v)}
                title={verPass ? 'Ocultar' : 'Mostrar'}
              >
                {verPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button className="auth-btn primary" type="submit" disabled={cargando}>
            <LogIn size={18} /> Iniciar sesi&oacute;n
          </button>
        </form>

        <div className="auth-divider">o</div>

        <button className="auth-btn ghost" type="button" onClick={manejarRegistro} disabled={cargando}>
          Crear una cuenta nueva
        </button>

        {mensaje && <p className={`auth-msg ${mensaje.tipo}`}>{mensaje.texto}</p>}
      </div>
    </div>
  );
}

export default Login;
