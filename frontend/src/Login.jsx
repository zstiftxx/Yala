import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Importamos la "tubería" que creaste con Claude
import { supabase } from './supabaseClient'; 

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  // Esta función se activa al hacer clic en el botón
  const manejarRegistro = async (e) => {
    e.preventDefault(); // Evita que la página se recargue
    setMensaje('Procesando...');

    // Usamos Supabase para intentar registrar al estudiante
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    // Si Supabase nos devuelve un error, lo mostramos
    if (error) {
      setMensaje('Error: ' + error.message);
    } else {
      setMensaje('¡Registro exitoso! Por favor revisa la bandeja de tu correo para confirmar.');
      // Si el registro devuelve usuario, podemos redirigir directamente
      if (data && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/home');
      }
    }
  };

  // Manejar inicio de sesión (sign in)
  const manejarIngreso = async (e) => {
    e?.preventDefault();
    setMensaje('Ingresando...');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setMensaje('Error: ' + error.message);
    } else if (data && data.user) {
      setMensaje('¡Ingreso exitoso! Redirigiendo...');
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/home');
    } else {
      setMensaje('Ingreso completado.');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Ingreso a la Plataforma</h2>
      <p>Regístrate con tu correo universitario</p>
      
      <form style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
        <input
          type="email"
          placeholder="Ej: estudiante@ulima.edu.pe"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '10px', width: '280px', fontSize: '16px' }}
        />
        <input
          type="password"
          placeholder="Tu contraseña secreta"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '10px', width: '280px', fontSize: '16px' }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={manejarIngreso} type="button" style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#36b37e', color: '#fff', fontWeight: 'bold', border: 'none' }}>
            Iniciar sesión
          </button>
          <button onClick={manejarRegistro} type="button" style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#61dafb', color: '#000', fontWeight: 'bold', border: 'none' }}>
            Registrarme
          </button>
        </div>
      </form>

      {/* Aquí aparecerán los mensajes de error o éxito */}
      <p style={{ marginTop: '20px', color: '#ffb7b2' }}>{mensaje}</p>
    </div>
  );
}

export default Login;