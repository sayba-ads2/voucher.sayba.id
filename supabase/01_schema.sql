-- ============================================================================
-- TOP UP GAME MURAH  ·  https://topupgamemurah.sayba.id
-- Skema database Supabase (PostgreSQL)
-- Jalankan seluruh file ini di Supabase Dashboard > SQL Editor > New query
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------------
-- ENUM
-- ---------------------------------------------------------------------------
do $$ begin
  create type payment_status as enum ('PENDING','PAID','EXPIRED','CANCELLED','REFUNDED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fulfillment_status as enum ('WAITING_PAYMENT','QUEUED','PROCESSING','SUCCESS','FAILED','REFUNDED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type margin_type as enum ('percent','fixed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- SETTINGS  (key-value konfigurasi toko)
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ADMIN ALLOWLIST  (user Supabase Auth yang boleh masuk /admin)
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'admin' check (role in ('owner','admin','staff')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- GAMES  (etalase game yang kamu jual -- kamu yang tentukan mana yang tampil)
-- ---------------------------------------------------------------------------
create table if not exists public.games (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  name               text not null,
  publisher          text,
  -- kode game untuk endpoint check-nickname NexShop (mis. 'mobile-legends')
  nexshop_game_code  text,
  -- nilai kolom "operator" dari katalog NexShop, dipakai saat sinkronisasi
  provider_operator  text unique,
  icon_url           text,
  banner_url         text,
  short_description  text,
  description        text,
  -- label form input yang tampil ke pembeli
  id_label           text not null default 'User ID',
  id_placeholder     text not null default 'Masukkan User ID',
  server_label       text default 'Server / Zone ID',
  server_placeholder text default 'Masukkan Zone ID',
  needs_server_id    boolean not null default false,
  server_options     jsonb,
  how_to_order       jsonb not null default '[]'::jsonb,
  seo_title          text,
  seo_description    text,
  seo_keywords       text[],
  is_active          boolean not null default false,
  is_featured        boolean not null default false,
  sort_order         integer not null default 100,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists games_active_idx on public.games (is_active, sort_order);
create index if not exists games_name_trgm_idx on public.games using gin (name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- PRODUCTS  (nominal / denominasi, hasil sinkron dari NexShop)
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  game_id           uuid references public.games(id) on delete set null,
  kode_produk       text not null unique,
  name              text not null,
  category          text,
  operator          text,
  base_price        integer not null default 0,
  cost_price        integer not null default 0,
  margin_type       margin_type,
  margin_value      numeric(10,2),
  sell_price        integer not null default 0,
  needs_server_id   boolean not null default false,
  provider_status   text not null default 'ACTIVE',
  is_active         boolean not null default true,
  is_promo          boolean not null default false,
  label             text,
  sort_order        integer not null default 100,
  last_synced_at    timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists products_game_idx on public.products (game_id, is_active, sort_order);
create index if not exists products_operator_idx on public.products (operator);

-- ---------------------------------------------------------------------------
-- PAYMENT METHODS
-- ---------------------------------------------------------------------------
create table if not exists public.payment_methods (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  name           text not null,
  group_name     text not null default 'E-Wallet',
  provider       text not null default 'manual',
  provider_code  text,
  icon_url       text,
  fee_flat       integer not null default 0,
  fee_percent    numeric(5,2) not null default 0,
  min_amount     integer not null default 1000,
  max_amount     integer not null default 10000000,
  instructions   jsonb not null default '[]'::jsonb,
  account_name   text,
  account_number text,
  qris_image_url text,
  is_active      boolean not null default true,
  sort_order     integer not null default 100,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ORDERS
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  order_code          text not null unique,
  ref_id              text not null unique,

  game_id             uuid references public.games(id) on delete set null,
  product_id          uuid references public.products(id) on delete set null,
  game_name           text,
  game_slug           text,
  product_code        text not null,
  product_name        text not null,

  target              text not null,
  server_id           text,
  nickname            text,

  contact_whatsapp    text,
  contact_email       text,

  cost_amount         integer not null default 0,
  base_amount         integer not null default 0,
  fee_amount          integer not null default 0,
  unique_code         integer not null default 0,
  total_amount        integer not null default 0,
  profit_amount       integer not null default 0,

  voucher_code        text,
  discount_amount     integer not null default 0,

  payment_method      text,
  payment_provider    text not null default 'manual',
  payment_status      payment_status not null default 'PENDING',
  payment_reference   text,
  payment_payload     jsonb,
  paid_at             timestamptz,
  expires_at          timestamptz,

  fulfillment_status  fulfillment_status not null default 'WAITING_PAYMENT',
  nexshop_order_id    text,
  serial_number       text,
  provider_message    text,
  completed_at        timestamptz,

  ip_address          text,
  user_agent          text,
  utm_source          text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (payment_status, fulfillment_status);
create index if not exists orders_target_idx on public.orders (target);
create index if not exists orders_contact_idx on public.orders (contact_whatsapp);

-- ---------------------------------------------------------------------------
-- ORDER EVENTS  (audit trail)
-- ---------------------------------------------------------------------------
create table if not exists public.order_events (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  type        text not null,
  message     text,
  payload     jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists order_events_order_idx on public.order_events (order_id, created_at desc);

-- ---------------------------------------------------------------------------
-- WEBHOOK LOGS
-- ---------------------------------------------------------------------------
create table if not exists public.webhook_logs (
  id              uuid primary key default gen_random_uuid(),
  source          text not null,
  event           text,
  reference_id    text,
  signature_valid boolean,
  status_code     integer,
  payload         jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists webhook_logs_ref_idx on public.webhook_logs (source, reference_id, created_at desc);

-- ---------------------------------------------------------------------------
-- KONTEN PENDUKUNG
-- ---------------------------------------------------------------------------
create table if not exists public.banners (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  subtitle    text,
  image_url   text,
  link_url    text,
  is_active   boolean not null default true,
  sort_order  integer not null default 100,
  created_at  timestamptz not null default now()
);

create table if not exists public.testimonials (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text default 'Pontianak',
  game        text,
  rating      smallint not null default 5 check (rating between 1 and 5),
  message     text not null,
  is_active   boolean not null default true,
  sort_order  integer not null default 100,
  created_at  timestamptz not null default now()
);

create table if not exists public.faqs (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,
  answer      text not null,
  category    text default 'umum',
  is_active   boolean not null default true,
  sort_order  integer not null default 100,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- TRIGGER updated_at
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $fn$
begin
  new.updated_at = now();
  return new;
end $fn$;

do $blk$
declare t text;
begin
  foreach t in array array['games','products','orders'] loop
    execute format('drop trigger if exists trg_touch_%1$s on public.%1$s', t);
    execute format('create trigger trg_touch_%1$s before update on public.%1$s
                    for each row execute function public.touch_updated_at()', t);
  end loop;
end $blk$;

-- ---------------------------------------------------------------------------
-- HELPER: cek apakah user yang login adalah admin aktif
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from public.admin_users
    where id = auth.uid() and is_active = true
  );
$fn$;

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Prinsip: publik hanya boleh MEMBACA etalase. Semua tulis lewat service role
-- (API route Next.js), bukan dari browser.
-- ---------------------------------------------------------------------------
alter table public.settings        enable row level security;
alter table public.admin_users     enable row level security;
alter table public.games           enable row level security;
alter table public.products        enable row level security;
alter table public.payment_methods enable row level security;
alter table public.orders          enable row level security;
alter table public.order_events    enable row level security;
alter table public.webhook_logs    enable row level security;
alter table public.banners         enable row level security;
alter table public.testimonials    enable row level security;
alter table public.faqs            enable row level security;

drop policy if exists games_public_read on public.games;
create policy games_public_read on public.games for select to anon, authenticated
  using (is_active = true);

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select to anon, authenticated
  using (is_active = true and provider_status = 'ACTIVE');

drop policy if exists payment_public_read on public.payment_methods;
create policy payment_public_read on public.payment_methods for select to anon, authenticated
  using (is_active = true);

drop policy if exists banners_public_read on public.banners;
create policy banners_public_read on public.banners for select to anon, authenticated
  using (is_active = true);

drop policy if exists testimonials_public_read on public.testimonials;
create policy testimonials_public_read on public.testimonials for select to anon, authenticated
  using (is_active = true);

drop policy if exists faqs_public_read on public.faqs;
create policy faqs_public_read on public.faqs for select to anon, authenticated
  using (is_active = true);

-- Admin: akses penuh lewat sesi Supabase Auth
do $blk$
declare t text;
begin
  foreach t in array array['settings','games','products','payment_methods','orders',
                           'order_events','webhook_logs','banners','testimonials','faqs'] loop
    execute format('drop policy if exists %1$s_admin_all on public.%1$s', t);
    execute format('create policy %1$s_admin_all on public.%1$s for all to authenticated
                    using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $blk$;

drop policy if exists admin_users_self_read on public.admin_users;
create policy admin_users_self_read on public.admin_users for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- CATATAN: tabel orders TIDAK punya policy publik. Halaman "Cek Pesanan"
-- membaca lewat API route dengan service role dan hanya mengembalikan
-- kolom yang aman untuk pembeli.
