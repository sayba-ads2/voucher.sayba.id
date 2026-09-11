-- ============================================================================
-- MIGRASI 06 — Kartu Perdana, pemetaan kategori yang lebih longgar, dan
--               aktivasi massal etalase.
--
-- Tiga hal yang diperbaiki di sini:
--
--   1. Kategori baru 'perdana' (Kartu Perdana) ditambahkan ke kolom `kind`.
--   2. Baris lama dipetakan ulang memakai aturan yang sama dengan
--      src/lib/categories.ts — termasuk nama kategori distributor yang
--      sebelumnya tidak dikenali (Kartu Perdana, Streaming, Kuota, Gift Card,
--      dan sejenisnya) sehingga brand-nya terlanjur jatuh ke 'lainnya'.
--   3. Brand yang benar-benar punya produk siap jual DIAKTIFKAN. Sebelumnya
--      setiap brand hasil sinkronisasi dibuat nonaktif, jadi seluruh etalase
--      tampak kosong sampai ratusan tombol ditekan satu per satu.
--
-- Jalankan SETELAH 05_migration_categories.sql. Aman dijalankan berulang.
-- ============================================================================

-- 1. Perlebar batasan kolom `kind` -------------------------------------------
alter table public.games drop constraint if exists games_kind_check;

alter table public.games
  add constraint games_kind_check check (
    kind in ('pulsa', 'data', 'perdana', 'pln', 'ewallet', 'game', 'voucher',
             'hiburan', 'tagihan', 'etoll', 'lainnya')
  );

-- 2. Petakan ulang kategori brand dari kategori produknya ---------------------
--    Fungsi bantu ini adalah cerminan mapProviderCategory() di TypeScript:
--    cocokkan nama persis dulu, lalu jatuhkan ke pencocokan potongan kata.
create or replace function public.sayba_map_category(p_category text)
returns text
language sql
immutable
as $fn$
  select case
    when p_category is null or btrim(p_category) = '' then 'lainnya'
    when lower(p_category) like '%perdana%'            then 'perdana'
    when lower(p_category) like '%masa aktif%'         then 'pulsa'
    when lower(p_category) like '%pulsa%'              then 'pulsa'
    when lower(p_category) like '%paket data%'         then 'data'
    when lower(p_category) like '%kuota%'              then 'data'
    when lower(p_category) like '%internet%'           then 'data'
    when lower(p_category) like '%pln%'                then 'pln'
    when lower(p_category) like '%token listrik%'      then 'pln'
    when lower(p_category) like '%e-wallet%'           then 'ewallet'
    when lower(p_category) like '%ewallet%'            then 'ewallet'
    when lower(p_category) like '%dompet digital%'     then 'ewallet'
    when lower(p_category) like '%e-toll%'             then 'etoll'
    when lower(p_category) like '%etoll%'              then 'etoll'
    when lower(p_category) like '%e-money%'            then 'etoll'
    when lower(p_category) like '%hiburan%'            then 'hiburan'
    when lower(p_category) like '%streaming%'          then 'hiburan'
    when lower(p_category) like '%entertainment%'      then 'hiburan'
    when lower(p_category) like '%voucher game%'       then 'voucher'
    when lower(p_category) like '%gift card%'          then 'voucher'
    when lower(p_category) like '%giftcard%'           then 'voucher'
    when lower(p_category) like '%voucher%'            then 'voucher'
    when lower(p_category) like '%gaming%'             then 'game'
    when lower(p_category) like '%game%'               then 'game'
    when lower(p_category) like '%tagihan%'            then 'tagihan'
    when lower(p_category) like '%ppob%'               then 'tagihan'
    when lower(p_category) like '%pascabayar%'         then 'tagihan'
    when lower(p_category) like '%bpjs%'               then 'tagihan'
    when lower(p_category) like '%pdam%'               then 'tagihan'
    else 'lainnya'
  end;
$fn$;

--    Kategori yang menang untuk sebuah brand adalah yang produknya terbanyak.
update public.games g
set kind = sub.kind
from (
  select game_id, kind
  from (
    select
      p.game_id,
      public.sayba_map_category(p.category) as kind,
      row_number() over (
        partition by p.game_id
        order by count(*) desc, public.sayba_map_category(p.category)
      ) as rank
    from public.products p
    where p.game_id is not null
    group by p.game_id, 2
  ) ranked
  where rank = 1
) sub
where sub.game_id = g.id
  and g.kind is distinct from sub.kind;

-- 3. Aktifkan brand yang produknya benar-benar siap dijual --------------------
--    Syaratnya ketat: harus punya minimal satu produk aktif, berstatus ACTIVE
--    di sisi distributor, dan berharga jual di atas nol. Brand 'lainnya'
--    sengaja dilewati — isinya kategori yang belum dikenali dan sebaiknya kamu
--    lihat dulu di /admin/games.
update public.games g
set is_active = true
where g.is_active = false
  and g.kind <> 'lainnya'
  and exists (
    select 1
    from public.products p
    where p.game_id = g.id
      and p.is_active = true
      and p.provider_status = 'ACTIVE'
      and p.sell_price > 0
  );

-- 4. Tonjolkan brand yang paling dicari di beranda ---------------------------
update public.games
set is_featured = true
where is_active = true
  and slug in (
    'mobile-legends', 'free-fire', 'pubg-mobile', 'genshin-impact',
    'honor-of-kings', 'valorant', 'roblox',
    'netflix', 'spotify', 'youtube-premium', 'disney-plus-hotstar',
    'steam-wallet', 'google-play'
  );

-- 5. Indeks pencarian nama brand ---------------------------------------------
--    Halaman /cari mencocokkan nama brand tanpa peduli huruf besar-kecil.
create index if not exists games_name_lower_idx
  on public.games (lower(name))
  where is_active = true;

comment on column public.games.kind is
  'Kategori etalase: pulsa, data, perdana, pln, ewallet, game, voucher, hiburan, tagihan, etoll, lainnya.';
