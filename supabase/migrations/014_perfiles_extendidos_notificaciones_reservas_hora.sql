-- ============================================================
-- 014_perfiles_extendidos_notificaciones_reservas_hora.sql
--
-- Agrupa la base necesaria para:
--  1) Registro obligatorio adicional (usuario y anfitrión)
--  2) Notificaciones en tiempo real (campanita)
--  3) Reservas por día + rango de horas (en vez de huéspedes)
--  4) Suscripción mensual vs pago por transacción
-- ============================================================

-- ------------------------------------------------------------
-- 1) PERFILES: campos nuevos + bandera de registro completo
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists ci_ruc text,
  add column if not exists phone text,
  add column if not exists professional_type text
    check (professional_type in ('medico', 'odontologo', 'otro')),
  add column if not exists specialty text,
  add column if not exists credential_url text,
  add column if not exists clinic_type text
    check (clinic_type in ('medica', 'dental')),
  add column if not exists consultorios_count int,
  add column if not exists permit_url text,
  add column if not exists profile_completed boolean not null default false;

-- Los administradores no necesitan llenar este registro adicional.
update public.profiles set profile_completed = true where role = 'administrador';

-- ------------------------------------------------------------
-- 2) Bucket de storage para los PDFs de credencial/permiso
--    (privado: solo el dueño y administradores lo pueden leer)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('credentials', 'credentials', false)
on conflict (id) do nothing;

drop policy if exists "credenciales: el dueño sube las suyas" on storage.objects;
create policy "credenciales: el dueño sube las suyas"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'credentials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "credenciales: el dueño y admins pueden ver" on storage.objects;
create policy "credenciales: el dueño y admins pueden ver"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'credentials'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

-- ------------------------------------------------------------
-- 3) NOTIFICACIONES
-- ------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, -- 'chat' | 'payment' | 'booking' | 'profile' | 'system'
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "notificaciones: cada quien ve las suyas" on public.notifications;
create policy "notificaciones: cada quien ve las suyas"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "notificaciones: cada quien marca las suyas" on public.notifications;
create policy "notificaciones: cada quien marca las suyas"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_notifications_user_unread
  on public.notifications (user_id, read, created_at desc);

-- Función auxiliar para crear notificaciones desde triggers
create or replace function public.create_notification(
  p_user_id uuid, p_type text, p_title text, p_body text, p_link text
) returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user_id, p_type, p_title, p_body, p_link);
end;
$$;

-- Notificar cuando llega un mensaje de chat nuevo (a todos los
-- participantes de la conversación menos a quien lo envió)
create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_requester uuid;
  v_admin uuid;
