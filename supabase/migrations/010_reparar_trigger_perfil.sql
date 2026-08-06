-- ============================================================
-- 010_reparar_trigger_perfil.sql
-- Si en Supabase ves usuarios en Authentication > Users que NO
-- tienen su fila correspondiente en la tabla "profiles", esto lo
-- corrige: vuelve a crear el trigger (por si se perdió) y rellena
-- con perfil a cualquier cuenta que se haya quedado sin uno.
-- Seguro de correr aunque todo ya estuviera bien.
-- ============================================================

-- 1) Recrear la función y el trigger que crean el perfil al registrarse
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
begin
  requested_role := new.raw_user_meta_data ->> 'role';

  if requested_role not in ('usuario', 'anfitrion') then
    requested_role := 'usuario';
  end if;

  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    requested_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Rellenar perfil para cualquier usuario que se haya quedado sin uno
-- ------------------------------------------------------------
insert into public.profiles (id, full_name, avatar_url, role)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'),
  'usuario'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- 3) DIAGNÓSTICO: corre esto y fíjate en el resultado
-- ------------------------------------------------------------
-- Debe devolver 1 fila con tgenabled = 'O' (trigger activo).
-- Si te devuelve VACÍO después de correr este archivo, algo bloquea
-- la creación del trigger — avísame con el mensaje de error exacto.
select tgname, tgenabled from pg_trigger where tgname = 'on_auth_user_created';

-- Debe devolver 0 filas — si aquí aparece algún usuario, dime cuántos
-- salieron (significa que SÍ había cuentas huérfanas, y este archivo
-- las acaba de arreglar).
select u.id, u.email, u.created_at
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
