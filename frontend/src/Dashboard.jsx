import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { cursosGeneralesPorCarrera } from './data/cursosGenerales';

export default function Dashboard() {
  const navigate = useNavigate();
  const usuarioGuardado = JSON.parse(localStorage.getItem('user') || 'null');
  const carrera = usuarioGuardado?.user_metadata?.carrera || 'Tu carrera';
  const cursosGenerales = cursosGeneralesPorCarrera[carrera];

  const manejarLogout = async () => {
    try { await supabase.auth.signOut(); } catch (e) {}
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="dashboard-root">
      <aside className="sidebar">
        <div className="brand">Educateca</div>
        <nav>
          <ul>
            <li className="active">Dashboard</li>
            <li>Notificaciones</li>
            <li>Mis Cursos</li>
            <li>Feedback</li>
            <li>Perfil</li>
          </ul>
        </nav>
        <div className="sidebar-bottom">
          <button className="logout" onClick={manejarLogout}>Cerrar sesión</button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <h1>{carrera}</h1>
          <div className="top-actions">
            <button className="btn ghost">Actualizar cursos</button>
            <button className="btn primary">Ver mapa curricular</button>
            <div className="avatar">T</div>
          </div>
        </header>

        <section className="overview">
          <div className="stat-card progress">
            <div className="label">Progreso</div>
            <div className="value">15%</div>
          </div>
          <div className="stat-card green">
            <div className="label">Aprobados</div>
            <div className="value">11/74</div>
          </div>
          <div className="stat-card blue">
            <div className="label">En curso</div>
            <div className="value">6</div>
          </div>
          <div className="stat-card muted">
            <div className="label">Créditos</div>
            <div className="value">37/250</div>
          </div>
        </section>

        <section className="cards">
          {cursosGenerales ? (
            <>
              <div className="card courses">
                <h3>Cursos Generales · Ciclo 1</h3>
                <div className="course-grid">
                  {cursosGenerales[1].map((nombre) => (
                    <div key={nombre} className="course-item">
                      <div className="course-title">{nombre}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card completed">
                <h3>Cursos Generales · Ciclo 2</h3>
                <div className="list">
                  {cursosGenerales[2].map((nombre) => (
                    <div key={nombre} className="list-item">{nombre}</div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="card courses">
              <h3>Cursos Generales</h3>
              <p>Selecciona tu carrera para ver los cursos generales que te corresponden.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
