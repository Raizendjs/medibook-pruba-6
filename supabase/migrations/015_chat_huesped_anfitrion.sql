-- ============================================================
-- 015_chat_huesped_anfitrion.sql
-- Extiende el sistema de chat (antes solo soporte con admin)
-- para permitir conversaciones directas huésped ↔ anfitrión,
-- habilitadas únicamente cuando ya existe una reserva pagada
-- entre ambos para esa propiedad.
-- ============================================================

alter table public.conversations
  add column if not exists type text not null default 'support'
    check (type in ('support', 'booking')),
  add column if not exists listing_id uuid references public.listings(id) on delete cascade,
  add column if not exists host_id uuid references auth.users(id);

-- Un huésped puede iniciar UNA conversación de tipo 'booking' por
-- propiedad, solo si tiene una reserva no cancelada/rechazada de esa
-- propiedad (es decir, ya pagó — la reserva solo se crea tras el pago).
drop policy if exists "conversations_insert" on public.conversations;
create policy "conversations_insert"
  on public.conversations for insert
  with check (
    (
      type = 'support'
      and auth.uid() = requester_id
      and status = 'pending'
      and admin_id is null
      and not exists (
        select 1 from public.conversations c2
        where c2.requester_id = auth.uid() and c2.status in ('pending', 'active') and c2.type = 'support'
      )
    )
    or (
      type = 'support'
      and public.is_admin()
      and auth.uid() = admin_id
      and status = 'active'
    )
    or (
      type = 'booking'
      and auth.uid() = requester_id
      and status = 'active'
      and exists (
        select 1 from public.bookings b
        where b.listing_id = conversations.listing_id
          and b.user_id = auth.uid()
          and b.status not in ('cancelled', 'rejected')
      )
      and host_id = (select l.host_id from public.listings l where l.id = conversations.listing_id)
    )
    or (
      type = 'booking'
      and auth.uid() = host_id
      and status = 'active'
      and host_id = (select l.host_id from public.listings l where l.id = conversations.listing_id)
      and exists (
        select 1 from public.bookings b
        where b.listing_id = conversations.listing_id
          and b.user_id = conversations.requester_id
          and b.status not in ('cancelled', 'rejected')
      )
    )
  );

drop policy if exists "conversations_select" on public.conversations;
create policy "conversations_select"
  on public.conversations for select
  using (
    auth.uid() = requester_id
    or auth.uid() = admin_id
    or auth.uid() = host_id
    or public.is_admin()
  );

-- Los mensajes de conversaciones de tipo 'booking' los puede ver/mandar
-- el huésped (requester_id) o el anfitrión (host_id).
drop policy if exists "messages_select" on public.messages;
create policy "messages_select"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (
          c.requester_id = auth.uid()
          or c.admin_id = auth.uid()
          or c.host_id = auth.uid()
          or public.is_admin()
        )
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
        and (
          c.requester_id = auth.uid()
          or c.admin_id = auth.uid()
          or c.host_id = auth.uid()
          or public.is_admin()
        )
    )
  );

create index if not exists idx_conversations_booking
  on public.conversations (listing_id, requester_id) where type = 'booking';
