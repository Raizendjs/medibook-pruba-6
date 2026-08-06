-- ============================================================
-- 011_fix_null_role_y_carrito_duplicado.sql
--
-- BUG 1 (crítico): al registrarse con Google, no viene un campo
-- "role" en los metadatos (eso solo lo manda el formulario de
-- registro por email). requested_role quedaba en NULL, y en
-- PL/pgSQL "IF NULL THEN" se trata como FALSE (no como error),
-- así que NUNCA entraba al "si no es válido, usa 'usuario'".
-- Como la columna profiles.role es NOT NULL, el insert fallaba,
-- y como el trigger corre en la MISMA transacción que crea al
-- usuario en auth.users, toda la operación se cancelaba — de ahí
-- el "Database error saving new user". Esto pasaba SOLO con
-- cuentas nuevas por Google (por eso las cuentas viejas nunca
-- lo mostraron: se crearon antes de que existiera este trigger).
--
-- BUG 2: nada impedía agregar el mismo listing+fechas varias
-- veces al carrito de la misma persona.
-- ============================================================

-- 1) FIX del trigger: NULL ahora sí cae en el default 'usuario'
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

  -- 🔧 el fix: se agrega "requested_role is null or" al inicio
  if requested_role is null or requested_role not in ('usuario', 'anfitrion') then
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

-- (el trigger ya existe y apunta a esta función, no hace falta recrearlo,
-- pero no está de más asegurarlo)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Evitar carrito duplicado: un mismo usuario no puede tener el
--    mismo listing con fechas que se solapen, dos veces en su carrito.
--    (Distintos usuarios SÍ pueden tener las mismas fechas en su
--    carrito al mismo tiempo — el bloqueo real ocurre al pagar.)
-- ------------------------------------------------------------

-- 2a) Limpieza: si ya tienes duplicados guardados de antes (como los 3
-- "Prueba de kushki" con las mismas fechas), el constraint de abajo no se
-- podría crear. Esto deja solo UNA copia por cada grupo de fechas que se
-- solapen, para el mismo usuario+listing.
delete from public.cart_items a
using public.cart_items b
where a.user_id = b.user_id
  and a.listing_id = b.listing_id
  and daterange(a.check_in, a.check_out) && daterange(b.check_in, b.check_out)
  and (a.created_at, a.id) > (b.created_at, b.id);

-- 2b) El constraint que evita que vuelva a pasar
alter table public.cart_items
  drop constraint if exists no_overlapping_cart_items;

alter table public.cart_items
  add constraint no_overlapping_cart_items
  exclude using gist (
    user_id with =,
    listing_id with =,
    daterange(check_in, check_out) with &&
  );
