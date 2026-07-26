import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Pinta la respuesta del asistente: Markdown ligero + formulas LaTeX.
//
// POR QUE UN RENDERIZADOR PROPIO
// El modelo responde en Markdown y escribe las formulas en LaTeX ($55\ \Omega$).
// En un curso de fisica o circuitos eso HAY que verlo compuesto: en crudo, una
// respuesta con medio parrafo de \frac y \Omega es ilegible. La via corta seria
// react-markdown + remark-math + rehype-katex, tres paquetes mas (y sus
// dependencias) para negritas, listas y titulos.
//
// Y hay una razon de seguridad para no traer un pipeline de HTML: este texto NO
// es confiable. Sale de un modelo que acaba de leer un PDF que subio alguien, y
// ese PDF puede traer texto que intente dar ordenes o inyectar marcado. Aca todo
// se convierte en NODOS de React (nunca en HTML), y lo unico que pasa por
// dangerouslySetInnerHTML es lo que genera KaTeX, que con `trust: false` (su
// valor por defecto) no emite enlaces ni \includegraphics.
//
// Lo que NO soporta, a proposito: HTML crudo, imagenes y enlaces. Nada de eso
// aparece en una explicacion de un ejercicio.

// throwOnError:false hace que una formula rota se pinte en rojo en vez de
// tumbar la respuesta entera. strict:false porque el modelo mezcla notaciones
// (unidades, \text, espacios raros) y no queremos la consola llena de avisos.
function componer(expr, display) {
  try {
    return katex.renderToString(expr, { displayMode: display, throwOnError: false, strict: false });
  } catch {
    return null;
  }
}

function Formula({ expr, display }) {
  const marcado = useMemo(() => componer(expr, display), [expr, display]);

  // Si KaTeX no pudo ni con throwOnError:false, se muestra la formula tal cual.
  // Verla en LaTeX es peor que verla compuesta, y muchisimo mejor que un hueco.
  if (!marcado) return <code className="ia-codigo">{expr}</code>;

  return (
    <span
      className={display ? 'ia-formula-bloque' : 'ia-formula'}
      dangerouslySetInnerHTML={{ __html: marcado }}
    />
  );
}

// ---------------------------------------------------------------------------
// Nivel de linea (inline)
// ---------------------------------------------------------------------------
// El orden de las alternativas importa: gana la que empieza antes y, a igual
// posicion, la que va primero aca. Por eso `$$` va antes que `$` y `**` antes
// que `*`. El codigo entre backticks va el primero de todos: lo que este ahi
// dentro se consume entero y ya no se busca ni formula ni negrita.
//
// Se guarda el PATRON, no un RegExp ya construido: enLinea() se llama a si
// misma (una negrita puede llevar una formula dentro) y un regexp global es
// mutable — comparte `lastIndex`. La llamada de adentro lo dejaba en 0 y el
// bucle de afuera volvia a empezar desde el principio, para siempre. Cada
// invocacion se fabrica el suyo.
const PATRON_INLINE = [
  '`([^`]+)`', //                              1 codigo
  '\\$\\$([\\s\\S]+?)\\$\\$', //                2 formula en bloque
  '\\\\\\(([\\s\\S]+?)\\\\\\)', //              3 \( ... \)
  // El $ que abre no puede ir seguido de espacio y el que cierra no puede ir
  // precedido de espacio. Es lo que evita que "cuesta $5 y sobran $2" se lea
  // como una formula que dice "5 y sobran ".
  '\\$([^\\s$][^$\\n]*[^\\s$]|[^\\s$])\\$', //  4 $ ... $
  '\\*\\*([^*]+)\\*\\*', //                     5 negrita
  '__([^_]+)__', //                             6 negrita
  '\\*([^*\\n]+)\\*', //                        7 cursiva
].join('|');

