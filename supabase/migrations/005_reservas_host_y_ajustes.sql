-- ============================================================
-- 005_reservas_host_y_ajustes.sql
-- 1) El anfitrión puede VER y CONFIRMAR/RECHAZAR reservas de SUS
--    propiedades.
-- 2) El anfitrión solo puede tocar el "status" de la reserva.
-- 3) Ver el perfil (nombre/avatar) de la contraparte de una reserva.
-- 4) Nadie puede auto-solicitar el rol "administrador".
-- ============================================================

drop policy if exists "host ve reservas de sus listings" on public.bookings;
create policy "host ve reservas de sus listings"
  on public.bookings for select
  using (
    listing_id in (select id from public.listings where host_id = auth.uid())
  );

drop policy if exists "host actualiza estado de reservas" on public.bookings;
create policy "host actualiza estado de reservas"
  on public.bookings for update
  using (
    listing_id in (select id from public.listings where host_id = auth.uid())
  )
  with check (
    listing_id in (select id from public.listings where host_id = auth.uid())
  );

create or replace function public.enforce_host_booking_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is distinct from old.user_id then
    if new.listing_id is distinct from old.listing_id
       or new.user_id is distinct from old.user_id
       or new.check_in is distinct from old.check_in
       or new.check_out is distinct from old.check_out
       or new.total_price is distinct from old.total_price
       or new.guests is distinct from old.guests then
      raise exception 'El anfitrión solo puede actualizar el estado de la reserva';
    end if;

    if new.status not in ('confirmed', 'rejected') then
      raise exception 'Estado no permitido para el anfitrión';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_host_booking_update on public.bookings;
create trigger trg_enforce_host_booking_update
  before update on public.bookings
  for each row execute function public.enforce_host_booking_update();

drop policy if exists "profiles_select_contraparte_reserva" on public.profiles;
create policy "profiles_select_contraparte_reserva"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.bookings b
      join public.listings l on l.id = b.listing_id
      where (b.user_id = profiles.id and l.host_id = auth.uid())
         or (l.host_id = profiles.id and b.user_id = auth.uid())
    )
  );

drop policy if exists "role_requests_insert_own" on public.role_change_requests;
create policy "role_requests_insert_own"
  on public.role_change_requests for insert
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and requested_role in ('usuario', 'anfitrion')
    and requested_role <> previous_role
    and previous_role = (select role from public.profiles where id = auth.uid())
    and not exists (
      select 1 from public.role_change_requests r2
      where r2.user_id = auth.uid() and r2.status = 'pending'
    )
  );
