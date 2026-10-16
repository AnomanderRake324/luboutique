-- Row Level Security. Проверка прав — на стороне базы, клиентские проверки лишь для удобства интерфейса.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.collections enable row level security;
alter table public.collection_products enable row level security;
alter table public.banners enable row level security;
alter table public.store_settings enable row level security;
alter table public.private_settings enable row level security;

-- admins: читать свою строку может только сам админ; изменять через API нельзя никому
create policy admins_self_read on public.admins for select to authenticated using (user_id = auth.uid());

-- Публичное чтение
create policy categories_public_read on public.categories for select to anon, authenticated using (true);
create policy products_public_read on public.products for select to anon, authenticated using (status = 'published');
create policy product_images_public_read on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));
create policy collections_public_read on public.collections for select to anon, authenticated using (is_public);
create policy collection_products_public_read on public.collection_products for select to anon, authenticated
  using (exists (select 1 from public.collections c where c.id = collection_id and c.is_public)
     and exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));
create policy banners_public_read on public.banners for select to anon, authenticated using (status = 'published');
create policy store_settings_public_read on public.store_settings for select to anon, authenticated using (true);

-- Полный доступ только администраторам (включая чтение черновиков и архива)
do $$
declare t text;
begin
  foreach t in array array['categories','products','product_images','collections','collection_products','banners','store_settings','private_settings'] loop
    execute format('create policy %I_admin_all on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;

-- Привилегии таблиц: anon — только чтение; запись только authenticated (дальше решает RLS)
revoke all on all tables in schema public from anon, authenticated;
grant select on public.categories, public.products, public.product_images, public.collections,
  public.collection_products, public.banners, public.store_settings to anon, authenticated;
grant select on public.admins to authenticated;
grant insert, update, delete on public.categories, public.products, public.product_images, public.collections,
  public.collection_products, public.banners, public.store_settings to authenticated;
grant select, insert, update, delete on public.private_settings to authenticated;
