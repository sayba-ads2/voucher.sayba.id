-- ============================================================================
-- MIGRASI 03 — Satu game boleh punya beberapa "operator" di katalog NexShop
--
-- Alasan: katalog NexShop memakai beberapa nama operator untuk game yang sama,
-- misalnya "Mobile Legends" dan "Mobile Legend Kios Pintar", atau
-- "Free Fire & FFMAX" dan "Voucher Free Fire & FFMAX". Sebelumnya kolom
-- provider_operator bersifat UNIQUE sehingga tiap nama membuat game terpisah
-- dan etalase jadi punya dua kartu untuk game yang sama.
--
-- Jalankan SETELAH 01_schema.sql. Aman dijalankan berulang.
-- ============================================================================

-- 1. Lepas keunikan pada satu operator.
alter table public.games drop constraint if exists games_provider_operator_key;

-- 2. Tambah daftar operator. Slug (yang sudah unique) kini jadi kunci game.
alter table public.games
  add column if not exists provider_operators text[] not null default '{}'::text[];

-- 3. Pindahkan nilai lama ke dalam daftar.
update public.games
set provider_operators = array[provider_operator]
where provider_operator is not null
  and coalesce(array_length(provider_operators, 1), 0) = 0;

create index if not exists games_provider_operators_idx
  on public.games using gin (provider_operators);

comment on column public.games.provider_operator is
  'Operator utama (untuk tampilan). Pemetaan sesungguhnya memakai provider_operators.';
comment on column public.games.provider_operators is
  'Semua nilai kolom "operator" katalog NexShop yang dipetakan ke game ini.';
