-- ЕДИНОРАЗОВЫЙ РУЧНОЙ ШАГ (не миграция). Выполняется владельцем в SQL Editor.
-- 1) Supabase → Authentication → Users → Add user: email + пароль владельца (Auto Confirm).
-- 2) Supabase → Authentication → Sign In / Providers → отключить "Allow new users to sign up".
-- 3) Подставьте email и выполните:
insert into public.admins (user_id)
select id from auth.users where email = 'ПОДСТАВЬТЕ_EMAIL_ВЛАДЕЛЬЦА'
on conflict do nothing;
-- Проверка: должна вернуться 1 строка
select * from public.admins;
