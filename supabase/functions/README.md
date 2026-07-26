# Edge Functions (Educateca / Yala)

La unica funcion por ahora es `asistente`: recibe material del alumno (PDF o
imagen) mas una pregunta, llama al modelo y devuelve la respuesta.

**Por que existe:** la app es React puro en el navegador. Una API key puesta en
una variable `VITE_*` termina dentro del bundle que descarga cualquiera que
entre a la pagina. La key vive aqui, en el servidor, y nunca sale.

## Paso 1 — crear la tabla de cuota

En Supabase -> SQL Editor, pegar y correr:

```
supabase/uso-ia.sql
```

Crea `uso_ia` (contador por usuario y por dia) y las dos funciones que usa la
Edge Function. **Sin esto la funcion responde 500 pidiendo justamente que lo
corras.**

## Paso 2 — la CLI (sin instalar nada)

**No uses `npm install -g supabase`**: Supabase no soporta la instalacion
global por npm. En Windows la via oficial es Scoop, pero no hace falta
instalar nada — `npx` descarga y ejecuta la CLI sola:

```bash
npx supabase@latest --version
```

`supabase init` ya esta corrido (por eso existe `supabase/config.toml`).
Falta iniciar sesion, y **este comando lo tienes que correr tu**: abre el
navegador para que autorices.

```bash
npx supabase@latest login
```

> **No hace falta `supabase link`.** Enlazar pide la contrasena de la base de
> datos y sirve para migraciones; para desplegar funciones alcanza con pasar
> `--project-ref` en cada comando. Un paso menos y una contrasena menos.

El `project-ref` sale de la URL del panel de Supabase
(`https://supabase.com/dashboard/project/<ESTO>`).

## Paso 3 — cargar los secretos

La API key va como secreto de la funcion, **nunca** en `frontend/.env`.

Por defecto la funcion usa **Gemini en su capa gratuita**, para prototipar sin
pagar. La key se saca en <https://aistudio.google.com/apikey> (no pide tarjeta):

```bash
npx supabase@latest secrets set GEMINI_API_KEY=AIza... --project-ref TU_PROJECT_REF
```

### ⚠️ La capa gratuita NO sirve con alumnos reales

Los terminos de Google dicen que en los servicios no pagados usan lo que envias
para entrenar sus modelos, y que **"revisores humanos pueden leer, anotar y
procesar"** la entrada y la salida. Ademas advierten: *"no envies informacion
sensible, confidencial o personal"*.

- **Tu probando con tus propios examenes** -> perfecto, sin riesgo.
- **Un alumno subiendo su material** -> no. Su examen, con su letra y a veces
  su nombre, lo leeria un tercero sin que el se entere.

Antes de abrir la app a usuarios reales hay que pasar a un plan de pago
(Gemini pagado o Anthropic). Con Anthropic es cambiar dos secretos:

```bash
npx supabase@latest secrets set PROVEEDOR_IA=anthropic --project-ref TU_PROJECT_REF
npx supabase@latest secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref TU_PROJECT_REF
```

No hay que tocar codigo: el portero (sesion, cuota, validacion del archivo) es
el mismo para los dos.

### Secretos opcionales

| Secreto | Default | Para que |
|---|---|---|
| `PROVEEDOR_IA` | `gemini` | `gemini` (gratis) o `anthropic` (de pago) |
| `MODELO_IA` | `gemini-flash-latest` / `claude-opus-5` | Cambiar de modelo es cambiar este string |
| `LIMITE_DIARIO_IA` | `10` | Consultas por usuario por dia — es el freno de gasto |
| `ORIGENES_PERMITIDOS` | `*` | En produccion, poner el dominio de Vercel |

`SUPABASE_URL` y `SUPABASE_ANON_KEY` las inyecta Supabase sola; no hay que
cargarlas.

## Paso 4 — desplegar

```bash
npx supabase@latest functions deploy asistente --project-ref TU_PROJECT_REF
```

## Probar

Con la app corriendo y **sesion iniciada**, desde la consola del navegador
(F12 -> Console). El cliente `supabase` vive dentro de un modulo, no en
`window`, asi que el token se saca de localStorage:

```js
const k = Object.keys(localStorage).find(x => x.startsWith('sb-') && x.endsWith('-auth-token'));
const s = JSON.parse(localStorage.getItem(k));
const token = s.access_token ?? s.currentSession?.access_token;
const r = await fetch('<TU_URL_SUPABASE>/functions/v1/asistente', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ pregunta: 'Responde solo con la palabra: funciona.' })
});
console.log(r.status, await r.json());
```

