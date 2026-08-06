-- ============================================================
-- 016_permitir_mismo_dia_en_reservas.sql
--
-- Las reservas por hora usan check_in = check_out (mismo día).
-- Las restricciones viejas exigían check_out > check_in (pensadas
-- para reservas de varias noches), así que bloqueaban el carrito.
-- Las relajamos a check_out >= check_in.
-- ============================================================

alter table public.cart_items drop constraint if exists cart_items_check;
alter table public.cart_items
  add constraint cart_items_check check (check_out >= check_in);

alter table public.bookings drop constraint if exists valid_dates;
alter table public.bookings
  add constraint valid_dates check (check_out >= check_in);

-- ------------------------------------------------------------
-- La campanita de notificaciones necesita que la tabla esté en la
-- publicación de Realtime de Supabase; sin esto, el navegador nunca
-- recibe el evento y hay que recargar la página para verlas.
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- ------------------------------------------------------------
-- Solo cuentas con rol "usuario" (paciente) pueden reservar. Los
-- anfitriones y administradores no deben poder agregar al carrito,
-- ni siquiera llamando la API directamente.
-- ------------------------------------------------------------
drop policy if exists "cart_items_insert_own" on public.cart_items;
create policy "cart_items_insert_own"
  on public.cart_items for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'usuario'
    )
  );
