# Proyecto (nombre tentativo: "Educateca")

App web para ayudar a estudiantes de la **Universidad de Lima** a hacer seguimiento de su avance de carrera, ver su **mapa curricular (malla)** con prerrequisitos, y (planeado) acceder a apuntes/resúmenes/exámenes por curso.

> El nombre "Educateca" es provisional; el usuario aún no decide el definitivo (aparece en el topbar de `Sidebar.jsx` y en `frontend/index.html`).

## Grafo del codigo (usarlo ANTES de leer archivos)

Hay un grafo del codigo en `graphify-out/` (solo `frontend/src`, sin configs ni deps). Para orientarte sobre estructura, quien llama a que, o donde vive algo, **consultalo por CLI en vez de grepear el codigo**:

```
graphify explain "obtenerMallaCompleta"     # ~150 tokens: archivo, linea, y quien lo usa
graphify path "Dashboard()" "supabase"      # camino mas corto entre dos cosas
graphify query "<pregunta>" --budget 800    # traversal mas amplio, con tope
```

- **NUNCA leer `graphify-out/graph.json` entero** (~15k tokens, mas caro que grepear). Solo consultas CLI.
- `graphify-out/GRAPH_REPORT.md` (~1k tokens) sirve como orientacion general de una sola lectura.
- El grafo da estructura, no contenido: para editar codigo igual hay que leer el archivo. Y **no incluye CSS ni JSX renderizado**.
- Se desactualiza al cambiar el codigo. Reconstruir (segundos, sin API key, cero tokens):
  ```
  GRAPHIFY_OUT=/d/proyecto/WAAAAAAAA/graphify-out graphify update frontend/src
  ```
  El `GRAPHIFY_OUT` es obligatorio: sin el, escribe la salida dentro de `frontend/src/`.
- `graphify-out/` esta en `.gitignore` a proposito (repo publico). No hay respaldo: si se borra, se regenera.