begin
  select requester_id, admin_id into v_requester, v_admin
  from public.conversations where id = new.conversation_id;

  if v_requester is not null and v_requester != new.sender_id then
    perform public.create_notification(
      v_requester, 'chat', 'Nuevo mensaje',
      left(new.body, 120), '/ayuda/'
    );
  end if;

  if v_admin is not null and v_admin != new.sender_id then
    perform public.create_notification(
      v_admin, 'chat', 'Nuevo mensaje',
      left(new.body, 120), '/admin/chats/' || new.conversation_id || '/'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_new_message on public.messages;
create trigger trg_notify_new_message
  after insert on public.messages
  for each row execute function public.notify_new_message();

-- Notificar al anfitrión cuando entra una reserva nueva, y al
-- huésped cuando cambia el estado de su reserva (aprobada/rechazada)
create or replace function public.notify_booking_changes()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_host uuid;
  v_title text;
begin
  select host_id, title into v_host, v_title from public.listings where id = new.listing_id;

  if TG_OP = 'INSERT' then
    if v_host is not null then
      perform public.create_notification(
        v_host, 'booking', 'Nueva reserva',
        'Tienes una nueva reserva para "' || coalesce(v_title, 'tu propiedad') || '"',
        '/mis-reservas-host/'
      );
    end if;
  elsif TG_OP = 'UPDATE' and new.status is distinct from old.status then
    perform public.create_notification(
      new.user_id, 'booking',
      case new.status
        when 'confirmed' then 'Reserva confirmada'
        when 'cancelled' then 'Reserva cancelada'
        else 'Actualización de tu reserva'
      end,
      'El estado de tu reserva para "' || coalesce(v_title, 'la propiedad') || '" cambió a ' || new.status,
      '/mis-reservas/'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_booking_changes on public.bookings;
create trigger trg_notify_booking_changes
  after insert or update on public.bookings
  for each row execute function public.notify_booking_changes();

-- Notificar cuando un pago se aprueba (payments.status -> 'approved')
create or replace function public.notify_payment_changes()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' and new.status is distinct from old.status and new.status = 'approved' then
    perform public.create_notification(
      new.user_id, 'payment', 'Pago aprobado',
      'Tu pago fue aprobado con éxito.', '/mis-reservas/'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_payment_changes on public.payments;
create trigger trg_notify_payment_changes
  after update on public.payments
  for each row execute function public.notify_payment_changes();

-- ------------------------------------------------------------
-- 4) RESERVAS POR HORA (en vez de por huéspedes)
--    Se mantiene check_in/check_out (mismo día para reservas de
--    consultorio) y se agregan start_time/end_time. El choque de
--    horarios se valida contra fecha + hora combinadas.
-- ------------------------------------------------------------
alter table public.bookings
  add column if not exists start_time time,
  add column if not exists end_time time;

alter table public.bookings drop constraint if exists bookings_listing_id_daterange_excl;
alter table public.bookings drop constraint if exists bookings_listing_id_check_in_check_out_excl;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.bookings'::regclass
      and contype = 'x'
  ) then
    execute (
      select 'alter table public.bookings drop constraint ' || quote_ident(conname)
      from pg_constraint
      where conrelid = 'public.bookings'::regclass and contype = 'x'
      limit 1
    );
  end if;
end $$;

alter table public.bookings
  add constraint bookings_sin_choque_horario
  exclude using gist (
    listing_id with =,
    tsrange(
      (check_in + coalesce(start_time, time '00:00')),
      -- OJO: el valor por defecto de end_time es '00:00', NO '23:59:59'.
      -- check_out ya es la fecha "de salida" (exclusiva) en el modelo
      -- viejo de reservas por noches; sumarle 23:59:59 haría que el
      -- checkout de una reserva se solape con el checkin de la
      -- siguiente reserva ese mismo día.
      (check_out + coalesce(end_time, time '00:00')),
      '[)'
    ) with &&
  ) where (status != 'cancelled');

-- ------------------------------------------------------------
-- 6) Disponibilidad con horas (para el nuevo BookingWidget por
--    día + rango de horas) y horas en el carrito.
-- ------------------------------------------------------------
-- Hay que borrarla primero: Postgres no permite cambiar las columnas
-- de salida de una función con solo "create or replace".
drop function if exists public.get_bookings_for_listings(uuid[]);

create or replace function public.get_bookings_for_listings(p_listing_ids uuid[])
returns table (listing_id uuid, check_in date, check_out date, start_time time, end_time time)
language sql
security definer
set search_path = public
stable
as $$
  select listing_id, check_in, check_out, start_time, end_time
  from public.bookings
  where listing_id = any(p_listing_ids)
    and status != 'cancelled';
$$;

grant execute on function public.get_bookings_for_listings(uuid[]) to authenticated, anon;

alter table public.cart_items
  add column if not exists start_time time,
  add column if not exists end_time time;

alter table public.cart_items alter column guests set default 1;

-- ------------------------------------------------------------
-- 5) SUSCRIPCIONES (plan mensual vs pago por transacción)
-- ------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'per_transaction' check (plan in ('monthly', 'per_transaction')),
  status text not null default 'active' check (status in ('active', 'cancelled', 'past_due')),
  price numeric not null default 15,
  current_period_end timestamptz,
  kushki_subscription_id text,
  created_at timestamptz not null default now(),
  unique (host_id)
);

alter table public.subscriptions enable row level security;

drop policy if exists "suscripciones: el anfitrion ve/gestiona la suya" on public.subscriptions;
create policy "suscripciones: el anfitrion ve/gestiona la suya"
  on public.subscriptions for all
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

drop policy if exists "suscripciones: admins ven todo" on public.subscriptions;
create policy "suscripciones: admins ven todo"
  on public.subscriptions for select
  using (public.is_admin());

-- Método de pago usado en cada cobro (para diferenciar 10% desc. suscripción)
alter table public.payments
  add column if not exists payment_context text default 'per_transaction'
    check (payment_context in ('monthly_subscription', 'per_transaction'));