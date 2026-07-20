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
- **Desplegado en Vercel** (deploy automático en cada `git push` a `main`). Config: *Root Directory* = `frontend`, y las dos vars `VITE_SUPABASE_*` cargadas como Environment Variables. El dominio de Vercel debe estar en Supabase → Authentication → URL Configuration (Site URL + Redirect URLs) para que el login funcione desde el link público.

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
- Tema claro/oscuro: toggle en el topbar, guardado en `localStorage['tema']`.

## Rutas
`/` Login · `/carrera` onboarding de carrera · `/home` Dashboard · `/perfil` · `/mis-cursos` · `/curso/:curso` (stub) · `/mapa-curricular`.

## Estructura clave
- **`Sidebar.jsx`** = shell de la app (topbar + nav + contenido); prop `sinNav` oculta el nav lateral (lo usa el mapa curricular).
- **Estados de curso**: 3 valores — `no_cursado` / `en_curso` / `aprobado` — en `estadoCursos` (objeto `curso -> estado`). El Dashboard calcula Progreso/Aprobados/En curso/No cursados de ahí.
- **`MapaCurricular.jsx`**: grilla por ciclos (encaja sin scroll), flechas SVG de prerrequisito, clic en un curso resalta su camino (prereqs + dependientes), panel para cambiar estado.

## Datos de mallas (`frontend/src/data/`)
- **`cursosGenerales.js`** — ciclos 1-2 (generales) de las 14 carreras. **Fuente de verdad de los generales**: aunque un PDF viejo difiera, se conservan estos.
- **`mallaCurricular.js`** — fusiona generales (1-2) + `cursosAvanzados` (ciclo 3+) + `prerequisitos`. Ing. de Sistemas está escrito a mano; el resto se importa de `mallasGeneradas.js`.
- **`mallasGeneradas.js`** — generado automáticamente desde los PDF oficiales (con pdfplumber). Solo ciclos 3+, sin electivos, traducciones al inglés recortadas.

### Estado de las mallas
- **Completas (9)**: Ing. de Sistemas + Administración, Arquitectura, Contabilidad y Finanzas, Economía, Ing. Civil, Ing. Mecatrónica, Negocios Internacionales, Psicología.
- **Pendientes (5)** — muestran solo ciclos 1-2 hasta tener mallas actualizadas: **Ing. Industrial** (PDF con columnas rotas), **Marketing** (electivos colados), **Comunicaciones** (muy corta), **Derecho** (mal mapeada), **Ing. Ambiental** (un ciclo de electivos de más).

## Convenciones
- Mensajes de commit en español, cuerpo en ASCII plano (sin tildes en el cuerpo). Commitear solo cuando el usuario lo pide.
- Verificar cambios de UI con las herramientas de preview antes de dar por hecho.
- **No inventar datos curriculares** (códigos de curso, créditos): se omitieron a propósito. Los PDF sí traen códigos/créditos reales si más adelante se quieren agregar.

## Notificaciones / Feedback / Reportar
- **`Notificaciones.jsx`** (`/notificaciones`): notificaciones **derivadas del estado local** (no hay backend de notificaciones). Genera: bienvenida, "completa tu perfil" (si falta nombre/carrera/ciclo), "N cursos en curso", y "malla en construcción" si la carrera está en la lista de pendientes. Estado leído/no-leído en `localStorage['notif_leidas']`. La campana del topbar también lleva aquí.
- **`Feedback.jsx`** (`/feedback`) y **`Reportar.jsx`** (`/reportar`): formularios (tipo + mensaje) que **insertan en Supabase** (tablas `feedback` y `reportes`). Manejan sin sesión → limpian localStorage y van a `/`; si la tabla no existe (código `42P01`) muestran aviso pidiendo correr el SQL. Reportar guarda también la `carrera`.
- **SQL de las tablas** en `supabase/tablas.sql` — correr **una vez** en Supabase → SQL Editor. Crea `feedback` y `reportes` con RLS (insert/select solo del propio `user_id`; tú ves todo desde el Table editor, que ignora RLS). **Pendiente hasta que se corra ese SQL los envíos fallan con el aviso.**
- **`supabase/materiales.sql`** — tabla `materiales` (apuntes/resúmenes/exámenes por curso) para el objetivo central de la app. `user_metadata` no sirve para esto: es por usuario, no compartido. Material = **enlace**, no archivo subido (sin Storage por ahora). El curso se identifica por nombre, igual que `estadoCursos`. **Aún no se corrió y la app todavía no lo lee**: `/curso/:curso` sigue siendo stub.

## Pendientes / ideas futuras
- Correr `supabase/tablas.sql` en Supabase para que Feedback/Reportar guarden de verdad.
- Decidir el nombre de la app.
- Mallas actualizadas de las 5 carreras pendientes.
- Contenido real en `/curso/:curso` (apuntes/resúmenes/exámenes) — objetivo central de la app.
- Opcional: agregar códigos/créditos reales a las tarjetas.
