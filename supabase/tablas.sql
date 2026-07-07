-- Tablas para Feedback y Reportes (Educateca / Yala)
-- Correr una sola vez en Supabase: SQL Editor -> pegar esto -> Run.
-- Requiere estar autenticado como usuario (las policies usan auth.uid()).

-- ============ FEEDBACK ============
create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete set null,
  email      text,
  tipo       text not null,          -- sugerencia | idea | queja | otro
  mensaje    text not null,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Cada usuario puede crear su propio feedback...
create policy "feedback_insert_propio"
  on public.feedback for insert
  with check (auth.uid() = user_id);

-- ...y leer solo el suyo. (Tu, como dueno del proyecto, ves todo desde el
-- dashboard de Supabase -> Table editor, que ignora RLS.)
create policy "feedback_select_propio"
  on public.feedback for select
  using (auth.uid() = user_id);

-- ============ REPORTES ============
create table if not exists public.reportes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete set null,
  email      text,
  carrera    text,
  tipo       text not null,          -- bug | dato_malla | curso | otro
  mensaje    text not null,
  created_at timestamptz not null default now()
);

alter table public.reportes enable row level security;

create policy "reportes_insert_propio"
  on public.reportes for insert
  with check (auth.uid() = user_id);

create policy "reportes_select_propio"
  on public.reportes for select
  using (auth.uid() = user_id);
