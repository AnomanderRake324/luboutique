-- Проверка RLS изнутри базы: анонимный посетитель и вошедший НЕ-администратор.
-- Запуск: Supabase → SQL Editor → вставить целиком → Run. Тестовые строки создаются и удаляются автоматически.
-- Успех: в конце вернётся строка "ALL RLS CHECKS PASSED". Любая ошибка "FAIL ..." означает проблему с правами.
do $$
declare n int; fake uuid := gen_random_uuid();
begin
  delete from public.products where slug like 'rls-test-%';
  delete from public.banners where headline_ru = 'rls-test';
  delete from public.collections where slug like 'rls-test-%';
  insert into public.products (slug, name_ru, price_kzt, status) values ('rls-test-draft','t',1,'draft'), ('rls-test-pub','t',1,'published');
  insert into public.banners (template, headline_ru, status) values ('new_arrivals','rls-test','draft');
  insert into public.collections (slug, name_ru, is_public) values ('rls-test-hidden','t',false);

  -- ===== АНОНИМ =====
  set local role anon;
  select count(*) into n from public.products where slug = 'rls-test-draft'; if n <> 0 then raise exception 'FAIL anon видит черновик товара'; end if;
  select count(*) into n from public.products where slug = 'rls-test-pub';   if n <> 1 then raise exception 'FAIL anon не видит опубликованный товар'; end if;
  select count(*) into n from public.banners where headline_ru = 'rls-test'; if n <> 0 then raise exception 'FAIL anon видит черновик баннера'; end if;
  select count(*) into n from public.collections where slug = 'rls-test-hidden'; if n <> 0 then raise exception 'FAIL anon видит скрытую коллекцию'; end if;
  begin select count(*) into n from public.private_settings; if n <> 0 then raise exception 'FAIL anon читает private_settings'; end if; exception when insufficient_privilege then null; end;
  begin select count(*) into n from public.admins; if n <> 0 then raise exception 'FAIL anon читает admins'; end if; exception when insufficient_privilege then null; end;
  begin insert into public.products (slug, name_ru, price_kzt) values ('rls-test-anon','x',1); raise exception 'FAIL anon создал товар'; exception when insufficient_privilege then null; end;
  begin update public.products set name_ru = 'hacked' where slug = 'rls-test-pub'; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL anon изменил товар'; end if; exception when insufficient_privilege then null; end;
  begin delete from public.products where slug = 'rls-test-pub'; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL anon удалил товар'; end if; exception when insufficient_privilege then null; end;
  reset role;

  -- ===== ВОШЕДШИЙ, НО НЕ АДМИНИСТРАТОР =====
  perform set_config('request.jwt.claim.sub', fake::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', fake, 'role', 'authenticated')::text, true);
  set local role authenticated;
  if public.is_admin() then raise exception 'FAIL случайный пользователь считается админом'; end if;
  select count(*) into n from public.products where slug = 'rls-test-draft'; if n <> 0 then raise exception 'FAIL не-админ видит черновик товара'; end if;
  select count(*) into n from public.banners where headline_ru = 'rls-test'; if n <> 0 then raise exception 'FAIL не-админ видит черновик баннера'; end if;
  select count(*) into n from public.private_settings; if n <> 0 then raise exception 'FAIL не-админ читает private_settings'; end if;
  begin insert into public.products (slug, name_ru, price_kzt) values ('rls-test-user','x',1); raise exception 'FAIL не-админ создал товар'; exception when insufficient_privilege then null; end;
  update public.products set name_ru = 'hacked' where slug = 'rls-test-pub'; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL не-админ изменил товар'; end if;
  delete from public.products where slug = 'rls-test-pub'; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL не-админ удалил товар'; end if;
  update public.store_settings set store_name = 'hacked'; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL не-админ изменил настройки магазина'; end if;
  begin insert into storage.objects (bucket_id, name) values ('media', 'rls-test/x.webp'); raise exception 'FAIL не-админ загрузил файл в хранилище'; exception when insufficient_privilege then null; end;
  reset role;

  delete from public.products where slug like 'rls-test-%';
  delete from public.banners where headline_ru = 'rls-test';
  delete from public.collections where slug like 'rls-test-%';
  raise notice 'ALL RLS CHECKS PASSED';
end $$;
select 'ALL RLS CHECKS PASSED' as result;
