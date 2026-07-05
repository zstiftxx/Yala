# Proyecto (nombre tentativo: "Educateca")

App web para ayudar a estudiantes de la **Universidad de Lima** a hacer seguimiento de su avance de carrera, ver su **mapa curricular (malla)** con prerrequisitos, y (planeado) acceder a apuntes/resúmenes/exámenes por curso.

> El nombre "Educateca" es provisional; el usuario aún no decide el definitivo (aparece en el topbar de `Sidebar.jsx` y en `frontend/index.html`).

## Stack y cómo correr
- **React 19 + Vite** (carpeta `frontend/`), **react-router-dom v7**, **Supabase** (auth + persistencia), **lucide-react** (íconos).
- Correr: `cd frontend && npm run dev` (puerto 5173). **No** usar "Go Live"/Live Server (sirve el HTML crudo sin compilar JSX → pantalla en blanco).
- `frontend/.env` tiene `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (está en `.gitignore`, no commitear).
- Repo: `github.com/zstiftxx/Yala`, rama `main`.

## Autenticación y estado del usuario
- Login con email/password de Supabase (`Login.jsx`). Tras registrarse, si el proyecto exige confirmar correo, `signUp` no da sesión → no redirige (evita "Auth session missing").
- **`Login.jsx` rediseñado**: tarjeta centrada con marca, íconos en los campos (`lucide-react`), toggle de mostrar/ocultar contraseña, banner de mensaje tipado (error/success/info), estado `cargando` y toggle de tema propio. Reutiliza los tokens del shell: las variables CSS de `.app-shell` se comparten con `.auth-page` en `App.css`, así respeta el tema claro/oscuro.
- El estado del usuario vive en **`user_metadata` de Supabase** y se espeja en `localStorage['user']`. Campos: `carrera`, `nombre`, `ciclo`, `estadoCursos`.
- `RequireAuth` (en `App.jsx`) protege las rutas. Si una acción devuelve error de sesión, se limpia localStorage y se manda a `/`.
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

## Pendientes / ideas futuras
- Decidir el nombre de la app.
- Mallas actualizadas de las 5 carreras pendientes.
- Contenido real en `/curso/:curso` (apuntes/resúmenes/exámenes) — objetivo central de la app.
- Páginas reales de "Notificaciones", "Feedback", "Reportar" (hoy solo texto en el nav).
- Opcional: agregar códigos/créditos reales a las tarjetas.
