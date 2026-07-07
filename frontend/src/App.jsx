import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';
import SeleccionCarrera from './SeleccionCarrera.jsx';
import Perfil from './Perfil.jsx';
import MapaCurricular from './MapaCurricular.jsx';
import MisCursos from './MisCursos.jsx';
import CursoDetalle from './CursoDetalle.jsx';
import Notificaciones from './Notificaciones.jsx';
import Feedback from './Feedback.jsx';
import Reportar from './Reportar.jsx';
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

function App() {
  return (
    <Routes>
      {/* Mostrar página de login en la raíz */}
      <Route path="/" element={<Login />} />
      {/* Después de iniciar sesión, redirigir aquí */}
      <Route path="/carrera" element={<RequireAuth><SeleccionCarrera /></RequireAuth>} />
      <Route path="/home" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/perfil" element={<RequireAuth><Perfil /></RequireAuth>} />
      <Route path="/mapa-curricular" element={<RequireAuth><MapaCurricular /></RequireAuth>} />
      <Route path="/mis-cursos" element={<RequireAuth><MisCursos /></RequireAuth>} />
      <Route path="/curso/:curso" element={<RequireAuth><CursoDetalle /></RequireAuth>} />
      <Route path="/notificaciones" element={<RequireAuth><Notificaciones /></RequireAuth>} />
      <Route path="/feedback" element={<RequireAuth><Feedback /></RequireAuth>} />
      <Route path="/reportar" element={<RequireAuth><Reportar /></RequireAuth>} />
    </Routes>
  );
}

export default App;