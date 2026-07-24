"""Extrae cursos y prerrequisitos de los planes de estudio (PDF) de la ULima.

Uso:
    python scripts/extraer_mallas.py              # regenera mallasGeneradas.js
    python scripts/extraer_mallas.py --debug      # ademas imprime el detalle

Los PDF viven en scripts/pdf/<slug>.pdf y estan versionados a proposito: sin
ellos las mallas generadas no son reproducibles.

Por que no se parsea el texto plano: en estos PDF una fila de la tabla puede
ocupar tres lineas de texto. El nombre largo de un curso se parte y la mitad
cae ARRIBA de la linea que trae los numeros, mientras que un segundo
prerrequisito cae ABAJO. En texto plano las dos se ven igual. Con las
coordenadas de cada palabra se sabe en que columna esta, que es lo que
realmente las distingue.
"""

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

import pdfplumber

RAIZ = Path(__file__).resolve().parent.parent
DIR_PDF = Path(__file__).resolve().parent / "pdf"
SALIDA = RAIZ / "frontend" / "src" / "data" / "mallasGeneradas.js"

# slug del PDF -> nombre de carrera tal como aparece en cursosGenerales.js.
# Los PDF se bajaron el 2026-07-23 de ulima.edu.pe; la URL queda anotada porque
# la universidad los reemplaza sin avisar y hay que poder comparar contra el
# que se uso. Ojo: el nombre del archivo no dice de que carrera es
# ("plan_de_estudios_2026-1_0.pdf" es Derecho), asi que conviene abrirlo antes.
CARRERAS = {
    # /sites/default/files/career/files/ingenieria_industrial_plan_de_estudios.pdf
    "ing_industrial": "Ingeniería Industrial",
    # /sites/default/files/career/files/plan_de_estudios_2026-1_0.pdf
    "derecho": "Derecho",
    # /sites/default/files/page/file/plan_de_estudios_-_carrera_de_marketing_v.1.8.2024.pdf
    "marketing": "Marketing",
    # /sites/default/files/page/file/plan_de_estudios_2025-1_2.pdf
    "comunicacion": "Comunicaciones",
    # /sites/default/files/career/files/ing_ambiental_plan_de_estudios_formato_web-c_0.pdf
    "ing_ambiental": "Ingeniería Ambiental",
}

# Requisitos que no son cursos ("haber aprobado 80 creditos", "haber culminado
# el 5to nivel"). La app modela prerrequisitos curso -> curso, nada mas.
NO_ES_CURSO = re.compile(r"^\s*(HABER\b|[-—–.]*\s*$)", re.IGNORECASE)

# Palabras que en un titulo en castellano van en minuscula.
MINUSCULAS = {
    "a", "al", "ante", "con", "contra", "de", "del", "e", "el", "en", "entre",
    "hacia", "hasta", "la", "las", "los", "o", "para", "por", "segun", "sin",
    "sobre", "tras", "u", "y",
}

# Se escriben tal cual: numeros romanos y siglas.
LITERALES = {
    "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII",
    "ERP", "B2B", "TIC", "RPA", "SIG", "GIS", "PYME", "PYMES", "ONG", "TV",
    "CAD", "BIM", "IA", "MYPE", "MYPES", "SST",
}


def titulo(texto):
    """'DERECHO CIVIL I (PERSONAS)' -> 'Derecho Civil I (Personas)'.

    Los PDF vienen unos en mayusculas y otros en capitalizado; sin normalizar,
    la lista de cursos de la app mezclaria ambos estilos.
    """
    palabras = texto.split()
    salida = []
    for i, palabra in enumerate(palabras):
        nucleo = palabra.strip("().,;:¿?¡!\"'")
        prefijo = palabra[: len(palabra) - len(palabra.lstrip("(\"'¿¡"))]
        sufijo = palabra[len(prefijo) + len(nucleo):]

        if nucleo.upper() in LITERALES:
            nuevo = nucleo.upper()
        elif i > 0 and sin_tildes(nucleo.lower()) in MINUSCULAS:
            nuevo = nucleo.lower()
        else:
            nuevo = nucleo[:1].upper() + nucleo[1:].lower()
        salida.append(prefijo + nuevo + sufijo)
    return " ".join(salida)


