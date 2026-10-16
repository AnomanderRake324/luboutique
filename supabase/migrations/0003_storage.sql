-- Бакет изображений. Публичный: файлы доступны по прямой ссылке (нужно для витрины и соцсетей).
-- Загружать, заменять и удалять могут только администраторы.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 3145728,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

create policy media_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
create policy media_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());
create policy media_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
-- Чтение публичного бакета по URL не требует политики; листинг файлов через API остаётся закрытым для anon.
