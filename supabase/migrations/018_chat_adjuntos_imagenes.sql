-- ============================================================
-- 018_chat_adjuntos_imagenes.sql
--
-- Adjuntos de imagen en el chat.
--
-- attachment_path guarda la RUTA dentro del bucket (no una URL):
-- el bucket es privado, así que la URL para mostrar la imagen se
-- firma (createSignedUrl) desde el cliente al momento de
-- renderizarla — así no queda una URL pública ni una firmada que
-- eventualmente expire guardada en la base de datos.
--
-- Convención de ruta: {conversation_id}/{message_id}.{ext}
-- Esto permite que las políticas de storage.objects reutilicen la
-- misma regla de pertenencia a la conversación que ya usan
-- messages_select / messages_insert (requester_id / host_id /
-- admin_id / is_admin()).
-- ============================================================

alter table public.messages
  add column if not exists attachment_path text;

insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', false)
on conflict (id) do nothing;

drop policy if exists "chat_attachments_select" on storage.objects;
create policy "chat_attachments_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'chat-attachments'
    and exists (
      select 1 from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
        and (
          c.requester_id = auth.uid()
          or c.admin_id = auth.uid()
          or c.host_id = auth.uid()
          or public.is_admin()
        )
    )
  );

drop policy if exists "chat_attachments_insert" on storage.objects;
create policy "chat_attachments_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-attachments'
    and exists (
      select 1 from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
        and c.status = 'active'
        and (
          c.requester_id = auth.uid()
          or c.admin_id = auth.uid()
          or c.host_id = auth.uid()
        )
    )
  );