## Stack y cómo correr
- **React 19 + Vite** (carpeta `frontend/`), **react-router-dom v7**, **Supabase** (auth + persistencia), **lucide-react** (íconos).
- Correr: `cd frontend && npm run dev` (puerto 5173). **No** usar "Go Live"/Live Server (sirve el HTML crudo sin compilar JSX → pantalla en blanco).
- `frontend/.env` tiene `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (está en `.gitignore`, no commitear).
- Repo: `github.com/zstiftxx/Yala`, rama `main`.
- **Desplegado en Vercel** (deploy automático en cada `git push` a `main`). Config: *Root Directory* = `frontend`, y las dos vars `VITE_SUPABASE_*` cargadas como Environment Variables.
- **`frontend/vercel.json` es obligatorio**: reescribe todas las rutas a `index.html`. Sin eso, entrar directo a `/home` (o recargar ahí, o abrir un link compartido) devuelve el 404 **de Vercel**, porque las rutas de React Router no existen como archivos en el servidor. Vercel no agrega ese fallback solo en proyectos Vite. Va en `frontend/` y no en la raíz del repo porque el *Root Directory* es `frontend`. Los archivos que sí existen (`/assets/*`) tienen prioridad sobre la reescritura. El dominio de Vercel debe estar en Supabase → Authentication → URL Configuration (Site URL + Redirect URLs) para que el login funcione desde el link público.

## Autenticación y estado del usuario
- Login con email/password de Supabase (`Login.jsx`). El código maneja ambos casos: si el proyecto exige confirmar correo, `signUp` no da sesión → no redirige (evita "Auth session missing"); si no, entra directo.
- **Confirmación de correo DESACTIVADA** en Supabase (2026-07-05) → el registro da sesión al instante y redirige. El toggle vive en *Authentication → Sign In / Providers → sección signups* (NO en el proveedor Email). Se apagó porque el email por defecto de Supabase tiene un rate limit bajísimo (~2-3/hora) y los correos de confirmación no llegaban, bloqueando a quienes probaban la app.
- **`Login.jsx` rediseñado**: tarjeta centrada con marca, íconos en los campos (`lucide-react`), toggle de mostrar/ocultar contraseña, banner de mensaje tipado (error/success/info), estado `cargando` y toggle de tema propio. Reutiliza los tokens del shell: las variables CSS de `.app-shell` se comparten con `.auth-page` en `App.css`, así respeta el tema claro/oscuro.
- El estado del usuario vive en **`user_metadata` de Supabase** y se espeja en `localStorage['user']`. Campos: `carrera`, `nombre`, `ciclo`, `estadoCursos`.
- **`UserProvider.jsx` + `useUser.js` son la fuente única de ese estado.** Ninguna página debe parsear `localStorage['user']` ni llamar a `supabase.auth.updateUser` por su cuenta: se usa `useUser()`. El provider envuelve la app en `main.jsx`.
  - `actualizarMetadata(parcial, { inmediato })` para perfil/carrera; `cambiarEstadoCurso(curso, estado)` para la malla.
  - Los cambios se aplican en local al instante (optimista) y se **agrupan con debounce de 800 ms en una sola llamada** a `updateUser`. Marcar 40 cursos = 1 request, no 40. También se manda al ocultar/cerrar la pestaña.
  - `guardado` (`limpio` / `guardando` / `error`) alimenta el indicador del topbar del Dashboard.
- `RequireAuth` (en `App.jsx`) protege las rutas y lee del contexto: el provider verifica la sesión real contra Supabase (`getSession` + `onAuthStateChange`), no solo el espejo de localStorage. Si la sesión cae, se limpia y se manda a `/`.
- **Ruta 404**: `NoEncontrado.jsx` en `path="*"`. No usa el shell porque puede llegar alguien sin sesión.
- Tema claro/oscuro: toggle en el topbar, guardado en `localStorage['tema']`. El atributo `data-theme` va en **`<html>`**, no en el contenedor de cada pantalla: así el fondo también pinta `<body>`. `index.html` lo aplica con un script inline antes de que React monte, para que no haya flash blanco al cargar en oscuro; `useTema.js` lo mantiene sincronizado junto con el `<meta name="theme-color">`.

## Sistema de diseño (2026-07-23)

Carácter buscado: **cálido y estudiantil**, no panel administrativo. Todos los tokens están en `frontend/src/index.css`.

- **Grises cálidos** (con algo de rojo/amarillo), no el gris azulado por defecto: al lado del naranja, el gris frío se ve sucio.
- **Tres naranjas, cada uno con su trabajo.** El naranja de marca `#f2670a` da 3.1:1 sobre blanco y AA pide 4.5:1, así que **nunca lleva texto**:
  - `--shell-accent` — forma pura (anillo de progreso, bordes, el punto de notificación).
  - `--shell-accent-fuerte` — texto naranja sobre fondo claro.
  - `--shell-accent-solido` + `--shell-accent-texto` — fondo de botón y su texto. En oscuro se invierten (naranja claro de fondo, texto oscuro encima).
- Escalas `--fs-*` (tipografía), `--sp-*` (espaciado), `--r-*` (radios, más redondeados a propósito) y `--sombra-*` (tintadas de marrón, no negro puro). **Usarlas en vez de px sueltos.**
- `--topbar-h` la comparten la topbar sticky y el nav lateral que se cuelga debajo.
- **Todos los pares de color pasan AA (≥4.5:1) en ambos temas.** Al tocar un color, volver a medirlo: es fácil romperlo sin notarlo.

### Piezas nuevas
- **`EstadoCurso.jsx`** — reemplaza los `<select>` de estado en Dashboard, MisCursos y CursoDetalle. Un toque avanza al siguiente estado (no_cursado → en_curso → aprobado); las flechas del teclado también recorren. Un select de 3 opciones costaba 3 toques en móvil y no se podía estilar. **Conserva su texto incluso a 375px**: el color solo no comunica el estado, y quien no distingue verde de azul se quedaba sin pista.
- **`AnilloProgreso.jsx`** — el anillo SVG del héroe del Dashboard. Sin librería de gráficos: es un círculo con `stroke-dasharray`.
- **`.curso-fila` + `.lista-filas`** — el patrón de lista de cursos. Filas separadas por una línea, no tarjetas dentro de tarjetas.
- **`.page-head`** (con `.page-head-texto` / `.page-head-acciones`) reemplazó al viejo `.topbar` de las páginas.

## Rutas
`/` Login · `/carrera` onboarding de carrera · `/home` Dashboard · `/perfil` · `/mis-cursos` · `/curso/:curso` · `/mapa-curricular` · `/notificaciones` · `/feedback` · `/reportar`.

## Estructura clave
- **`Sidebar.jsx`** = shell de la app (topbar + nav + contenido); prop `sinNav` oculta el nav lateral (lo usa el mapa curricular).
- **`useTema.js`** — el toggle claro/oscuro. Lo usan Login, Sidebar, NoEncontrado y SeleccionCarrera; no duplicar ese `localStorage['tema']` en páginas nuevas.
- **`FormularioMensaje.jsx`** — Feedback y Reportar son el mismo formulario (tipo + mensaje + insert en Supabase) y solo pasan textos. Si aparece un tercer formulario de ese estilo, va por aquí.
- **Estilos**: los **tokens** viven en `index.css` (`:root` y `:root[data-theme='dark']`); los **componentes** en `App.css`. **No** meter estilos inline nuevos ni colores hardcodeados: todo sale de los tokens, que son los que hacen funcionar el modo oscuro. Ver "Sistema de diseño" más abajo.
- **Estados de curso**: 3 valores — `no_cursado` / `en_curso` / `aprobado` — en `estadoCursos` (objeto `curso -> estado`). El Dashboard calcula Progreso/Aprobados/En curso/No cursados de ahí.
- **`MisCursos.jsx`** = catálogo de toda la malla agrupado por ciclo, con buscador (compara sin tildes) y filtros por estado. Es la puerta de entrada a `/curso/:curso`.
- **`MapaCurricular.jsx`**: grilla por ciclos, flechas SVG de prerrequisito, clic en un curso resalta su camino (prereqs + dependientes), panel para cambiar estado.
  - **Ya NO comprime los ciclos para que entren todos**: cada columna tiene un mínimo de 132px y el mapa se **desliza en horizontal**. Con 10 ciclos en un teléfono, "que entre todo" significaba columnas de ~30px. El scroll vive en el propio `.malla-grid`, no en la página.
  - Las flechas son **ortogonales** (sale, baja por su canal, entra) con las esquinas redondeadas, no curvas en S. Cada una baja por el hueco anterior a su columna destino, y las que comparten destino se reparten en abanico dentro de ese hueco.
  - **Dato medido, por si se quiere revisar**: el trazado ortogonal cruza *más* que el bezier anterior (44 pares vs 35 en Ing. de Sistemas). Se eligió igual porque los cruces en ángulo recto se siguen con la vista mucho mejor que las diagonales en ángulos arbitrarios. Si se quiere volver atrás, el cambio está aislado en `construirPath`.
  - Las coordenadas del SVG son del **contenido**, no de lo visible: `calcular()` vuelve a sumar `scrollLeft/scrollTop` a lo que devuelve `getBoundingClientRect`. Verificado que un recálculo con el mapa desplazado no mueve las flechas.
  - Sin nada seleccionado las flechas van a opacidad baja (0.22 / 0.55): con ~40 a la vez son el fondo del mapa, no el contenido. Al tocar un curso, su camino sube a 1.

## Datos de mallas (`frontend/src/data/`)
- **`cursosGenerales.js`** — ciclos 1-2 (generales) de las 14 carreras. **Fuente de verdad de los generales**: aunque un PDF viejo difiera, se conservan estos.
- **`mallaCurricular.js`** — fusiona generales (1-2) + `cursosAvanzados` (ciclo 3+) + `prerequisitos`. Ing. de Sistemas está escrito a mano; el resto se importa de `mallasGeneradas.js`.
- **`mallasGeneradas.js`** — **generado, no editar a mano.** Solo ciclos 3+, sin electivos, traducciones al inglés recortadas. Se regenera con:
  ```
  python scripts/extraer_mallas.py
  ```
  Requiere `pdfplumber`. Reescribe el archivo entero, pero **conserva las carreras que ya estaban** y solo pisa las que extrae (`CARRERAS` en el script), así que agregar una carrera no borra las demás.

### `scripts/extraer_mallas.py` y `scripts/pdf/`
Los 5 PDF de los que salieron Ing. Industrial, Derecho, Marketing, Comunicaciones e Ing. Ambiental **están versionados** en `scripts/pdf/` (2026-07-23, ~1 MB, bajados de `ulima.edu.pe`). Las otras 8 carreras se generaron antes sin dejar rastro de su fuente: si hay que rehacerlas, toca volver a bajar el PDF y sumar la carrera a `CARRERAS`.

El script **no parsea el texto plano del PDF, usa las coordenadas de cada palabra**, y ese es el punto: una fila de la tabla ocupa hasta tres líneas, y la mitad de un nombre largo cae *arriba* de la línea con los números mientras que un segundo prerrequisito cae *abajo*. En texto plano las dos se ven idénticas; lo que las distingue es en qué columna están. Cosas que costaron y conviene no volver a romper:
- Los fragmentos se clasifican **enteros por donde empiezan**, no palabra por palabra: un nombre largo se estira más allá de su columna y sus últimas palabras caen sobre la de requisitos sin dejar de ser el nombre.
- Las palabras de una línea se ordenan **por `x0`**: pdfplumber a veces devuelve la marca de la columna TA al final, porque su `top` difiere un par de píxeles, y se pegaba al requisito.
- Los fragmentos sueltos se cuelgan solo de filas **de la misma página**: `top` se mide desde el borde de cada página.
- El corte de las electivas busca el **título** "Asignaturas electivas", no la palabra en la página: el resumen de créditos la nombra al pie de la página que trae los últimos ciclos obligatorios, y marcar la página entera se comía los ciclos 9 y 10.
- Un prerrequisito no resuelto **se descarta y se imprime**; nunca se adivina. Cada corrida deja el listado a la vista.

### Estado de las mallas
**Las 14 carreras tienen malla completa** (verificado 2026-07-23 cargando `obtenerMallaCompleta` desde el navegador). Derecho y Psicología llegan al ciclo 12; el resto a 9 o 10.

Dos salvedades que vienen de la fuente, no del código:
- **Comunicaciones queda rala a propósito** (37 cursos en 9 ciclos, contra ~52 de las demás): de ciclo 5 en adelante su plan es casi todo electivo, con 3-4 obligatorios por ciclo. No es una extracción incompleta, es la forma real del plan. Ese era el "muy corta" por el que se había descartado antes.
- **`cursosGenerales.js` quedó atrasado respecto de los planes 2025+**, que renombraron los generales (`Precálculo` → `Matemática Básica`, `Fundamentos de Economía` → `Economía y Empresa`, y `Matemática Aplicada a los Negocios` ya no lleva I/II). Como ese archivo es la fuente de verdad de los ciclos 1-2, 7 prerrequisitos de ciclo 3 que apuntan a un general renombrado **se descartan** para no dejar referencias muertas. El script los imprime aparte, y esa lista mide cuánto se atrasó el archivo. Actualizarlo es una decisión aparte: `estadoCursos` guarda los cursos **por nombre**, así que renombrarlos les borra el avance a quienes ya marcaron esos cursos.
- El PDF de Ing. Ambiental tiene dos erratas de la propia ULima: una fila marca el obligatorio con un cero (`0`) en vez de `O` (el script lo acepta a propósito), y el curso "Formulación y Diseño de Proyectos **Sostenibles**" aparece citado como "...Proyectos **Ambientales**" en el prerrequisito de Gestión de Proyectos. Ese prerrequisito se descarta: son el mismo curso a la vista, pero corregirlo sería inventar.

## Convenciones
- Mensajes de commit en español, cuerpo en ASCII plano (sin tildes en el cuerpo). Commitear solo cuando el usuario lo pide.
- Verificar cambios de UI con las herramientas de preview antes de dar por hecho.
- **No inventar datos curriculares** (códigos de curso, créditos): se omitieron a propósito. Los PDF sí traen códigos/créditos reales si más adelante se quieren agregar.

## Notificaciones / Feedback / Reportar
- **`Notificaciones.jsx`** (`/notificaciones`): notificaciones **derivadas del estado local** (no hay backend de notificaciones). Genera: bienvenida, "completa tu perfil" (si falta nombre/carrera/ciclo), "N cursos en curso", y "malla en construcción" si la carrera **no** está en `carrerasConMallaCompleta` (antes era una lista escrita a mano, con las tildes mal, y ese aviso nunca salía para las dos ingenierías). Desde 2026-07-23 las 14 carreras tienen malla, así que ese aviso ya no le sale a nadie; el código se deja porque vuelve a servir si se agrega una carrera nueva. Estado leído/no-leído en `localStorage['notif_leidas']`. La campana del topbar también lleva aquí.
- **`Feedback.jsx`** (`/feedback`) y **`Reportar.jsx`** (`/reportar`): formularios (tipo + mensaje) que **insertan en Supabase** (tablas `feedback` y `reportes`). Manejan sin sesión → limpian localStorage y van a `/`; si la tabla no existe (código `42P01`) muestran aviso pidiendo correr el SQL. Reportar guarda también la `carrera`.
- **SQL de las tablas** en `supabase/tablas.sql` — **ya corrido (2026-07-20)**. Crea `feedback` y `reportes` con RLS (insert/select solo del propio `user_id`; tú ves todo desde el Table editor, que ignora RLS).
- **`supabase/materiales.sql`** — tabla `materiales` (apuntes/resúmenes/exámenes por curso) para el objetivo central de la app. `user_metadata` no sirve para esto: es por usuario, no compartido. Material = **enlace**, no archivo subido (sin Storage por ahora). El curso se identifica por nombre, igual que `estadoCursos`. **Ya corrido (2026-07-20)**: verificado que existe, que el `select` anónimo devuelve vacío en vez de error y que el `insert` anónimo lo rechaza la RLS con `42501`.

## Materiales por curso (`/curso/:curso`)
- **`src/materiales.js`** es la única capa que toca la tabla `materiales`: listar, crear, borrar, y traducir errores de Postgres (incluye el `42P01` de tabla inexistente). Las páginas no llaman a `supabase.from('materiales')` por su cuenta.
- `normalizarUrl` solo acepta `http(s)`. La URL termina en un `href`, así que un `javascript:` pegado por otro usuario sería un XSS de un clic. No relajar eso.
- La lista vive en un componente hijo con `key={curso}` para que se remonte al saltar de un curso a otro.
- **Moderación reactiva, no previa** (decidido 2026-07-23): el material se publica al instante (`crearMaterial` inserta `aprobado: true`) y se **baja** poniendo `aprobado = false` desde el Table editor cuando llega un reporte por `/reportar`.
  - Antes `aprobado` arrancaba en `false` y **nada en la app lo ponía en `true`**: con la policy de select (`aprobado or auth.uid() = user_id`), cada quien veía solo sus propios materiales y no se compartía nada con nadie. La función central de la app no funcionaba. Si quedaron filas viejas en `false`, hay que subirlas a mano.
  - La policy de update deja que el autor toque `aprobado` en lo suyo, y es intencional. Para pasar a aprobación previa haría falta `revoke update (aprobado) ... from authenticated`, porque RLS filtra filas y no columnas.
- Se llega a un curso desde `/mis-cursos` (catálogo con buscador) o desde el panel del mapa curricular.

## Pendientes / ideas futuras
- **Probar el flujo real con sesión** ahora que las tablas existen: enviar un feedback, un reporte, y subir/borrar un material desde `/curso/:curso`.
- Decidir el nombre de la app.
- **Decidir si se actualiza `cursosGenerales.js`** a los generales de los planes 2025+ (ver "Estado de las mallas"): recupera 7 prerrequisitos, pero renombrar cursos le borra el avance a quien ya los marcó.
- **Verificado en pantalla con sesión real (2026-07-23)**: mapa curricular (Derecho 12 ciclos, Comunicaciones, Ing. Ambiental), Mis Cursos, detalle de curso, Notificaciones y Dashboard. Sin errores de consola. Para llegar ahí **el login lo hace el usuario** en el panel del navegador; a partir de ahí la sesión sirve para todo lo demás. Queda sin revisar el **onboarding de carrera** (`/carrera`), que solo aparece en una cuenta nueva.
- **En el mapa, un curso sin flechas es ambiguo**: se ve igual "no tiene prerrequisitos" que "no tenemos el dato". El Dashboard sí los separa ("Sin prerrequisitos registrados (N)", vía `sinDatos` de `cursosDisponibles`); el mapa no. Se nota sobre todo en Ing. Ambiental (17 de 41) y Mecatrónica (31 de 51).
- Opcional: agregar códigos/créditos reales a las tarjetas.
