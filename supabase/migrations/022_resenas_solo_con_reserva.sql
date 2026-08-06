-- ============================================================
-- 022_resenas_solo_con_reserva.sql
--
-- La policy de insert de "reviews" solo pedía guest_id = auth.uid(),
-- sin exigir que exista una reserva real — la endurecemos para que
-- solo se pueda reseñar una propiedad si de verdad la reservaste
-- (reserva confirmada), igual criterio que ya usa guest_ratings.
-- ============================================================

drop policy if exists "reviews_insert_propio" on public.reviews;
create policy "reviews_insert_propio"
  on public.reviews for insert
  with check (
    guest_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = reviews.booking_id
        and b.listing_id = reviews.listing_id
        and b.user_id = auth.uid()
        and b.status = 'confirmed'
    )
  );
