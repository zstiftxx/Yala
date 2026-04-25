import { useState } from 'react';

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';

const cursosDePrueba = [
  { id: 1, nombre: 'Cálculo 1', ciclo: 1, creditos: 4 },
  { id: 2, nombre: 'Programación Básica', ciclo: 1, creditos: 4 },
  { id: 3, nombre: 'Cálculo 2', ciclo: 2, creditos: 4 },
  { id: 4, nombre: 'Estructura de Datos', ciclo: 2, creditos: 3 },
  { id: 5, nombre: 'Física 1', ciclo: 2, creditos: 4 }
];

function PaginaInicio() {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]); 

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
  return (
    <BrowserRouter>
      <Routes>
        {/* Si la URL es "/", muestra el buscador */}
        <Route path="/" element={<PaginaInicio />} />
        {/* Si la URL es "/curso", muestra la nueva página */}
        <Route path="/curso" element={<PaginaCurso />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;