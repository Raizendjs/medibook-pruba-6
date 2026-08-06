-- ============================================================
-- 003_roles_y_permisos.sql
-- Sistema de roles: usuario / anfitrion / administrador
-- + solicitudes de cambio de rol con aprobación de administradores
-- ============================================================

-- 1) TABLA DE PERFILES (1:1 con auth.users)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'usuario'
    check (role in ('usuario', 'anfitrion', 'administrador')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own_basic_fields"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2) FUNCIÓN AUXILIAR: ¿el usuario actual es administrador?
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'administrador'
  );
$$;

create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin());

-- 🔒 SALVAGUARDA CRÍTICA: revierte cualquier cambio de "role" que no venga
-- de un administrador autenticado por la API. Si auth.uid() es null (Table
-- Editor / SQL Editor de Supabase), se permite: eso ya es acceso tuyo directo.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_self_escalation on public.profiles;
create trigger trg_prevent_role_self_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- 3) TRIGGER: crear perfil automáticamente al registrarse
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
begin
  requested_role := new.raw_user_meta_data ->> 'role';

  if requested_role not in ('usuario', 'anfitrion') then
    requested_role := 'usuario';
  end if;

  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    requested_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) TABLA DE SOLICITUDES DE CAMBIO DE ROL
-- ------------------------------------------------------------
create table if not exists public.role_change_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  previous_role text not null,
  requested_role text not null
    check (requested_role in ('usuario', 'anfitrion', 'administrador')),
  reason text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now()
);

alter table public.role_change_requests enable row level security;

create policy "role_requests_select_own"
  on public.role_change_requests for select
  using (auth.uid() = user_id);

-- (la policy de insert final, más restrictiva, se define en 005)
create policy "role_requests_insert_own"
  on public.role_change_requests for insert
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and requested_role <> previous_role
  );

create policy "role_requests_select_admin"
  on public.role_change_requests for select
  using (public.is_admin());

-- 5) FUNCIÓN: aprobar/rechazar una solicitud (solo administradores)
-- ------------------------------------------------------------
create or replace function public.review_role_change_request(
  request_id uuid,
  approve boolean,
  note text default null
)
returns public.role_change_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.role_change_requests;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede revisar solicitudes de rol';
  end if;

  select * into req
  from public.role_change_requests
  where id = request_id
  for update;

  if req.id is null then
    raise exception 'Solicitud no encontrada';
  end if;

  if req.status <> 'pending' then
    raise exception 'Esta solicitud ya fue revisada';
  end if;

  update public.role_change_requests
  set
    status = case when approve then 'approved' else 'rejected' end,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    admin_note = note
  where id = request_id
  returning * into req;

  if approve then
    update public.profiles
    set role = req.requested_role, updated_at = now()
    where id = req.user_id;
  end if;

  return req;
end;
$$;

-- 6) ÍNDICES
-- ------------------------------------------------------------
create index if not exists idx_role_change_requests_status
  on public.role_change_requests (status);
create index if not exists idx_role_change_requests_user
  on public.role_change_requests (user_id);

-- 7) BACKFILL: crear perfil para usuarios que ya existían antes de esta migración
-- ------------------------------------------------------------
insert into public.profiles (id, full_name, avatar_url, role)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'),
  'usuario'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