Debe devolver `200` y `{ texto, usadas, limite, uso }`.

### Que significa cada error

| Respuesta | Que paso |
|---|---|
| `Missing authorization header` | Es el gateway de Supabase, la funcion ni corrio. Falta el header. |
| `Tu sesion expiro.` | La funcion SI corre, pero el token no es de un usuario (p.ej. mandaste la anon key). Inicia sesion. |
| `Falta crear la cuota en Supabase` | Quedo pendiente el Paso 1 (correr `uso-ia.sql`). |
| `El asistente no pudo responder` | Fallo la llamada al modelo. Ver los logs con el comando de abajo. |
| `No se pudo consultar al asistente` **desde la app**, pero el fetch de arriba funciona | Casi seguro CORS. Ver abajo. |

### Cuando la app falla y el `fetch` a mano funciona

Paso el 2026-07-26 y despista mucho, porque la prueba de arriba da 200 y la
pantalla da un error generico. La clave es que **la peticion no llega a la
funcion**: el contador de `usadas` no sube.

El navegador manda primero un preflight `OPTIONS`, y si la respuesta no nombra
**todas** las cabeceras de la peticion, la bloquea antes de que salga.
`supabase.functions.invoke` agrega `x-client-info` y `apikey` por su cuenta; el
`fetch` de arriba, escrito a mano, solo manda `authorization` y
`content-type`. Por eso uno pasa y el otro no.

La lista vive en `cabecerasCors()` dentro de `index.ts` y hoy dice:

```
authorization, x-client-info, apikey, content-type
```

Si algun dia se agrega una cabecera propia a la peticion, hay que sumarla ahi y
**volver a desplegar**.

### Diagnosticar un 502

La CLI **no tiene** `functions logs`. Los logs estan en el panel web:
Edge Functions -> asistente -> Logs.

Mas rapido: encender el modo debug y volver a desplegar. La respuesta del 502
pasa a incluir el motivo real en un campo `detalle`.

```bash
npx supabase@latest secrets set DEBUG_IA=1 --project-ref TU_PROJECT_REF
```

**Apagarlo cuando termines** (`DEBUG_IA=0`): el error de la API de arriba puede
traer detalles que el usuario final no tiene por que ver.

Para comprobar la key de Gemini y que modelos acepta, sin pasar por la funcion:

```bash
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=TU_KEY_GEMINI"
```

> ⚠️ **Que un modelo salga en esa lista NO significa que lo puedas usar.**
> Google retira versiones concretas "para usuarios nuevos": siguen en el
> catalogo de `/models`, pero `generateContent` responde **404 — "no longer
> available to new users"** si tu proyecto se creo despues del corte. Paso con
> `gemini-2.5-flash`. Por eso el default es el alias `gemini-flash-latest`,
> que siempre apunta al vigente. La unica forma de verificar de verdad un
> modelo es intentar generar con el, no listarlo.

Para probar en local sin desplegar:

```bash
npx supabase@latest functions serve asistente --env-file supabase/.env.local
```

(Ese `.env.local` con la key **no se commitea**: ya lo cubren el `.gitignore`
de la raiz y el que creo `supabase init`.)

## Costo

**Con `PROVEEDOR_IA=gemini` (el default) no se paga nada.** Lo que limita es la
cuota de Google, no el dinero: del orden de 10 peticiones por minuto y unos
cientos al dia para Flash. Ojo, esa cuota es **por proyecto, no por usuario**:
la comparten todos, asi que una sola persona insistiendo puede dejar sin
servicio al resto ese dia. El `LIMITE_DIARIO_IA` es justamente lo que lo evita.

Con `PROVEEDOR_IA=anthropic` si se paga. Con el flujo de "sube un examen y
practica sobre el", una sesion sale alrededor de **$0.07 con Sonnet 5** o
**~$0.18 con Opus 5** (estimado: 10 paginas, 5 ejercicios).

Dos cosas ya estan puestas para abaratar:

- **Cache del documento** — en la ruta de Anthropic el archivo va marcado con
  `cache_control`, asi que la segunda pregunta sobre el mismo examen lo lee a
  una decima parte del precio. El campo `uso.cacheLeido` de la respuesta deja
  ver si esta pegando.
- **Tope diario por usuario** — `LIMITE_DIARIO_IA`. Es lo que impide que una
  sola persona gaste el presupuesto del mes.

El gasto real por usuario queda en `uso_ia.tokens_entrada` / `tokens_salida`,
y sirve igual en la capa gratuita para ver cuanto consumirias si pagaras.