def sin_tildes(texto):
    return "".join(
        c for c in unicodedata.normalize("NFD", texto)
        if unicodedata.category(c) != "Mn"
    )


def limpiar(texto):
    """Normaliza espacios y recorta la traduccion al ingles tras la barra."""
    texto = re.sub(r"\s+", " ", texto)
    # El renglon de totales de cada ciclo va tan pegado a la ultima fila que a
    # veces cae dentro de ella; se corta aqui en vez de descartar la linea.
    texto = re.split(r"TOTAL DE CR[ÉE]DITOS", texto, flags=re.IGNORECASE)[0]
    # El asterisco es una llamada a nota al pie ("se programan grabaciones
    # fuera del horario"), no parte del nombre. Ademas el PDF cita esos cursos
    # sin el cuando son prerrequisito de otro, asi que dejarlo no emparejaria.
    texto = texto.strip(" .-—–*")
    texto = re.sub(r"\s+\d{4,6}$", "", texto)  # codigo que se cuela al final
    if "/" in texto:
        texto = texto.split("/")[0].strip()
    return texto


def clave(texto):
    """Forma comparable de un nombre de curso: sin tildes, sin mayusculas."""
    return re.sub(r"[^a-z0-9]+", " ", sin_tildes(texto).lower()).strip()


def lineas_de(pagina):
    """Agrupa las palabras de la pagina en lineas por su coordenada vertical."""
    lineas = []
    for palabra in sorted(pagina.extract_words(), key=lambda w: (w["top"], w["x0"])):
        if lineas and abs(palabra["top"] - lineas[-1][0]["top"]) <= 3:
            lineas[-1].append(palabra)
        else:
            lineas.append([palabra])
    return lineas


def texto_de(linea):
    return " ".join(p["text"] for p in linea)


# Lo que puede aparecer entre la columna TA y la de Requisito: creditos, horas
# y la modalidad. Nada de eso es texto de la fila.
RELLENO = re.compile(r"^(\d+|[A-Z]|Presencial|Virtual|Semipresencial|Remoto)$",
                     re.IGNORECASE)


def fragmentos_de(linea, cols):
    """Parte la linea en bloques de texto y dice a que columna pertenece cada uno.

    Se clasifica el bloque entero por donde EMPIEZA, no palabra por palabra: un
    nombre largo se estira mas alla de su columna y sus ultimas palabras caen
    encima de la columna de requisitos sin dejar de ser parte del nombre.
    """
    bloques = []
    # De izquierda a derecha: dentro de una misma linea pdfplumber puede
    # devolver la marca de la columna TA al final, porque su "top" difiere un
    # par de pixeles del resto. Sin reordenar, esa marca se pega al requisito.
    for palabra in sorted(linea, key=lambda p: p["x0"]):
        if bloques and palabra["x0"] - bloques[-1][-1]["x1"] < 12:
            bloques[-1].append(palabra)
        else:
            bloques.append([palabra])

    nombres, requisitos = [], []
    for bloque in bloques:
        texto = " ".join(p["text"] for p in bloque)
        if all(RELLENO.match(p["text"]) for p in bloque):
            continue  # creditos, horas, modalidad y el propio marcador TA
        texto = re.sub(r"^\d{4,6}\s+", "", texto)  # codigo del curso
        if not texto.strip():
            continue
        (nombres if bloque[0]["x0"] < cols["ta"] else requisitos).append(texto)
    return nombres, requisitos


def columnas_de(linea):
    """Devuelve {x de la columna TA, x de la columna Requisito} de un encabezado."""
    x_ta = x_req = None
    for palabra in linea:
        etiqueta = sin_tildes(palabra["text"]).upper()
        if etiqueta == "TA":
            x_ta = palabra["x0"]
        elif etiqueta.startswith("REQUISITO"):
            x_req = palabra["x0"]
    if x_ta is None or x_req is None:
        return None
    return {"ta": x_ta, "req": x_req}


