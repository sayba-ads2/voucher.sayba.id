-- ============================================================================
-- MIGRASI 05 — Perluas etalase melampaui voucher & game
--
-- Toko kini juga menjual pulsa, paket data, token listrik PLN, saldo e-wallet,
-- tagihan, hiburan, dan e-toll. Kolom `kind` yang tadinya hanya mengenal
-- 'game' dan 'voucher' diperlebar mengikuti registri di src/lib/categories.ts.
--
-- Jalankan SETELAH 04_migration_kind.sql. Aman dijalankan berulang.
-- ============================================================================

-- 1. Lepas batasan lama, pasang yang baru.
alter table public.games drop constraint if exists games_kind_check;

alter table public.games
  add constraint games_kind_check check (
    kind in ('pulsa', 'data', 'pln', 'ewallet', 'game', 'voucher',
             'tagihan', 'hiburan', 'etoll', 'lainnya')
  );

-- 2. Selaraskan data lama dengan kategori produknya. Sinkronisasi berikutnya
--    hanya mengisi baris baru, jadi baris lama diperbaiki di sini sekali saja.
update public.games g
set kind = sub.kind
from (
  select
    p.game_id,
    case
      when p.category in ('Pulsa', 'Masa Aktif') then 'pulsa'
      when p.category = 'Paket Data'             then 'data'
      when p.category = 'PLN'                    then 'pln'
      when p.category = 'E-Wallet'               then 'ewallet'
      when p.category = 'Gaming'                 then 'game'
      when p.category = 'Voucher Game'           then 'voucher'
      when p.category = 'Tagihan'                then 'tagihan'
      when p.category = 'Hiburan'                then 'hiburan'
      when p.category = 'E-Toll'                 then 'etoll'
      else 'lainnya'
    end as kind,
    count(*) as n,
    row_number() over (
      partition by p.game_id order by count(*) desc
    ) as rank
  from public.products p
  where p.game_id is not null
  group by p.game_id, 2
) sub
where sub.game_id = g.id and sub.rank = 1 and g.kind is distinct from sub.kind;

-- 3. Indeks kategori dipakai hampir di setiap halaman etalase.
create index if not exists games_kind_active_idx
  on public.games (kind, is_active, sort_order);

comment on column public.games.kind is
  'Kategori etalase: pulsa, data, pln, ewallet, game, voucher, tagihan, hiburan, etoll, lainnya.';
