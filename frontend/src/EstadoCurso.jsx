import { Circle, CircleDot, CircleCheck } from 'lucide-react';

// Los tres estados de `estadoCursos`, en el orden en que avanza una carrera.
// El componente cicla por este arreglo, asi que el orden ES la interaccion.
const ESTADOS = [
  { valor: 'no_cursado', etiqueta: 'No cursado', corto: 'Pendiente', icono: Circle },
  { valor: 'en_curso', etiqueta: 'En curso', corto: 'En curso', icono: CircleDot },
  { valor: 'aprobado', etiqueta: 'Aprobado', corto: 'Aprobado', icono: CircleCheck },
];

const POR_VALOR = Object.fromEntries(ESTADOS.map((e) => [e.valor, e]));

// Reemplaza al <select> nativo que habia en Dashboard, MisCursos y CursoDetalle.
// Un select de tres opciones cuesta tres toques en movil (abrir, elegir,
// confirmar) y ademas no se puede estilar: se veia como un formulario de banco
// en medio de la lista. Aca un toque avanza al siguiente estado, que es el
// gesto que la gente hace decenas de veces seguidas al cargar su avance.
//
// Sigue siendo accesible: es un <button> con aria-label que dice el estado
// actual y el que viene, y las flechas izquierda/derecha recorren la lista.
export default function EstadoCurso({ estado, onCambiar, curso, compacto }) {
  const actual = POR_VALOR[estado] || POR_VALOR.no_cursado;
  const indice = ESTADOS.indexOf(actual);
  const siguiente = ESTADOS[(indice + 1) % ESTADOS.length];
  const Icono = actual.icono;

  const irA = (i) => onCambiar(ESTADOS[(i + ESTADOS.length) % ESTADOS.length].valor);

  const manejarTecla = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      irA(indice + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      irA(indice - 1);
    }
  };

  return (
    <button
      type="button"
      className={`estado-btn ${actual.valor}${compacto ? ' compacto' : ''}`}
      onClick={() => onCambiar(siguiente.valor)}
      onKeyDown={manejarTecla}
      aria-label={`${curso}: ${actual.etiqueta}. Tocar para marcar como ${siguiente.etiqueta}`}
      title={`Tocar para marcar como ${siguiente.etiqueta}`}
    >
      <Icono size={15} aria-hidden="true" />
      <span>{actual.corto}</span>
    </button>
  );
}
