import { cursosGeneralesPorCarrera } from './cursosGenerales';
import { cursosAvanzadosGenerados, prerequisitosGenerados } from './mallasGeneradas';

// Ciclos 3 en adelante, por carrera. Ciclos 1 y 2 se toman de cursosGenerales.js
// (misma fuente que usa el Dashboard) para no duplicar esa data.
// Ingeniería de Sistemas se define a mano; el resto se importa de mallasGeneradas.js
// (extraído de los planes de estudio oficiales en PDF).
const cursosAvanzadosPorCarrera = {
  ...cursosAvanzadosGenerados,
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
  ...prerequisitosGenerados,
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

// Ciclo en el que la malla de la carrera ubica un curso, o null si ese curso no
// pertenece a la malla (URL escrita a mano, o carrera cambiada despues de
// marcar cursos de la anterior).
export function cicloDeCurso(carrera, curso) {
  const malla = obtenerMallaCompleta(carrera);
  if (!malla) return null;
  const encontrado = Object.entries(malla).find(([, cursos]) => cursos.includes(curso));
  return encontrado ? Number(encontrado[0]) : null;
}

// Cursos que el alumno puede llevar ahora: los que aun no aprobo ni esta llevando
// y cuyos prerrequisitos estan todos aprobados.
//
// Ojo con los ciclos 3+ sin prerrequisitos declarados: los PDF oficiales no
// siempre los traen y la cobertura varia mucho por carrera (0% de huecos en
// Economia, ~49% en Mecatronica). Para esos no podemos afirmar que esten
// habilitados sin inventar data curricular, asi que se devuelven aparte en
// `sinDatos` en vez de colarse entre los disponibles. En ciclos 1-2 la ausencia
// de prerrequisitos si es real.
//
// Devuelve { disponibles, sinDatos }, ambos [{ curso, ciclo }] ordenados por
// ciclo y luego alfabeticamente.
export function cursosDisponibles(carrera, estadoCursos = {}) {
  const malla = obtenerMallaCompleta(carrera);
  if (!malla) return { disponibles: [], sinDatos: [] };

  const prereqs = obtenerPrerequisitos(carrera);
  const aprobado = (curso) => estadoCursos[curso] === 'aprobado';

  const disponibles = [];
  const sinDatos = [];

  Object.entries(malla).forEach(([ciclo, cursos]) => {
    const n = Number(ciclo);
    cursos.forEach((curso) => {
      const estado = estadoCursos[curso];
      if (estado === 'aprobado' || estado === 'en_curso') return;

      const lista = prereqs[curso] || [];
      if (!lista.length && n >= 3) {
        sinDatos.push({ curso, ciclo: n });
      } else if (lista.every(aprobado)) {
        disponibles.push({ curso, ciclo: n });
      }
    });
  });

  const porCicloYNombre = (a, b) =>
    a.ciclo - b.ciclo || a.curso.localeCompare(b.curso, 'es');

  return {
    disponibles: disponibles.sort(porCicloYNombre),
    sinDatos: sinDatos.sort(porCicloYNombre),
  };
}
