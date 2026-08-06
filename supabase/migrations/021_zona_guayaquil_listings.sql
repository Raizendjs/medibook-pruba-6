-- ============================================================
-- 021_zona_guayaquil_listings.sql
--
-- Medibookit opera solo en Guayaquil, así que en vez de manejar
-- ciudad/país libres, agregamos una "zona" específica de la ciudad
-- (más útil para elegir un consultorio que la ciudad, que siempre
-- es la misma).
-- ============================================================

alter table public.listings
  add column if not exists zone text
    check (zone in ('via_samborondon', 'kennedy', 'alborada', 'centro', 'ceibos', 'urdesa', 'otro'));

comment on column public.listings.zone is
  'Zona de Guayaquil: via_samborondon, kennedy, alborada, centro, ceibos, urdesa, otro';