def extraer(ruta, debug=False):
    """Devuelve [{'nivel': int, 'nombre': str, 'requisitos': [str]}] del PDF."""
    filas = []
    with pdfplumber.open(ruta) as pdf:
        nivel = None
        cols = None
        electivas = False

        for pagina in pdf.pages:
            pendientes = []   # lineas sin fila propia, a repartir despues
            de_esta_pagina = []

            for linea in lineas_de(pagina):
                bruto = texto_de(linea)

                # A partir del titulo "Asignaturas electivas" el PDF cambia de
                # tabla (agrega la columna "Nivel a usar") y todo lo que sigue
                # es electivo, que no entra en la malla. Se busca la linea y no
                # la pagina: el resumen de creditos nombra a las electivas al
                # pie de la pagina que trae los ultimos ciclos obligatorios,
                # y marcar la pagina entera se comia esos ciclos.
                if re.match(r"^Asignaturas\s+electivas", bruto, re.IGNORECASE):
                    electivas = True
                    continue

                nuevas_cols = columnas_de(linea)
                if nuevas_cols:
                    cols = nuevas_cols
                    continue

                encontrado = re.match(r"^Nivel\s+(\d+)\b", bruto, re.IGNORECASE)
                if encontrado:
                    nivel = int(encontrado.group(1))
                    continue

                if re.match(r"^(TOTAL|Resumen|Horas|TEO|Facultad|Carrera|Plan)\b",
                            bruto, re.IGNORECASE):
                    continue
                if cols is None or nivel is None or electivas:
                    continue

                fila = fila_de(linea, cols)
                if fila:
                    fila["nivel"] = nivel
                    fila["_top"] = linea[0]["top"]
                    filas.append(fila)
                    de_esta_pagina.append(fila)
                else:
                    pendientes.append(linea)

            # Solo contra las filas de esta pagina: "top" se mide desde el
            # borde de cada pagina, asi que comparar entre paginas colgaba
            # fragmentos de filas equivocadas.
            repartir(pendientes, de_esta_pagina, cols)

    return [
        {"nivel": f["nivel"], "nombre": limpiar(f["nombre"]),
         "requisitos": [texto for _, texto in sorted(f["requisitos"])]}
        for f in filas
        if f["tipo"] == "O" and f["nombre"].strip()
    ]


def fila_de(linea, cols):
    """Interpreta una linea como fila de curso, o None si no lo es.

    Una fila de curso se reconoce por el marcador de tipo (O = obligatorio,
    E = electivo) parado en la columna TA.
    """
    tipo = None
    for palabra in linea:
        # El "0" es un error de tipeo del PDF de Ing. Ambiental, que escribe con
        # cero la O de obligatorio en una fila. Sin aceptarlo, esa fila no se
        # reconoce y su nombre termina pegado al curso de arriba.
        if palabra["text"] in ("O", "E", "0") and abs(palabra["x0"] - cols["ta"]) < 12:
            tipo = "O" if palabra["text"] == "0" else palabra["text"]
            break
    if tipo is None:
        return None

    nombres, requisitos = fragmentos_de(linea, cols)
    arriba = linea[0]["top"]
    return {
        "tipo": tipo,
        "nombre": " ".join(nombres),
        # Con su altura, para poder reordenarlos: un requisito largo se parte
        # en dos lineas y solo se vuelve a unir si van en orden de arriba abajo.
        "requisitos": [(arriba, r) for r in requisitos],
    }


