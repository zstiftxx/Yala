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

// Prerrequisitos oficiales por carrera (curso -> cursos que debe tener aprobados
// antes). Solo se listan los cursos que tienen algún prerrequisito.
// Fuente: Plan de estudios 2026-1 de la Universidad de Lima.
const prerequisitosPorCarrera = {
  'Ingeniería de Sistemas': {
    'Lenguaje y Comunicación II': ['Lenguaje y Comunicación I'],
    'Álgebra Lineal': ['Precálculo'],
    'Cálculo I': ['Precálculo'],
    'Cálculo II': ['Cálculo I'],
    'Sistemas Organizacionales': ['Fundamentos de Economía'],
    'Cálculo III': ['Cálculo II'],
    'Estadística y Probabilidad': ['Cálculo I'],
    'Modelación e Integración de Sistemas': ['Inteligencia Artificial Aplicada'],
    'Arquitectura de Computadoras': ['Física para Sistemas'],
    'Costeo de Operaciones': ['Sistemas Organizacionales'],
    'Programación Orientada a Objetos': ['Estructuras Discretas de Computación', 'Introducción a la Programación'],
    'Investigación de Operaciones I': ['Cálculo III'],
    'Sistemas Operativos': ['Arquitectura de Computadoras'],
    'Estadística Aplicada': ['Estadística y Probabilidad'],
    'Desarrollo de Competencias Gerenciales': ['Sistemas Organizacionales'],
    'Estructuras de Datos I': ['Programación Orientada a Objetos'],
    'Modelamiento de Base de Datos': ['Programación Orientada a Objetos'],
    'Ingeniería de Procesos de Negocio': ['Investigación de Operaciones I'],
    'Redes de Computadoras': ['Sistemas Operativos'],
    'Simulación': ['Modelación e Integración de Sistemas'],
    'Estructuras de Datos II': ['Estructuras de Datos I'],
    'Programación Web': ['Estructuras de Datos I'],
    'Gestión Financiera': ['Costeo de Operaciones'],
    'Sistemas de Inteligencia Empresarial': ['Modelamiento de Base de Datos'],
    'Gestión de Operaciones': ['Ingeniería de Procesos de Negocio'],
    'Ingeniería de Software I': ['Modelamiento de Base de Datos'],
    'Aprendizaje de Máquina / Machine Learning': ['Estadística Aplicada'],
    'Ciberseguridad / Cybersecurity': ['Redes de Computadoras'],
    'Propuesta de Investigación': ['Simulación'],
    'Sistemas ERP': ['Gestión de Operaciones'],
    'Auditoría y Control de Sistemas': ['Gestión Financiera'],
    'Ingeniería de Software II': ['Ingeniería de Software I'],
    'Gestión de Proyectos': ['Auditoría y Control de Sistemas'],
    'Seminario de Investigación I': ['Propuesta de Investigación'],
    'Seguridad de Sistemas': ['Ciberseguridad / Cybersecurity'],
    'Seminario de Investigación II': ['Seminario de Investigación I'],
    'Proyecto Integrador de Sistemas': ['Gestión de Proyectos'],
  },
};

export function obtenerPrerequisitos(carrera) {
  return prerequisitosPorCarrera[carrera] || {};
}

export const carrerasConMallaCompleta = Object.keys(cursosAvanzadosPorCarrera);

export function obtenerMallaCompleta(carrera) {
  const generales = cursosGeneralesPorCarrera[carrera];
  if (!generales) return null;

  const avanzados = cursosAvanzadosPorCarrera[carrera] || {};

  return { ...generales, ...avanzados };
}
