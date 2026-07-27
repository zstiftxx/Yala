# Yala

App web para estudiantes de la **Universidad de Lima**: seguir el avance de carrera,
ver la **malla curricular** con sus prerrequisitos, compartir apuntes por curso y
practicar con un **asistente de estudio con IA** a partir de material propio.

> El nombre es provisional.

---

## Correr el proyecto

Necesitas **Node 20 o superior**.

```bash
git clone https://github.com/zstiftxx/Yala.git
cd Yala/frontend
npm install
```

Antes de levantarlo hace falta configurar Supabase (siguiente sección). Después:

```bash
npm run dev
```

Queda en <http://localhost:5173>.

> **No uses "Go Live" / Live Server de VS Code.** Sirve el HTML crudo sin compilar
> el JSX y solo vas a ver una pantalla en blanco. Tiene que ser `npm run dev`.

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm run dev` | servidor de desarrollo (puerto 5173) |
| `npm run build` | build de producción a `dist/` |
| `npm run preview` | sirve el build ya hecho |
| `npm run lint` | ESLint |

## Configurar Supabase

El archivo `frontend/.env` **no está en el repo** (tiene credenciales, está en
`.gitignore`). Copia el ejemplo y llénalo:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhb...
```

Los dos valores salen de tu proyecto en Supabase → *Settings → API*. Si trabajas
sobre el proyecto compartido, pídeselos a quien lo administra: no se commitean.

Para una instancia propia desde cero, corre en el *SQL editor* de Supabase:

1. [`supabase/tablas.sql`](supabase/tablas.sql) — tablas `feedback` y `reportes`.
2. [`supabase/materiales.sql`](supabase/materiales.sql) — tabla `materiales`.
3. [`supabase/uso-ia.sql`](supabase/uso-ia.sql) — cuota diaria del asistente.

Todas llevan RLS. El asistente además necesita desplegar la Edge Function; los
pasos están en [`supabase/functions/README.md`](supabase/functions/README.md).

Recomendado para desarrollo: en *Authentication → Sign In / Providers → signups*,
dejar **desactivada** la confirmación por correo, así el registro entra directo.

## Estructura

```
frontend/
  src/
    data/          mallas curriculares de las 14 carreras
    *.jsx          pantallas y componentes
    *.js           capas de datos (materiales, asistente, errores)
    index.css      tokens de diseño (colores, espaciado, tipografía)
    App.css        estilos de componentes
supabase/
  *.sql            esquema de las tablas
  functions/       Edge Function del asistente de IA
scripts/
  extraer_mallas.py  genera las mallas desde los PDF de la ULima
docs/
```

Puntos de entrada útiles: `App.jsx` (rutas), `Sidebar.jsx` (shell de la app),
`UserProvider.jsx` (estado del usuario).

## Antes de tocar código

Lee [`CLAUDE.md`](CLAUDE.md). Documenta las decisiones que ya se tomaron y por
qué, y varias no son obvias desde el código. En corto:

- **Los tokens de color/espaciado viven en `index.css`.** No metas colores
  hardcodeados ni estilos inline: son los que hacen funcionar el modo oscuro.
- **`data/mallasGeneradas.js` es generado**, no lo edites a mano.
- **No inventes datos curriculares** (códigos de curso, créditos): se omitieron
  a propósito.
- Mensajes de commit en español.

## Despliegue

Vercel, automático en cada push a `main`. *Root Directory* = `frontend`, con las
dos variables `VITE_SUPABASE_*` cargadas como Environment Variables.
[`frontend/vercel.json`](frontend/vercel.json) es obligatorio: sin esa reescritura
a `index.html`, entrar directo a `/home` devuelve 404.
