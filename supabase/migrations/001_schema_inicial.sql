-- ============================================
-- 0. LIMPIEZA: borra versiones anteriores (si existen)
-- ============================================
drop table if exists bookings cascade;
drop table if exists listing_images cascade;
drop table if exists listings cascade;

-- ============================================
-- 1. Extensión necesaria (evita reservas de fechas encimadas)
-- ============================================
create extension if not exists btree_gist;

-- ============================================
-- 2. Tabla de listings (propiedades/productos)
-- ============================================
create table listings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references auth.users(id) not null,
  title text not null,
  description text,
  price numeric not null,
  currency text default 'USD',
  country text not null,
  city text,
  address text,
  lat float8,
  lng float8,
  max_guests int,
  amenities jsonb default '[]',
  status text default 'active',
  created_at timestamptz default now()
);

-- ============================================
-- 3. Imágenes del listing
-- ============================================
create table listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade,
  url text not null,
  order_index int default 0
);

-- ============================================
-- 4. Reservas
-- ============================================
create table bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) not null,
  user_id uuid references auth.users(id) not null,
  check_in date not null,
  check_out date not null,
  guests int,
  total_price numeric,
  status text default 'pending',
  created_at timestamptz default now(),
  constraint valid_dates check (check_out > check_in),
  exclude using gist (
    listing_id with =,
    daterange(check_in, check_out) with &&
  ) where (status != 'cancelled')
);

-- ============================================
-- 5. Seguridad por fila (RLS)
-- ============================================
alter table listings enable row level security;
alter table listing_images enable row level security;
alter table bookings enable row level security;

-- ============================================
-- 6. Políticas de acceso
-- ============================================

create policy "listings visibles al publico"
  on listings for select
  using (status = 'active');

create policy "host gestiona sus listings"
  on listings for all
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

create policy "imagenes visibles"
  on listing_images for select
  using (true);

create policy "host sube imagenes de sus listings"
  on listing_images for insert
  with check (
    listing_id in (select id from listings where host_id = auth.uid())
  );

create policy "usuario ve sus reservas"
  on bookings for select
  using (auth.uid() = user_id);

create policy "usuario crea sus reservas"
  on bookings for insert
  with check (auth.uid() = user_id);-- ============================================
-- 0. LIMPIEZA: borra versiones anteriores (si existen)
-- ============================================
drop table if exists bookings cascade;
drop table if exists listing_images cascade;
drop table if exists listings cascade;

-- ============================================
-- 1. Extensión necesaria (evita reservas de fechas encimadas)
-- ============================================
create extension if not exists btree_gist;

-- ============================================
-- 2. Tabla de listings (propiedades/productos)
-- ============================================
create table listings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references auth.users(id) not null,
  title text not null,
  description text,
  price numeric not null,
  currency text default 'USD',
  country text not null,
  city text,
  address text,
  lat float8,
  lng float8,
  max_guests int,
  amenities jsonb default '[]',
  status text default 'active',
  created_at timestamptz default now()
);

-- ============================================
-- 3. Imágenes del listing
-- ============================================
create table listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade,
  url text not null,
  order_index int default 0
);

-- ============================================
-- 4. Reservas
-- ============================================
create table bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) not null,
  user_id uuid references auth.users(id) not null,
  check_in date not null,
  check_out date not null,
  guests int,
  total_price numeric,
  status text default 'pending',
  created_at timestamptz default now(),
  constraint valid_dates check (check_out > check_in),
  exclude using gist (
    listing_id with =,
    daterange(check_in, check_out) with &&
  ) where (status != 'cancelled')
);

-- ============================================
-- 5. Seguridad por fila (RLS)
-- ============================================
alter table listings enable row level security;
alter table listing_images enable row level security;
alter table bookings enable row level security;

-- ============================================
-- 6. Políticas de acceso
-- ============================================

create policy "listings visibles al publico"
  on listings for select
  using (status = 'active');

create policy "host gestiona sus listings"
  on listings for all
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

create policy "imagenes visibles"
  on listing_images for select
  using (true);

create policy "host sube imagenes de sus listings"
  on listing_images for insert
  with check (
    listing_id in (select id from listings where host_id = auth.uid())
  );

create policy "usuario ve sus reservas"
  on bookings for select
  using (auth.uid() = user_id);

create policy "usuario crea sus reservas"
  on bookings for insert
  with check (auth.uid() = user_id);-- ============================================
-- 0. LIMPIEZA: borra versiones anteriores (si existen)
-- ============================================
drop table if exists bookings cascade;
drop table if exists listing_images cascade;
drop table if exists listings cascade;

-- ============================================
-- 1. Extensión necesaria (evita reservas de fechas encimadas)
-- ============================================
create extension if not exists btree_gist;

-- ============================================
-- 2. Tabla de listings (propiedades/productos)
-- ============================================
create table listings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references auth.users(id) not null,
  title text not null,
  description text,
  price numeric not null,
  currency text default 'USD',
  country text not null,
  city text,
  address text,
  lat float8,
  lng float8,
  max_guests int,
  amenities jsonb default '[]',
  status text default 'active',
  created_at timestamptz default now()
);

-- ============================================
-- 3. Imágenes del listing
-- ============================================
create table listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade,
  url text not null,
  order_index int default 0
);

-- ============================================
-- 4. Reservas
-- ============================================
create table bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) not null,
  user_id uuid references auth.users(id) not null,
  check_in date not null,
  check_out date not null,
  guests int,
  total_price numeric,
  status text default 'pending',
  created_at timestamptz default now(),
  constraint valid_dates check (check_out > check_in),
  exclude using gist (
    listing_id with =,
    daterange(check_in, check_out) with &&
  ) where (status != 'cancelled')
);

-- ============================================
-- 5. Seguridad por fila (RLS)
-- ============================================
alter table listings enable row level security;
alter table listing_images enable row level security;
alter table bookings enable row level security;

-- ============================================
-- 6. Políticas de acceso
-- ============================================

create policy "listings visibles al publico"
  on listings for select
  using (status = 'active');

create policy "host gestiona sus listings"
  on listings for all
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

create policy "imagenes visibles"
  on listing_images for select
  using (true);

create policy "host sube imagenes de sus listings"
  on listing_images for insert
  with check (
    listing_id in (select id from listings where host_id = auth.uid())
  );

create policy "usuario ve sus reservas"
  on bookings for select
  using (auth.uid() = user_id);

create policy "usuario crea sus reservas"
  on bookings for insert
  with check (auth.uid() = user_id);