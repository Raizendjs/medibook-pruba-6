-- ============================================================
-- 009_disponibilidad_fechas.sql
-- BUG REAL encontrado: BookingWidget y el checkout consultaban
-- directo la tabla "bookings" con el cliente normal (sesión del
-- usuario). Las políticas RLS de esa tabla solo dejan ver TUS
-- PROPIAS reservas (o las de tus propiedades si eres anfitrión).
-- Entonces cualquier otro usuario, al preguntar "¿qué fechas
-- están ocupadas en este listing?", recibía una lista VACÍA
-- (porque esas reservas son de otra persona), y el check de
-- solapamiento nunca detectaba el conflicto.
--
-- Esta función expone SOLO listing_id/check_in/check_out (nada
-- sensible: ni nombres, ni precios, ni quién reservó) a cualquiera
-- que la llame, sin pasar por esa restricción — igual que en
-- cualquier plataforma de reservas, "estas fechas están ocupadas"
-- es información pública por diseño.
-- ============================================================

create or replace function public.get_bookings_for_listings(p_listing_ids uuid[])
returns table (listing_id uuid, check_in date, check_out date)
language sql
security definer
set search_path = public
stable
as $$
  select listing_id, check_in, check_out
  from public.bookings
  where listing_id = any(p_listing_ids)
    and status != 'cancelled';
$$;

grant execute on function public.get_bookings_for_listings(uuid[]) to authenticated, anon;
