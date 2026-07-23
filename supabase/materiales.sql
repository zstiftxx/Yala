-- Materiales por curso: apuntes, resumenes y examenes (Educateca / Yala)
-- Correr una sola vez en Supabase: SQL Editor -> pegar esto -> Run.
-- Independiente de tablas.sql; se puede correr antes o despues.
--
-- Por ahora el material es un ENLACE (Drive, Notion, etc.), no un archivo
-- subido: evita la cuota de Storage y decidir moderacion de archivos. Si mas
-- adelante se migra a Supabase Storage, se agrega una columna `ruta_archivo`
-- y `url` pasa a ser opcional; el resto del esquema no cambia.
--
-- El curso se identifica por su NOMBRE, que es la clave que ya usa la app
-- (estadoCursos, mallaCurricular.js, /curso/:curso). Cuando existan codigos
-- reales de curso conviene migrar a esos.

create table if not exists public.materiales (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete set null,
  carrera    text,                    -- carrera de quien lo subio (contexto)
  curso      text not null,           -- nombre del curso, tal como en la malla
  tipo       text not null,           -- apunte | resumen | examen | otro
  titulo     text not null,
  url        text not null,
  ciclo      text,                    -- ciclo/periodo del material (ej: "2025-1")
  aprobado   boolean not null default true,   -- moderacion: ver policies
  created_at timestamptz not null default now()
);

-- Buscar "todos los materiales de este curso" es LA consulta de la app.
create index if not exists materiales_curso_idx on public.materiales (curso);

alter table public.materiales enable row level security;

-- Cualquier autenticado puede subir material, pero siempre a su nombre.
create policy "materiales_insert_propio"
  on public.materiales for insert
  with check (auth.uid() = user_id);

-- Lectura: lo publicado lo ve cualquier autenticado (ese es el punto de la
-- app), y ademas cada quien ve lo suyo aunque se lo hayan bajado.
create policy "materiales_select_aprobado_o_propio"
  on public.materiales for select
  using (aprobado or auth.uid() = user_id);

-- Solo el autor puede corregir o borrar lo suyo. Nadie mas.
-- El autor tambien puede tocar `aprobado` en lo suyo, y esta bien: la
-- moderacion es REACTIVA (se publica de una y se baja si llega un reporte),
-- no previa. Si algun dia se quiere aprobacion previa, hay que sacar la
-- columna de este update con:
--   revoke update (aprobado) on public.materiales from authenticated;
-- (RLS filtra filas, no columnas: la policy sola no alcanza para eso.)
create policy "materiales_update_propio"
  on public.materiales for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "materiales_delete_propio"
  on public.materiales for delete
  using (auth.uid() = user_id);