function enLinea(texto, prefijo) {
  const re = new RegExp(PATRON_INLINE, 'g');
  const nodos = [];
  let ultimo = 0;
  let m;

  while ((m = re.exec(texto)) !== null) {
    if (m.index > ultimo) nodos.push(texto.slice(ultimo, m.index));
    const clave = `${prefijo}-${m.index}`;
    const [, codigo, bloque, parentesis, dolar, negrita, negrita2, cursiva] = m;

    if (codigo !== undefined) nodos.push(<code key={clave} className="ia-codigo">{codigo}</code>);
    else if (bloque !== undefined) nodos.push(<Formula key={clave} expr={bloque} display />);
    else if (parentesis !== undefined) nodos.push(<Formula key={clave} expr={parentesis} />);
    else if (dolar !== undefined) nodos.push(<Formula key={clave} expr={dolar} />);
    // Se vuelve a entrar para que "**a $x$ b**" componga la formula de adentro.
    // El contenido siempre es mas corto, asi que la recursion termina.
    else if (negrita !== undefined) nodos.push(<strong key={clave}>{enLinea(negrita, clave)}</strong>);
    else if (negrita2 !== undefined) nodos.push(<strong key={clave}>{enLinea(negrita2, clave)}</strong>);
    else if (cursiva !== undefined) nodos.push(<em key={clave}>{enLinea(cursiva, clave)}</em>);

    ultimo = m.index + m[0].length;
  }

  if (ultimo < texto.length) nodos.push(texto.slice(ultimo));
  return nodos;
}

// ---------------------------------------------------------------------------
// Nivel de bloque
// ---------------------------------------------------------------------------

