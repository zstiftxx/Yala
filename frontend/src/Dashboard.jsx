import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function Dashboard() {
  const navigate = useNavigate();

  const manejarLogout = async () => {
    try { await supabase.auth.signOut(); } catch (e) {}
    localStorage.removeItem('user');
    navigate('/');
  };

  const cursosProgreso = [
    { id: 1, nombre: 'Álgebra Lineal', codigo: '6384', ciclo: '2', creditos: 3 },
    { id: 2, nombre: 'Física para Sistemas', codigo: '650053', ciclo: '3', creditos: 4 },
    { id: 3, nombre: 'Inteligencia Artificial Aplicada', codigo: '560040', ciclo: '3', creditos: 3 },
    { id: 4, nombre: 'Introducción a la Programación', codigo: '650054', ciclo: '3', creditos: 4 }
  ];

  const cursosCompletados = [
    'Cálculo I', 'Matemática para la Gestión de Negocios', 'Precálculo', 'Álgebra Lineal'
  ];

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
          <h1>Ingeniería de Sistemas</h1>
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
          <div className="card courses">
            <h3>Cursos en progreso</h3>
            <div className="course-grid">
              {cursosProgreso.map(c => (
                <div key={c.id} className="course-item">
                  <div className="course-title">{c.nombre}</div>
                  <div className="course-meta">{c.codigo} · Ciclo {c.ciclo} · {c.creditos} cr.</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card completed">
            <h3>Curso Completado</h3>
            <div className="list">
              {cursosCompletados.map((t, i) => (
                <div key={i} className="list-item">{t}</div>
              ))}
            </div>
          </div>

          <div className="card upcoming">
            <h3>Curso Próximamente</h3>
            <div className="list">
              <div className="list-item">Cálculo II</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
