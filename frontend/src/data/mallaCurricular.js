import { cursosGeneralesPorCarrera } from './cursosGenerales';

// Ciclos 3 en adelante, por carrera. Ciclos 1 y 2 se toman de cursosGenerales.js
// (misma fuente que usa el Dashboard) para no duplicar esa data.
const cursosAvanzadosPorCarrera = {
  'Ingeniería de Sistemas': {
    3: [
      'Cálculo II',
      'Estructuras Discretas de Computación',
      'Física para Sistemas',
      'Inteligencia Artificial Aplicada',
      'Introducción a la Programación',
      'Sistemas Organizacionales',
    ],
    4: [
      'Arquitectura de Computadoras',
      'Costeo de Operaciones',
      'Cálculo III',
      'Estadística y Probabilidad',
      'Modelación e Integración de Sistemas',
      'Programación Orientada a Objetos',
    ],
    5: [
      'Desarrollo de Competencias Gerenciales',
      'Estadística Aplicada',
      'Estructuras de Datos I',
      'Investigación de Operaciones I',
      'Modelamiento de Base de Datos',
      'Sistemas Operativos',
    ],
    6: [
      'Estructuras de Datos II',
      'Gestión Financiera',
      'Ingeniería de Procesos de Negocio',
      'Programación Web',
      'Redes de Computadoras',
      'Simulación',
    ],
    7: [
      'Aprendizaje de Máquina / Machine Learning',
      'Ciberseguridad / Cybersecurity',
      'Gestión de Operaciones',
      'Ingeniería de Software I',
      'Sistemas de Inteligencia Empresarial',
    ],
    8: [
      'Auditoría y Control de Sistemas',
      'Ingeniería de Software II',
      'Propuesta de Investigación',
      'Sistemas ERP',
    ],
    9: [
      'Gestión de Proyectos',
      'Planeamiento Estratégico',
      'Seguridad de Sistemas',
      'Seminario de Investigación I',
    ],
    10: [
      'Gestión de Servicios Digitales',
      'Proyecto Integrador de Sistemas',
      'Seminario de Investigación II',
    ],
  },
};

export const carrerasConMallaCompleta = Object.keys(cursosAvanzadosPorCarrera);

export function obtenerMallaCompleta(carrera) {
  const generales = cursosGeneralesPorCarrera[carrera];
  if (!generales) return null;

  const avanzados = cursosAvanzadosPorCarrera[carrera] || {};

  return { ...generales, ...avanzados };
}
