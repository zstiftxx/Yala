import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Eye, EyeOff, LogIn, UserPlus, User, ArrowLeft, Moon, Sun } from 'lucide-react';
// Importamos la "tuberia" que creaste con Claude
import { supabase } from './supabaseClient';
import { useTema } from './useTema';
import { carreras } from './data/cursosGenerales';

function Login() {
  const [modo, setModo] = useState('login'); // 'login' | 'registro'
  const [nombre, setNombre] = useState('');
  const [carrera, setCarrera] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mensaje, setMensaje] = useState(null); // { tipo: 'error'|'success'|'info', texto }
  const [cargando, setCargando] = useState(false);
  const [verPass, setVerPass] = useState(false);
  const { tema, alternarTema } = useTema();
  const navigate = useNavigate();

  const destinoSegunUsuario = (user) => (user?.user_metadata?.carrera ? '/home' : '/carrera');

  // Cambia entre iniciar sesion y registro, limpiando el estado del formulario
  const cambiarModo = (nuevo) => {
    setModo(nuevo);
    setMensaje(null);
    setCarrera('');
    setPassword('');
    setConfirmar('');
    setVerPass(false);
  };

  // Registro (sign up): pantalla propia con nombre y confirmacion de contrasena
  const manejarRegistro = async (e) => {
    e?.preventDefault();

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setMensaje({ tipo: 'error', texto: 'Escribe tu nombre.' });
      return;
    }
    if (!carrera) {
      setMensaje({ tipo: 'error', texto: 'Selecciona tu carrera.' });
      return;
    }
    if (password.length < 6) {
      setMensaje({ tipo: 'error', texto: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    if (password !== confirmar) {
      setMensaje({ tipo: 'error', texto: 'Las contraseñas no coinciden.' });
      return;
    }

    setCargando(true);
    setMensaje({ tipo: 'info', texto: 'Creando tu cuenta...' });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre: nombreLimpio, carrera } },
    });

    if (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } else if (data && data.session) {
      // Solo hay sesion real si la confirmacion por correo esta desactivada
      setMensaje({ tipo: 'success', texto: 'Cuenta creada!' });
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate(destinoSegunUsuario(data.user));
    } else {
      // Sin sesion: el proyecto exige confirmar el correo antes de poder ingresar
      setMensaje({
        tipo: 'success',
        texto: 'Cuenta creada! Revisa tu correo para confirmarla y luego inicia sesion.',
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

  const esRegistro = modo === 'registro';

  return (
    <div className="auth-page">
      <button className="auth-theme-toggle" onClick={alternarTema} title="Cambiar tema" type="button">
        {tema === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div className="auth-card">
        <div className="auth-brand">
          <GraduationCap size={28} /> Educateca
        </div>

        {esRegistro ? (
          <>
            <h2 className="auth-title">Crea tu cuenta</h2>
            <p className="auth-subtitle">Reg&iacute;strate para seguir tu avance de carrera</p>

            <form onSubmit={manejarRegistro}>
              <div className="auth-field">
                <label className="auth-label" htmlFor="nombre">Nombre</label>
                <div className="auth-input-wrap">
                  <User className="auth-lead-icon" size={18} />
                  <input
                    id="nombre"
                    className="auth-input"
                    type="text"
                    placeholder="Tu nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              </div>

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
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="password">Contrase&ntilde;a</label>
                <div className="auth-input-wrap">
                  <Lock className="auth-lead-icon" size={18} />
                  <input
                    id="password"
                    className="auth-input"
                    type={verPass ? 'text' : 'password'}
                    placeholder="M&iacute;nimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
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

              <div className="auth-field">
                <label className="auth-label" htmlFor="confirmar">Confirmar contrase&ntilde;a</label>
                <div className="auth-input-wrap">
                  <Lock className="auth-lead-icon" size={18} />
                  <input
                    id="confirmar"
                    className="auth-input"
                    type={verPass ? 'text' : 'password'}
                    placeholder="Repite tu contraseña"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button className="auth-btn primary" type="submit" disabled={cargando}>
                <UserPlus size={18} /> Crear cuenta
              </button>
            </form>

            <div className="auth-divider">o</div>

            <button className="auth-btn ghost" type="button" onClick={() => cambiarModo('login')} disabled={cargando}>
              <ArrowLeft size={18} /> Ya tengo una cuenta
            </button>
          </>
        ) : (
          <>
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

            <button className="auth-btn ghost" type="button" onClick={() => cambiarModo('registro')} disabled={cargando}>
              <UserPlus size={18} /> Crear una cuenta nueva
            </button>
          </>
        )}

        {mensaje && <p className={`auth-msg ${mensaje.tipo}`}>{mensaje.texto}</p>}
      </div>
    </div>
  );
}

export default Login;
