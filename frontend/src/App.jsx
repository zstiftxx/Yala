import { useState } from 'react';

import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';
import './App.css';

const cursosDePrueba = [
  { id: 1, nombre: 'Cálculo 1', ciclo: 1, creditos: 4 },
  { id: 2, nombre: 'Programación Básica', ciclo: 1, creditos: 4 },
  { id: 3, nombre: 'Cálculo 2', ciclo: 2, creditos: 4 },
  { id: 4, nombre: 'Estructura de Datos', ciclo: 2, creditos: 3 },
  { id: 5, nombre: 'Física 1', ciclo: 2, creditos: 4 }
];

function PaginaInicio() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]); 

  const manejarLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // ignore
    }
    localStorage.removeItem('user');
    navigate('/');
  };

  const manejarBusqueda = () => {
    const cursosEncontrados = cursosDePrueba.filter(curso => 
      curso.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
    setResultados(cursosEncontrados);
  };

  return (
    <div>
      <header>
        <h1>Plataforma de Apoyo Estudiantil</h1>
        <p>Universidad de Lima - Encuentra apuntes, exámenes y tu malla curricular.</p>
      </header>

      <main>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 20px' }}>
          <button onClick={manejarLogout} style={{ padding: '6px 12px', cursor: 'pointer' }}>Cerrar sesión</button>
        </div>
        <section>
          <h2>Busca tu curso</h2>
          <input 
            type="text" 
            placeholder="Ej: Cálculo 1..."
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)} 
            style={{ padding: '10px', fontSize: '16px', marginRight: '10px' }}
          />
          <button onClick={manejarBusqueda} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
            Buscar
          </button>
        </section>

        <section style={{ marginTop: '40px' }}>
          {resultados.length > 0 ? (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {resultados.map((curso) => (
                <li key={curso.id} style={{ background: '#2c2c2c', margin: '10px auto', padding: '15px', borderRadius: '8px', maxWidth: '400px' }}>
                  <h3>{curso.nombre}</h3>
                  <p style={{ margin: '5px 0' }}>Ciclo: {curso.ciclo} | Créditos: {curso.creditos}</p>
                  
                  
                  <Link to="/curso" style={{ color: '#61dafb', textDecoration: 'none', fontWeight: 'bold' }}>
                    👉 Ver apuntes y pre-requisitos
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#888' }}>Escribe el nombre de un curso y presiona buscar.</p>
          )}
        </section>
      </main>
    </div>
  );
}

// 4. Creamos una página nueva muy sencilla para mostrar los detalles
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

// 5. Nuestro componente principal ahora administra las rutas (caminos)
function App() {
  // Componente simple para proteger rutas: redirige al login si no hay user
  function RequireAuth({ children }) {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return <Navigate to="/" replace />;
      return children;
    } catch (err) {
      return <Navigate to="/" replace />;
    }
  }

  return (
    <Routes>
      {/* Mostrar página de login en la raíz */}
      <Route path="/" element={<Login />} />
      {/* Después de iniciar sesión, redirigir aquí */}
      <Route path="/home" element={<Dashboard />} />
      <Route path="/curso" element={<PaginaCurso />} />
    </Routes>
  );
}

export default App;