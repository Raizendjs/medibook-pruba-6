-- ============================================================
-- 013_perfil_publico_anfitrion_y_resenas.sql
--
-- 1) Permite que cualquiera vea el nombre/avatar/fecha de un
--    anfitrión que tiene al menos una propiedad activa (necesario
--    para mostrar la tarjeta "Anfitrión: ..." en la página de la
--    propiedad, igual que en Airbnb).
-- 2) Crea la tabla de reseñas (rating 1-5 + comentario) para poder
--    mostrar la puntuación / número de reseñas de cada propiedad.
-- ============================================================

drop policy if exists "profiles_select_host_publico" on public.profiles;
create policy "profiles_select_host_publico"
  on public.profiles for select
  using (
    exists (
      select 1 from public.listings l
      where l.host_id = profiles.id
        and l.status = 'active'
    )
  );

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  guest_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (listing_id, guest_id, booking_id)
);

alter table public.reviews enable row level security;

drop policy if exists "reviews_select_publico" on public.reviews;
create policy "reviews_select_publico"
  on public.reviews for select
  using (true);

drop policy if exists "reviews_insert_propio" on public.reviews;
create policy "reviews_insert_propio"
  on public.reviews for insert
  with check (guest_id = auth.uid());

drop policy if exists "reviews_update_propio" on public.reviews;
create policy "reviews_update_propio"
  on public.reviews for update
  using (guest_id = auth.uid())
  with check (guest_id = auth.uid());

create index if not exists idx_reviews_listing on public.reviews (listing_id);
