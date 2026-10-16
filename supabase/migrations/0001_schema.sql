-- Любимый Бутик: схема данных. Применять в Supabase SQL Editor по порядку 0001 → 0002 → 0003.
create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- Администраторы: только строки, добавленные вручную владельцем (см. supabase/first_admin.sql)
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,60}$'),
  name_ru text not null check (length(name_ru) between 1 and 80),
  name_kk text not null default '' check (length(name_kk) <= 80),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,80}$'),
  name_ru text not null check (length(name_ru) between 1 and 120),
  name_kk text not null default '' check (length(name_kk) <= 120),
  description_ru text not null default '' check (length(description_ru) <= 4000),
  description_kk text not null default '' check (length(description_kk) <= 4000),
  price_kzt integer not null check (price_kzt >= 0 and price_kzt <= 100000000),
  category_id uuid references public.categories(id) on delete set null,
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  stock_status text not null default 'in_stock' check (stock_status in ('in_stock','low','out')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  is_featured boolean not null default false,
  is_new boolean not null default false,
  is_demo boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_status_idx on public.products(status, created_at desc);
create index products_category_idx on public.products(category_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null check (length(storage_path) between 1 and 300),
  sort_order int not null default 0,
  is_cover boolean not null default false,
  alt_ru text not null default '',
  alt_kk text not null default '',
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images(product_id, sort_order);
create unique index product_images_one_cover on public.product_images(product_id) where is_cover;

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,60}$'),
  name_ru text not null check (length(name_ru) between 1 and 80),
  name_kk text not null default '' check (length(name_kk) <= 80),
  description_ru text not null default '' check (length(description_ru) <= 1000),
  description_kk text not null default '' check (length(description_kk) <= 1000),
  cover_path text,
  is_public boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collection_products (
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order int not null default 0,
  primary key (collection_id, product_id)
);
create index collection_products_product_idx on public.collection_products(product_id);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  template text not null check (template in ('new_collection','new_arrivals','seasonal_sale','special_offer')),
  headline_ru text not null default '' check (length(headline_ru) <= 120),
  headline_kk text not null default '' check (length(headline_kk) <= 120),
  subtitle_ru text not null default '' check (length(subtitle_ru) <= 240),
  subtitle_kk text not null default '' check (length(subtitle_kk) <= 240),
  image_path text,
  text_align text not null default 'left' check (text_align in ('left','center','right')),
  style jsonb not null default '{}'::jsonb,
  link_path text check (link_path is null or link_path ~ '^/[A-Za-z0-9/_?=&.-]*$'),
  placement text not null default 'hero' check (placement in ('hero','promo')),
  status text not null default 'draft' check (status in ('draft','published')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index banners_status_idx on public.banners(status, placement, sort_order);

-- Публичные настройки (читает любой посетитель). Одна строка.
create table public.store_settings (
  id boolean primary key default true check (id),
  store_name text not null default 'Любимый Бутик',
  logo_path text,
  whatsapp_number text not null default '' check (whatsapp_number ~ '^[0-9]{0,15}$'),
  phone_display text not null default '',
  address_ru text not null default '',
  address_kk text not null default '',
  instagram_url text not null default '',
  tiktok_url text not null default '',
  updated_at timestamptz not null default now()
);

-- Приватные настройки (только администраторы): заметки, резерв под будущие ключи интеграций
create table public.private_settings (
  key text primary key check (length(key) <= 80),
  value text not null default '',
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['categories','products','collections','banners','store_settings','private_settings'] loop
    execute format('create trigger %I_updated before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- published_at проставляется автоматически
create or replace function public.products_publish_ts() returns trigger language plpgsql as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at = now();
  end if;
  return new;
end $$;
create trigger products_publish before insert or update on public.products
for each row execute function public.products_publish_ts();

insert into public.store_settings (id, whatsapp_number, phone_display, address_ru, address_kk, instagram_url)
values (true, '77777051100', '+7 777 705 1100',
  'г. Қызылорда, ТД «Жайна», 27, бутик 26-27, 4 этаж',
  'Қызылорда қ., «Жайна» СҮ, 27, 26-27 бутик, 4-қабат',
  'https://www.instagram.com/boutique_27jaina');