def repartir(pendientes, filas, cols):
    """Cuelga cada linea suelta de la fila mas cercana, segun su columna.

    Un nombre largo se parte y su continuacion puede quedar arriba o abajo de
    la linea con los numeros; lo mismo pasa con el segundo prerrequisito. La
    columna en la que cae el fragmento dice cual de los dos es.
    """
    if cols is None or not filas:
        return

    for linea in pendientes:
        cercana = min(filas, key=lambda f: abs(f["_top"] - linea[0]["top"]))
        if abs(cercana["_top"] - linea[0]["top"]) > 30:
            continue

        nombres, requisitos = fragmentos_de(linea, cols)

        if nombres:
            arriba = linea[0]["top"] < cercana["_top"]
            trozo = " ".join(nombres)
            cercana["nombre"] = (
                trozo + " " + cercana["nombre"] if arriba
                else cercana["nombre"] + " " + trozo
            )
        cercana["requisitos"].extend((linea[0]["top"], r) for r in requisitos)


def separar_requisitos(crudos, catalogo):
    """Convierte los fragmentos de la columna Requisito en nombres de curso.

    Un curso puede tener varios prerrequisitos (un fragmento cada uno) y un
    prerrequisito largo puede ocupar dos fragmentos. Para distinguirlos se
    valida contra el catalogo de cursos de la carrera: si un fragmento no es
    un curso conocido, se intenta pegarlo con el siguiente.
    """
    trozos = [re.sub(r"\s+", " ", c).strip() for c in crudos]
    trozos = [t for t in trozos if limpiar(t) and not NO_ES_CURSO.match(limpiar(t))]

    def curso(texto):
        return catalogo.get(clave(limpiar(texto)))

    salida = []
    i = 0
    while i < len(trozos):
        actual = trozos[i]

        if curso(actual):
            salida.append(curso(actual))
            i += 1
            # El nombre traia traduccion al ingles tras la barra; limpiar() la
            # corto, pero puede seguir en el fragmento de abajo. Ese sobrante no
            # es otro prerrequisito.
            if "/" in actual and i < len(trozos) and not curso(trozos[i]):
                i += 1
            continue

        if i + 1 < len(trozos) and curso(actual + " " + trozos[i + 1]):
            salida.append(curso(actual + " " + trozos[i + 1]))
            i += 2
            continue

        salida.append(limpiar(actual))
        i += 1
    return salida


