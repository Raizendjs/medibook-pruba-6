-- ============================================================
-- 020_bio_y_calificacion_huespedes.sql
--
-- 1) profiles.bio: reseña/presentación personal corta, para el
--    perfil público (tanto usuario como anfitrión).
-- 2) guest_ratings: el anfitrión califica al huésped después de
--    una reserva confirmada (contraparte de "reviews", que es el
--    huésped calificando la propiedad).
-- ============================================================

alter table public.profiles
  add column if not exists bio text;

create table if not exists public.guest_ratings (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  host_id uuid not null references auth.users(id) on delete cascade,
  guest_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (booking_id)
);

alter table public.guest_ratings enable row level security;

-- Las calificaciones son públicas (igual que las reseñas de propiedades):
-- así se puede mostrar la calificación de un huésped en su perfil público.
drop policy if exists "guest_ratings_select_publico" on public.guest_ratings;
create policy "guest_ratings_select_publico"
  on public.guest_ratings for select
  using (true);

-- Solo el anfitrión de esa reserva puede calificar a ese huésped, y solo
-- si la reserva está confirmada.
drop policy if exists "guest_ratings_insert_host" on public.guest_ratings;
create policy "guest_ratings_insert_host"
  on public.guest_ratings for insert
  with check (
    host_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      join public.listings l on l.id = b.listing_id
      where b.id = guest_ratings.booking_id
        and b.user_id = guest_ratings.guest_id
        and l.host_id = auth.uid()
        and b.status = 'confirmed'
    )
  );

drop policy if exists "guest_ratings_update_host" on public.guest_ratings;
create policy "guest_ratings_update_host"
  on public.guest_ratings for update
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

create index if not exists idx_guest_ratings_guest on public.guest_ratings (guest_id);
create index if not exists idx_guest_ratings_booking on public.guest_ratings (booking_id);

-- ------------------------------------------------------------
-- Bucket de storage para fotos de perfil (público para lectura,
-- como las fotos de las propiedades — solo el dueño sube/actualiza
-- la suya).
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars: cualquiera puede ver" on storage.objects;
create policy "avatars: cualquiera puede ver"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars: el dueño sube la suya" on storage.objects;
create policy "avatars: el dueño sube la suya"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars: el dueño actualiza la suya" on storage.objects;
create policy "avatars: el dueño actualiza la suya"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars: el dueño borra la suya" on storage.objects;
create policy "avatars: el dueño borra la suya"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
