import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';
import SeleccionCarrera from './SeleccionCarrera.jsx';
import Perfil from './Perfil.jsx';
import './App.css';

function RequireAuth({ children }) {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return <Navigate to="/" replace />;
    return children;
  } catch (err) {
    return <Navigate to="/" replace />;
  }
}

// Página nueva muy sencilla para mostrar los detalles
function PaginaCurso() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Bienvenido al panel del Curso</h2>
      <p>Aquí pondremos los PDFs, apuntes y la malla de este curso específico.</p>
      {/* Botón para regresar */}
      <Link to="/" style={{ color: '#61dafb', textDecoration: 'none', display: 'block', marginTop: '20px' }}>
        ⬅️ Volver al Buscador
      </Link>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Mostrar página de login en la raíz */}
      <Route path="/" element={<Login />} />
      {/* Después de iniciar sesión, redirigir aquí */}
      <Route path="/carrera" element={<RequireAuth><SeleccionCarrera /></RequireAuth>} />
      <Route path="/home" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/perfil" element={<RequireAuth><Perfil /></RequireAuth>} />
      <Route path="/curso" element={<RequireAuth><PaginaCurso /></RequireAuth>} />
    </Routes>
  );
}

export default App;