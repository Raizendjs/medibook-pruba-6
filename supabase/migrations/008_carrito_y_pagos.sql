-- ============================================================
-- 008_carrito_y_pagos.sql
-- 1) Carrito: el usuario agrega propiedades+fechas antes de pagar.
-- 2) Pagos: registro de cada cobro hecho con Kushki.
-- 3) bookings.payment_id: para poder calcular ganancias por
--    anfitrión y en general para el admin.
-- ============================================================

-- 1) CARRITO
-- ------------------------------------------------------------
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  check_in date not null,
  check_out date not null,
  guests int not null default 1,
  price_per_night numeric not null,
  total_price numeric not null,
  created_at timestamptz not null default now(),
  check (check_out > check_in)
);

alter table public.cart_items enable row level security;

drop policy if exists "cart_items_select_own" on public.cart_items;
create policy "cart_items_select_own"
  on public.cart_items for select
  using (auth.uid() = user_id);

drop policy if exists "cart_items_insert_own" on public.cart_items;
create policy "cart_items_insert_own"
  on public.cart_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "cart_items_delete_own" on public.cart_items;
create policy "cart_items_delete_own"
  on public.cart_items for delete
  using (auth.uid() = user_id);

-- 2) PAGOS
-- ------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  currency text not null default 'USD',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined', 'failed')),
  kushki_transaction_id text,
  kushki_token text,
  raw_response jsonb,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

-- El usuario ve sus propios pagos
drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own"
  on public.payments for select
  using (auth.uid() = user_id);

-- El administrador ve todos los pagos (para la página de ganancias)
drop policy if exists "payments_select_admin" on public.payments;
create policy "payments_select_admin"
  on public.payments for select
  using (public.is_admin());

-- El anfitrión puede ver los pagos ligados a reservas de SUS propiedades
-- (para poder calcular sus propias ganancias)
drop policy if exists "payments_select_host" on public.payments;
create policy "payments_select_host"
  on public.payments for select
  using (
    exists (
      select 1 from public.bookings b
      join public.listings l on l.id = b.listing_id
      where b.payment_id = payments.id and l.host_id = auth.uid()
    )
  );

-- Los inserts/updates de pagos SIEMPRE pasan por el backend (service role
-- o la función de abajo), nunca directo desde el navegador.

-- 3) LIGAR RESERVAS A SU PAGO
-- ------------------------------------------------------------
alter table public.bookings
  add column if not exists payment_id uuid references public.payments(id);

create index if not exists idx_cart_items_user on public.cart_items (user_id);
create index if not exists idx_payments_user on public.payments (user_id);
create index if not exists idx_bookings_payment on public.bookings (payment_id);
