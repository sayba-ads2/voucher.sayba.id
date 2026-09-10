# Sayba Voucher

Toko produk digital untuk **https://topup.sayba.id**, milik Sayba Arc, dengan katalog dan
harga modal diambil dari REST API Reseller NexShop.

Etalase dibagi menjadi 10 kategori: **pulsa, paket data, token listrik PLN, saldo e-wallet,
top up game, voucher digital, tagihan, hiburan, e-toll,** dan lainnya — semuanya diatur dari
satu registri di `src/lib/categories.ts`. Di beranda, bagian Top Up Game menonjolkan Mobile
Legends, Free Fire, dan PUBG Mobile; game lain tetap punya halaman sendiri dan tetap
terindeks.

- **Stack**: Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres) · Vercel
- **Tema**: putih tulang + abu hitam + aksen oranye; header melayang; carousel scroll-snap tanpa pustaka tambahan
- **Aset**: favicon, ikon PWA, logo header/footer, dan gambar OG semuanya diturunkan dari `public/logo.png`
- **Target pasar**: Pontianak & Kalimantan Barat, terbuka untuk seluruh Indonesia
- **Bahasa**: Indonesia (`lang="id"`, mata uang IDR, zona waktu WIB)

---

## Apa yang sudah ada

**Halaman publik**

| Rute | Isi |
|---|---|
| `/` | Hero, game populer, etalase + pencarian instan, keunggulan, alur 4 langkah, testimoni, FAQ, blok SEO lokal |
| `/pulsa`, `/paket-data`, `/token-listrik`, `/e-wallet`, `/games`, `/voucher`, `/tagihan`, `/hiburan`, `/e-toll`, `/lainnya` | Halaman kategori, semuanya dari satu komponen bersama |
| `/[slug]` | Halaman order per game (mis. `/mobile-legends`) |
| `/invoice/[kode]` | Instruksi bayar + pelacakan status realtime (noindex) |
| `/cek-pesanan` | Lacak pesanan lewat kode invoice |
| `/cara-order`, `/tentang-kami`, `/kontak` | Konten pendukung + schema HowTo |
| `/syarat-ketentuan`, `/kebijakan-privasi` | Halaman legal |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/icon.svg`, `/api/og` | Berkas SEO & PWA, dibuat otomatis |

**Dashboard admin** (`/admin`, dilindungi Supabase Auth + tabel `admin_users`)

- Ringkasan omzet, laba, pesanan hari ini, cek saldo deposit NexShop
- Sinkron katalog & hitung ulang harga sekali klik
- Kelola game: aktif/nonaktif, populer, slug, label input, SEO per game
- Kelola produk: margin per produk, aktif/nonaktif per nominal
- Kelola pesanan: tandai lunas, ulangi kirim, cek status, batalkan, refund
- Pengaturan: identitas toko, margin global, aturan pesanan, metode pembayaran

**Integrasi NexShop**

- `GET /balance`, `GET /products`, `POST /check-nickname`, `POST /orders`, `GET /orders/:id`
- Penerima webhook di `/api/webhook/nexshop` dengan verifikasi HMAC SHA-256 timing-safe
- `ref_id` idempoten, penanganan timeout lewat pengecekan status (bukan menandai gagal)
- Cron rekonsiliasi tiap 5 menit sebagai jaring pengaman kalau webhook telat

---

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local   # lalu isi nilainya
npm run dev
```

Buka http://localhost:3000. Dashboard di http://localhost:3000/admin.

Perintah lain:

```bash
npm run build       # build produksi
npm run typecheck   # cek TypeScript
```

---

## Struktur berkas

```
src/
  app/
    (halaman publik)/     page.tsx, [slug]/, games/, cek-pesanan/, invoice/[code]/, dst.
    admin/
      login/              halaman masuk
      (panel)/            dashboard, games, products, orders, settings (dijaga getAdminSession)
      actions.ts          server action untuk seluruh mutasi admin
    api/
      orders/             buat pesanan + cek status
      check-nickname/     validasi User ID
      webhook/nexshop/    penerima callback NexShop
      cron/               sync katalog & rekonsiliasi
      admin/              aksi dashboard
      og/                 gambar Open Graph dinamis
  components/             komponen UI publik + admin
  lib/
    nexshop.ts            klien REST API NexShop + verifikasi signature
    fulfillment.ts        alur pemenuhan pesanan (idempoten)
    sync.ts               sinkronisasi katalog & perhitungan ulang harga
    pricing.ts            rumus harga jual, biaya, kode unik
    queries.ts            seluruh pembacaan data
    jsonld.tsx            structured data schema.org
    site.ts               identitas & kata kunci SEO
supabase/
  01_schema.sql           tabel, enum, trigger, RLS
  02_seed.sql             pengaturan awal, metode bayar, FAQ, testimoni, admin
  03_migration_...sql     satu game boleh memetakan beberapa operator NexShop
  04_migration_kind.sql   kolom kind pada tabel brand
  05_migration_...sql     perluas kind ke seluruh kategori (pulsa, PLN, dst.)
docs/
  DEPLOY.md               panduan deploy langkah demi langkah
```

---

## Catatan keamanan

- `NEXSHOP_SECRET_KEY` dan `SUPABASE_SERVICE_ROLE_KEY` **tidak pernah** diberi prefix
  `NEXT_PUBLIC_` — keduanya hanya dibaca di kode server.
- Harga selalu dihitung ulang di server dari tabel `products`; nominal dari browser diabaikan.
- Tabel `orders` tidak punya kebijakan RLS publik. Halaman Cek Pesanan membacanya lewat API
  route yang hanya mengembalikan kolom aman.
- Webhook diverifikasi dari byte mentah body dengan perbandingan timing-safe, dan diproses
  idempoten berdasarkan `reference_id`.

Panduan deploy lengkap ada di [`docs/DEPLOY.md`](docs/DEPLOY.md).
