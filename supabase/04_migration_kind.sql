-- ============================================================================
-- MIGRASI 04 — Pisahkan etalase menjadi VOUCHER dan GAME
--
-- Toko diposisikan sebagai toko voucher digital, dengan satu bagian khusus
-- untuk top up game. Kolom `kind` menentukan sebuah game masuk bagian mana.
--
-- Nilainya diisi otomatis saat sinkronisasi katalog berdasarkan kategori
-- NexShop ("Voucher Game" -> voucher, "Gaming" -> game), dan bisa kamu ubah
-- manual dari dashboard bila ada yang perlu dipindah.
--
-- Jalankan SETELAH 01_schema.sql. Aman dijalankan berulang.
-- ============================================================================

alter table public.games
  add column if not exists kind text not null default 'game';

do $blk$
begin
  alter table public.games
    add constraint games_kind_check check (kind in ('game', 'voucher'));
exception
  when duplicate_object then null;
end $blk$;

create index if not exists games_kind_idx on public.games (kind, is_active, sort_order);

-- Tebakan awal untuk data yang sudah ada: apa pun yang produknya berkategori
-- "Voucher Game" dianggap voucher.
update public.games g
set kind = 'voucher'
where exists (
  select 1 from public.products p
  where p.game_id = g.id and p.category = 'Voucher Game'
)
and not exists (
  select 1 from public.products p
  where p.game_id = g.id and p.category = 'Gaming'
);

comment on column public.games.kind is
  'Bagian etalase: game (top up in-game) atau voucher (kode voucher digital).';