const RE_ITEM = /^\s*(?:[-*+]|\d+[.)])\s+/;
const RE_CITA = /^\s*>/;
const RE_ABRE_BLOQUE = /^\s*(?:```|#{1,6}\s|\$\$|\\\[|>)/;

function partirEnBloques(texto) {
  const lineas = texto.replace(/\r\n/g, '\n').split('\n');
  const bloques = [];
  let i = 0;

  while (i < lineas.length) {
    const linea = lineas[i];

    if (!linea.trim()) {
      i++;
      continue;
    }

    // ``` codigo ```
    if (/^\s*```/.test(linea)) {
      i++;
      const cuerpo = [];
      while (i < lineas.length && !/^\s*```/.test(lineas[i])) cuerpo.push(lineas[i++]);
      i++; // la linea de cierre
      bloques.push({ tipo: 'codigo', texto: cuerpo.join('\n') });
      continue;
    }

    // Formula centrada: $$ ... $$ o \[ ... \], abra y cierre en la misma linea
    // o repartida en varias.
    const apertura = linea.match(/^\s*(\$\$|\\\[)/);
    if (apertura) {
      const cierre = apertura[1] === '$$' ? '$$' : '\\]';
      const resto = linea.slice(linea.indexOf(apertura[1]) + apertura[1].length);
      const fin = resto.indexOf(cierre);
      if (fin >= 0) {
        bloques.push({ tipo: 'formula', texto: resto.slice(0, fin).trim() });
        i++;
        continue;
      }
      const cuerpo = [resto];
      i++;
      while (i < lineas.length && !lineas[i].includes(cierre)) cuerpo.push(lineas[i++]);
      if (i < lineas.length) {
        cuerpo.push(lineas[i].slice(0, lineas[i].indexOf(cierre)));
        i++;
      }
      bloques.push({ tipo: 'formula', texto: cuerpo.join('\n').trim() });
      continue;
    }

    // > Cita. El modelo las usa para transcribir el enunciado del material
    // antes de resolverlo, asi que aparecen seguido. Dentro puede haber de
    // todo (listas, formulas), por eso se vuelve a partir en bloques.
    if (RE_CITA.test(linea)) {
      const dentro = [];
      while (i < lineas.length && RE_CITA.test(lineas[i])) {
        dentro.push(lineas[i++].replace(/^\s*>\s?/, ''));
      }
      bloques.push({ tipo: 'cita', texto: dentro.join('\n') });
      continue;
    }

    // # Titulo
    const titulo = linea.match(/^\s*(#{1,6})\s+(.*)$/);
    if (titulo) {
      bloques.push({ tipo: 'titulo', nivel: titulo[1].length, texto: titulo[2] });
      i++;
      continue;
    }

    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(linea)) {
      bloques.push({ tipo: 'separador' });
      i++;
      continue;
    }

    // Tabla: una fila con barras y, debajo, la de guiones. Sin esa segunda
    // linea no es una tabla (puede ser un texto con una barra suelta).
    const siguiente = lineas[i + 1] ?? '';
    if (
      linea.includes('|') &&
      siguiente.includes('|') &&
      /^[\s:|-]*-[\s:|-]*$/.test(siguiente)
    ) {
      const celdas = (l) =>
        l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
      const cabecera = celdas(linea);
      i += 2;
      const filas = [];
      while (i < lineas.length && lineas[i].trim() && lineas[i].includes('|')) {
        filas.push(celdas(lineas[i++]));
      }
      bloques.push({ tipo: 'tabla', cabecera, filas });
      continue;
    }

    // Listas
    if (RE_ITEM.test(linea)) {
      const ordenada = /^\s*\d+[.)]\s+/.test(linea);
      const items = [];
      while (i < lineas.length && RE_ITEM.test(lineas[i])) {
        items.push(lineas[i].replace(RE_ITEM, ''));
        i++;
        // Continuacion indentada del mismo item: el modelo parte los pasos
        // largos en varias lineas y sin esto cada trozo abriria un parrafo.
        while (i < lineas.length && lineas[i].trim() && !RE_ITEM.test(lineas[i]) && /^\s{2,}/.test(lineas[i])) {
          items[items.length - 1] += `\n${lineas[i].trim()}`;
          i++;
        }
      }
      bloques.push({ tipo: 'lista', ordenada, items });
      continue;
    }

    // Parrafo: hasta una linea en blanco o el comienzo de otro bloque.
    const parrafo = [];
    while (
      i < lineas.length &&
      lineas[i].trim() &&
      !RE_ITEM.test(lineas[i]) &&
      !RE_ABRE_BLOQUE.test(lineas[i])
    ) {
      parrafo.push(lineas[i]);
      i++;
    }
    bloques.push({ tipo: 'parrafo', texto: parrafo.join('\n') });
  }

  return bloques;
}

function Bloque({ bloque, indice }) {
  const clave = `b${indice}`;

  switch (bloque.tipo) {
    case 'formula':
      return <Formula expr={bloque.texto} display />;

    case 'codigo':
      return <pre className="ia-bloque-codigo">{bloque.texto}</pre>;

    case 'titulo': {
      // h1/h2 del modelo se degradan: el h1 de la pagina ya existe y es el
      // titulo de la pantalla, no el de la respuesta.
      const Tag = `h${Math.min(bloque.nivel + 2, 6)}`;
      return <Tag className="ia-titulo">{enLinea(bloque.texto, clave)}</Tag>;
    }

    case 'separador':
      return <hr className="ia-separador" />;

    case 'cita':
      return (
        <blockquote className="ia-cita">
          {partirEnBloques(bloque.texto).map((b, n) => (
            <Bloque key={n} bloque={b} indice={`${indice}-${n}`} />
          ))}
        </blockquote>
      );

    case 'lista': {
      const Tag = bloque.ordenada ? 'ol' : 'ul';
      return (
        <Tag className="ia-lista">
          {bloque.items.map((item, n) => (
            <li key={n}>{enLinea(item, `${clave}-${n}`)}</li>
          ))}
        </Tag>
      );
    }

    case 'tabla':
      return (
        <div className="ia-tabla-scroll">
          <table className="ia-tabla">
            <thead>
              <tr>
                {bloque.cabecera.map((c, n) => (
                  <th key={n}>{enLinea(c, `${clave}-h${n}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bloque.filas.map((fila, f) => (
                <tr key={f}>
                  {fila.map((c, n) => (
                    <td key={n}>{enLinea(c, `${clave}-${f}-${n}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return <p className="ia-parrafo">{enLinea(bloque.texto, clave)}</p>;
  }
}

export default function RespuestaIA({ texto }) {
  const bloques = useMemo(() => partirEnBloques(texto || ''), [texto]);

  return (
    <div className="ia-respuesta">
      {bloques.map((bloque, i) => (
        <Bloque key={i} bloque={bloque} indice={i} />
      ))}
    </div>
  );
}
