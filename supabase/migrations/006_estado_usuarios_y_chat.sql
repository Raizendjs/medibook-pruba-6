-- ============================================================
-- 006_estado_usuarios_y_chat.sql
-- 1) profiles.status: soft-delete (suspender sin borrar nada).
-- 2) Sistema de chat de soporte en tiempo real.
-- ============================================================

alter table public.profiles
  add column if not exists status text not null default 'activo'
    check (status in ('activo', 'suspendido'));

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  admin_id uuid references auth.users(id),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'closed')),
  reason text,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  closed_at timestamptz
);

alter table public.conversations enable row level security;

drop policy if exists "conversations_select" on public.conversations;
create policy "conversations_select"
  on public.conversations for select
  using (
    auth.uid() = requester_id
    or auth.uid() = admin_id
    or public.is_admin()
  );

drop policy if exists "conversations_insert" on public.conversations;
create policy "conversations_insert"
  on public.conversations for insert
  with check (
    (
      auth.uid() = requester_id
      and status = 'pending'
      and admin_id is null
      and not exists (
        select 1 from public.conversations c2
        where c2.requester_id = auth.uid() and c2.status in ('pending', 'active')
      )
    )
    or (
      public.is_admin()
      and auth.uid() = admin_id
      and status = 'active'
    )
  );

drop policy if exists "conversations_update_admin" on public.conversations;
create policy "conversations_update_admin"
  on public.conversations for update
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

drop policy if exists "messages_select" on public.messages;
create policy "messages_select"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.requester_id = auth.uid() or c.admin_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.status = 'active'
        and (c.requester_id = auth.uid() or c.admin_id = auth.uid())
    )
  );

create index if not exists idx_messages_conversation on public.messages (conversation_id, created_at);
create index if not exists idx_conversations_requester on public.conversations (requester_id);
create index if not exists idx_conversations_status on public.conversations (status);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
end $$;
