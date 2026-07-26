import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from './useUser';
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
import NoEncontrado from './NoEncontrado.jsx';
import './App.css';

// El asistente arrastra KaTeX (~270 KB sin comprimir) y es la unica pantalla
// que lo necesita. Cargandolo aparte, quien entra al login o al dashboard no
// descarga el compositor de formulas.
const Asistente = lazy(() => import('./Asistente.jsx'));

// La sesion real vive en Supabase; localStorage['user'] es solo un espejo que
// puede quedar viejo (sesion expirada, logout en otra pestania, alguien que
// escribe la clave a mano). UserProvider la verifica contra Supabase; aca solo
// se espera su veredicto.
function RequireAuth({ children }) {
  const { user, cargandoSesion } = useUser();

  if (cargandoSesion) return <div className="auth-page">Cargando...</div>;
  if (!user) return <Navigate to="/" replace />;
  return children;
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
      <Route
        path="/asistente"
        element={
          <RequireAuth>
            <Suspense fallback={<div className="auth-page">Cargando...</div>}>
              <Asistente />
            </Suspense>
          </RequireAuth>
        }
      />
      <Route path="/notificaciones" element={<RequireAuth><Notificaciones /></RequireAuth>} />
      <Route path="/feedback" element={<RequireAuth><Feedback /></RequireAuth>} />
      <Route path="/reportar" element={<RequireAuth><Reportar /></RequireAuth>} />
      {/* Cualquier otra ruta */}
      <Route path="*" element={<NoEncontrado />} />
    </Routes>
  );
}

export default App;