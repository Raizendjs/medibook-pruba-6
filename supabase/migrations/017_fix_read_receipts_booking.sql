-- ============================================================
-- 017_fix_read_receipts_booking.sql
--
-- La política "messages_update_read" (012_mensajes_leidos) es de
-- ANTES de que existiera el chat huésped↔anfitrión (015), y solo
-- deja marcar read_at a requester_id / admin_id / is_admin().
--
-- Resultado: en una conversación type='booking', el ANFITRIÓN
-- (host_id) no puede marcar como leídos los mensajes del huésped
-- — Postgres rechaza el UPDATE por RLS, sin error visible en la UI,
-- así que el ✓✓ del huésped nunca se activa. Este fix agrega
-- host_id a la política, igual que ya se hizo en 015 para
-- messages_select / messages_insert.
-- ============================================================

drop policy if exists "messages_update_read" on public.messages;
create policy "messages_update_read"
  on public.messages for update
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
  )
  with check (
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