def cursos_generales():
    """Lee los ciclos 1-2 de cursosGenerales.js (su fuente de verdad es ese archivo)."""
    texto = (RAIZ / "frontend" / "src" / "data" / "cursosGenerales.js").read_text("utf-8")
    porCarrera = {}
    for bloque in re.finditer(r"'([^']+)':\s*\{(.*?)\n  \}", texto, re.S):
        carrera, cuerpo = bloque.group(1), bloque.group(2)
        porCarrera[carrera] = [m.group(1) for m in re.finditer(r"'([^']+)'", cuerpo)]
    return porCarrera


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args()

    generales = cursos_generales()
    avanzados = {}
    prerequisitos = {}
    descartados = []
    fuera_de_generales = []

    for slug, carrera in CARRERAS.items():
        ruta = DIR_PDF / f"{slug}.pdf"
        if not ruta.exists():
            print(f"falta {ruta}", file=sys.stderr)
            continue

        filas = extraer(ruta, args.debug)

        # Catalogo para resolver los requisitos: generales (nombre de
        # cursosGenerales.js) + los cursos del propio PDF.
        catalogo = {clave(c): c for c in generales.get(carrera, [])}
        for fila in filas:
            catalogo.setdefault(clave(fila["nombre"]), titulo(fila["nombre"]))

        porCiclo = {}
        crudos = {}
        vistos = set()

        for fila in filas:
            if fila["nivel"] < 3:
                continue  # los ciclos 1-2 salen de cursosGenerales.js
            nombre = titulo(fila["nombre"])
            if clave(nombre) in vistos:
                continue
            vistos.add(clave(nombre))
            porCiclo.setdefault(str(fila["nivel"]), []).append(nombre)

            reqs = separar_requisitos(fila["requisitos"], catalogo)
            for r in reqs:
                if r and clave(r) not in catalogo:
                    descartados.append((carrera, nombre, r))
            crudos[nombre] = [r for r in reqs if r and clave(r) in catalogo]

        # La malla que ve la app son los ciclos 1-2 de cursosGenerales.js mas
        # estos ciclos 3+. Los planes nuevos renombraron varios generales
        # ("Precalculo" -> "Matematica Basica"), asi que un prerrequisito puede
        # existir en el PDF y no en la app; dejarlo seria una referencia muerta.
        de_la_app = {clave(c) for c in generales.get(carrera, [])}
        de_la_app |= {clave(c) for cs in porCiclo.values() for c in cs}

        pre = {}
        for nombre, reqs in crudos.items():
            buenos = [r for r in reqs if clave(r) in de_la_app]
            for r in reqs:
                if clave(r) not in de_la_app:
                    fuera_de_generales.append((carrera, nombre, r))
            if buenos:
                pre[nombre] = buenos

        avanzados[carrera] = dict(sorted(porCiclo.items(), key=lambda kv: int(kv[0])))
        prerequisitos[carrera] = pre

        total = sum(len(v) for v in porCiclo.values())
        print(f"{carrera:<24} ciclos {min(map(int, porCiclo)) if porCiclo else '-'}"
              f"-{max(map(int, porCiclo)) if porCiclo else '-'}  "
              f"cursos {total:>3}  con prerrequisito {len(pre):>3}")

    if descartados:
        print("\nRequisitos que no son un curso de la malla (se descartan):")
        for carrera, curso, req in descartados:
            print(f"  {carrera} | {curso} <- {req}")

    if fuera_de_generales:
        print("\nPrerrequisitos que son cursos de ciclo 1-2 del plan nuevo y no")
        print("estan en cursosGenerales.js (se descartan; mide cuanto se atraso"
              " ese archivo):")
        for carrera, curso, req in fuera_de_generales:
            print(f"  {carrera} | {curso} <- {req}")

    escribir(avanzados, prerequisitos)
    print(f"\nEscrito {SALIDA.relative_to(RAIZ)}")


def escribir(avanzados, prerequisitos):
    """Regenera mallasGeneradas.js conservando las carreras ya presentes."""
    previo = SALIDA.read_text("utf-8") if SALIDA.exists() else ""
    viejos_cursos = bloque_json(previo, "cursosAvanzadosGenerados")
    viejos_pre = bloque_json(previo, "prerequisitosGenerados")

    viejos_cursos.update(avanzados)
    viejos_pre.update(prerequisitos)

    cursos = dict(sorted(viejos_cursos.items()))
    pre = dict(sorted(viejos_pre.items()))

    cabecera = (
        "// Generado desde los planes de estudio (PDF) de la Universidad de Lima.\n"
        "// Ciclos 3+ por carrera; los ciclos 1-2 se toman de cursosGenerales.js.\n"
        "// Solo cursos obligatorios (sin electivos).\n"
        "//\n"
        "// NO EDITAR A MANO: regenerar con `python scripts/extraer_mallas.py`.\n"
        "// Los PDF de origen estan en scripts/pdf/.\n\n"
    )
    cuerpo = (
        f"export const cursosAvanzadosGenerados = {json.dumps(cursos, ensure_ascii=False, indent=2)};\n\n"
        f"export const prerequisitosGenerados = {json.dumps(pre, ensure_ascii=False, indent=2)};\n"
    )
    SALIDA.write_text(cabecera + cuerpo, "utf-8")


def bloque_json(texto, nombre):
    """Recupera el objeto ya generado de una version anterior del archivo."""
    inicio = texto.find(f"export const {nombre} = ")
    if inicio == -1:
        return {}
    inicio = texto.index("{", inicio)
    profundidad = 0
    for i in range(inicio, len(texto)):
        if texto[i] == "{":
            profundidad += 1
        elif texto[i] == "}":
            profundidad -= 1
            if profundidad == 0:
                return json.loads(texto[inicio:i + 1])
    return {}


if __name__ == "__main__":
    main()
