# Публикация сайта (Cloudflare Pages)

Перед запуском прочитайте [FREE_TIER.md](FREE_TIER.md): там лимиты, риски и то, что нужно проверить самостоятельно.

## 1. Подготовка
1. Выполните миграции Supabase и `first_admin.sql` (см. README).
2. Локально: `npm install`, `npm run build` — сборка должна пройти без ошибок.
3. Выполните `npm run check:security` и `supabase/tests/rls_check.sql` (оба должны пройти).
4. Проверьте номер WhatsApp, адрес и ссылки в админке → «Настройки». Дайте носителю языка проверить `docs/KAZAKH_REVIEW.md`.

## 2. Выкладка через GitHub (рекомендуется)
1. Создайте **приватный** репозиторий на github.com и загрузите проект. Файл `.env.local` загружать не нужно (он уже в `.gitignore`).
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git → выберите репозиторий.
3. Настройки сборки: Framework preset — `Vite` (или None); Build command — `npm run build`; Build output directory — `dist`.
4. Environment variables (Production):
   - `VITE_SUPABASE_URL` — адрес проекта Supabase
   - `VITE_SUPABASE_ANON_KEY` — публичный ключ (publishable/anon)
   - `VITE_SITE_URL` — адрес сайта без `/` в конце (например `https://lyubimy-butik.pages.dev`); нужен для sitemap.xml
5. Deploy. Переходы `/ru/...`, `/kk/...`, `/admin` обеспечивает файл `public/_redirects`.
6. Если `VITE_SITE_URL` стал известен только после первого запуска, добавьте его и сделайте повторный деплой.

Вариант без GitHub: собрать локально (`npm run build`) и загрузить папку `dist` в Cloudflare Pages через «Upload assets». Тогда sitemap берёт данные в момент локальной сборки.

## 3. После запуска
1. Supabase → Authentication → URL Configuration: укажите адрес сайта как Site URL.
2. Откройте `/admin` на телефоне, войдите, добавьте категорию и 1–2 товара, опубликуйте; проверьте каталог на русском и казахском и кнопку WhatsApp (ссылка в сообщении должна открывать нужный товар).
3. Заголовок `Content-Security-Policy-Report-Only` в `public/_headers` пока только сообщает о нарушениях в консоли браузера (F12 → Console). Если после недели использования замечаний нет, можно сменить на `Content-Security-Policy` (блокирующий). Эта политика не проверялась в браузере.
4. Свой домен: Pages → Custom domains.

## 4. Обновление сайта
Любое изменение кода + `git push` запускает новую сборку (лимит 500 сборок в месяц на бесплатном тарифе). Товары, баннеры и настройки меняются в админке без пересборки.

## 5. Если что-то не работает
- Белый экран/«Не удалось загрузить данные» — проект Supabase на паузе или неверные переменные окружения.
- `/admin` пишет «Supabase не настроен» — не заданы переменные `VITE_*` при сборке (после их добавления нужен новый деплой).
- Фото не загружаются — проверьте миграцию `0003` и что вы вошли как администратор.
