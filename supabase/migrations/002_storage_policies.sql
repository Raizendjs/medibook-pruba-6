-- Cualquiera puede VER las imágenes (bucket público)
create policy "imagenes publicas de lectura"
on storage.objects for select
using (bucket_id = 'listing-images');

-- Solo usuarios autenticados pueden SUBIR, y solo a su propia carpeta
create policy "usuarios suben a su propia carpeta"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Solo el dueño puede BORRAR sus propias imágenes
create policy "usuarios borran sus propias imagenes"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);