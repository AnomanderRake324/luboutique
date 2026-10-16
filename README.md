# Любимый Бутик — сайт (RU/KK)

Статичный сайт-витрина с админкой: React + Vite + TypeScript + Tailwind, Supabase (база, вход, хранилище фото). Заказ — через WhatsApp, без корзины и онлайн-оплаты.

## Запуск на компьютере
```
npm install
npm run dev        # http://localhost:5173
npm run build      # сборка в папку dist
npm test           # автотесты вспомогательных функций
```
Нужен Node.js LTS. Файл `.env.local` (рядом с package.json) содержит публичные значения Supabase — по образцу `.env.example`. **Никогда** не добавляйте туда `service_role`-ключ или пароль базы: всё с префиксом `VITE_` попадает в браузер.

## Первичная настройка Supabase
1. Выполнить в SQL Editor по порядку: `supabase/migrations/0001_schema.sql`, `0002_rls.sql`, `0003_storage.sql`.
2. Authentication → создать пользователя-владельца; отключить «Allow new users to sign up».
3. Выполнить `supabase/first_admin.sql` (подставив email владельца).

## Структура
- `src/pages`, `src/components` — публичный сайт; `src/lib` — данные, переводы (`i18n.ts`), WhatsApp.
- `src/admin` — админка (`/admin`), загружается отдельно от сайта.
- `supabase/` — миграции, `first_admin.sql`, `tests/rls_check.sql`.
- `scripts/` — `security-check.mjs`, `generate-sitemap.mjs`.
- `docs/` — DEPLOY, FREE_TIER, SEO, OWNER_GUIDE, KAZAKH_REVIEW.
- `src/lib/demo.ts` — демо-данные; используются только если Supabase не настроен.

## Проверки безопасности
- `npm run check:security` — от лица анонимного посетителя: читает только опубликованное, не может писать/удалять/загружать.
- `supabase/tests/rls_check.sql` — в SQL Editor: проверяет анонима и вошедшего не-администратора. Тестовые строки удаляются сами.

## Документация
[Публикация](docs/DEPLOY.md) · [Бесплатные тарифы и риски](docs/FREE_TIER.md) · [SEO и ограничения](docs/SEO.md) · [Инструкция владельца](docs/OWNER_GUIDE.md) · [Казахские тексты на проверку](docs/KAZAKH_REVIEW.md)
