-- Cuota de uso del asistente de IA (Educateca / Yala)
-- Correr una sola vez en Supabase: SQL Editor -> pegar esto -> Run.
--
-- Por que existe: cada llamada al modelo CUESTA dinero real, y la key vive en
-- el servidor. Sin un tope por usuario, una sola persona (o un script) puede
-- gastar el presupuesto de un mes en una tarde. Esta tabla es ese tope.
--
-- Se guarda un contador por usuario y por dia, no una fila por llamada: la
-- consulta que importa es "cuantas lleva hoy", y asi es una sola lectura.
-- Los tokens se anotan aparte para poder ver el gasto real por usuario.

create table if not exists public.uso_ia (
  user_id         uuid not null references auth.users (id) on delete cascade,
  dia             date not null default current_date,
  llamadas        integer not null default 0,
  tokens_entrada  bigint  not null default 0,
  tokens_salida   bigint  not null default 0,
  primary key (user_id, dia)
);

alter table public.uso_ia enable row level security;

-- Cada quien puede VER su propio consumo (para mostrar "te quedan N hoy").
-- Nadie escribe directo: solo la funcion de abajo, que es security definer.
create policy "uso_ia_select_propio"
  on public.uso_ia for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Consumir una llamada de la cuota
-- ---------------------------------------------------------------------------
-- Incrementa y decide en UNA sola operacion atomica. Hacerlo en dos pasos
-- (leer y despues escribir) deja una ventana en la que dos peticiones
-- simultaneas leen el mismo numero y ambas pasan el limite.
--
-- Se incrementa incluso cuando ya paso el tope: asi el contador deja ver quien
-- esta insistiendo, en vez de quedarse clavado en el limite.
create or replace function public.consumir_cuota_ia(p_limite integer)
returns table (permitido boolean, usadas integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user   uuid := auth.uid();
  v_usadas integer;
begin
  if v_user is null then
    raise exception 'sin sesion';
  end if;

  -- En ON CONFLICT DO UPDATE, `uso_ia.llamadas` es el valor que YA estaba en
  -- la fila (lo que se intento insertar seria `excluded.llamadas`).
  insert into public.uso_ia (user_id, dia, llamadas)
  values (v_user, current_date, 1)
  on conflict (user_id, dia)
    do update set llamadas = uso_ia.llamadas + 1
  returning llamadas into v_usadas;

  return query select (v_usadas <= p_limite), v_usadas;
end;
$$;

-- ---------------------------------------------------------------------------
-- Anotar el gasto real en tokens
-- ---------------------------------------------------------------------------
-- Se llama DESPUES de que responde el modelo, porque hasta ese momento no se
-- sabe cuanto costo. Si falla, no se deshace la llamada: el material ya se
-- consumio y el contador de `llamadas` (que es el que frena) ya subio.
--
-- Ojo: estas cifras son ORIENTATIVAS, no auditoria. Como la Edge Function
-- llama con el JWT del usuario, en teoria alguien puede invocar esta funcion
-- desde el navegador y meter numeros inventados en SU PROPIA fila. No es un
-- agujero de gasto: lo que frena el costo es `llamadas`, que solo sube desde
-- consumir_cuota_ia en cada llamada real. Si algun dia estas cifras tienen que
-- ser confiables, hay que anotarlas con la service_role key desde el servidor.
create or replace function public.anotar_tokens_ia(p_entrada bigint, p_salida bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    return;
  end if;

  update public.uso_ia
     set tokens_entrada = tokens_entrada + p_entrada,
         tokens_salida  = tokens_salida  + p_salida
   where user_id = v_user
     and dia = current_date;
end;
$$;

-- Solo con sesion. Sin esto, Postgres deja ejecutar a cualquiera por defecto
-- (incluido el rol anonimo); las funciones ya cortan si auth.uid() es null,
-- pero es mejor no depender solo de eso.
revoke execute on function public.consumir_cuota_ia(integer) from public, anon;
revoke execute on function public.anotar_tokens_ia(bigint, bigint) from public, anon;
grant  execute on function public.consumir_cuota_ia(integer) to authenticated;
grant  execute on function public.anotar_tokens_ia(bigint, bigint) to authenticated;
