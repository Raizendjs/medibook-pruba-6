-- ============================================================
-- 019_categoria_listings.sql
--
-- Agrega el tipo de espacio médico a cada listing, para poder
-- filtrar por categoría (barra estilo Airbnb arriba del hero).
-- ============================================================

alter table public.listings
  add column if not exists category text
    check (category in ('medico', 'dental', 'fisioterapia', 'psicologia', 'otro'))
    default 'otro';

-- Los listings que ya existen quedan como 'otro' hasta que el
-- anfitrión los edite y elija la categoría real.
comment on column public.listings.category is
  'Tipo de espacio médico: medico, dental, fisioterapia, psicologia, otro';
