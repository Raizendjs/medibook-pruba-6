-- ============================================================
-- 012_mensajes_leidos.sql
--
-- Agrega el "visto" (read receipt) al chat de soporte:
-- una columna read_at en messages que se llena cuando la
-- otra persona de la conversación abre el chat y ve el mensaje.
-- ============================================================

alter table public.messages
  add column if not exists read_at timestamptz;

-- Permitir que cualquiera de las dos partes de la conversación
-- marque como leídos los mensajes (update solo de read_at).
drop policy if exists "messages_update_read" on public.messages;
create policy "messages_update_read"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.requester_id = auth.uid() or c.admin_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.requester_id = auth.uid() or c.admin_id = auth.uid() or public.is_admin())
    )
  );

create index if not exists idx_messages_unread
  on public.messages (conversation_id, sender_id)
  where read_at is null;
