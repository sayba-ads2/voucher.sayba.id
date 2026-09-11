# Panduan Deploy — Sayba Voucher

Urutan di bawah dikerjakan berurutan. Setiap tahap bergantung pada tahap sebelumnya.
Perkiraan waktu total: 45–60 menit.

---

## Ringkasan alur sistem

```
Pembeli                Website (Vercel)              Supabase            NexShop
   |                          |                          |                   |
   |-- pilih game & nominal ->|                          |                   |
   |                          |-- baca products -------->|                   |
   |-- klik "Cek Nickname" -->|                                              |
   |                          |-- POST /check-nickname ---------------------->|
   |                          |<---------------------------- username -------|
   |-- klik "Beli" ---------->|                          |                   |
   |                          |-- insert orders (PENDING)>|                  |
   |<-- halaman invoice ------|                          |                   |
   |                          |                          |                   |
   |-- bayar (QRIS/transfer) ->  (admin klik "Tandai Lunas" di /admin/orders) |
   |                          |-- update PAID ---------->|                   |
   |                          |-- POST /orders (ref_id) -------------------->|
   |                          |<------------------------- order PROCESSING --|
   |                          |                          |                   |
   |                          |<== POST /api/webhook/nexshop (SUCCESS + SN) ==|
   |                          |-- update SUCCESS ------->|                   |
   |<-- status berubah otomatis (polling tiap 8 detik)   |                   |
```

Jaring pengaman: cron `/api/cron/reconcile` berjalan tiap 5 menit untuk menutup pesanan
kedaluwarsa, mengulang pesanan lunas yang gagal terkirim, dan menyelaraskan status yang
menggantung bila webhook tidak sampai.

---

## Tahap 1 — Siapkan proyek Supabase

1. Buka [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
   - Name: `sayba-voucher`
   - Region: **Southeast Asia (Singapore)** — paling dekat ke Indonesia
   - Database password: simpan di pengelola kata sandi
2. Tunggu proyek selesai dibuat (±2 menit).
3. Buka **SQL Editor → New query**, tempel seluruh isi `supabase/01_schema.sql`, klik **Run**.
4. Buat query baru lagi, tempel `supabase/02_seed.sql`, klik **Run**.
   Bagian terakhir seed (`insert into admin_users`) belum menemukan siapa pun — itu wajar,
   dijalankan ulang di Tahap 2.
5. Buat query ketiga, tempel `supabase/03_migration_operator_mapping.sql`, klik **Run**.
   Ini membuat satu game bisa memetakan beberapa nama operator NexShop sekaligus
   (mis. "Mobile Legends" + "Mobile Legend Kios Pintar" jadi satu kartu etalase).
   Kode tetap berjalan tanpa migrasi ini, tetapi daftar operatornya tidak tersimpan.
6. Buat query keempat, tempel `supabase/04_migration_kind.sql`, klik **Run**.
   Ini memisahkan etalase menjadi Voucher dan Top Up Game. Situs tetap berjalan tanpa
   migrasi ini (pembagiannya diturunkan dari kategori produk), tetapi dengan migrasi
   kamu bisa memindahkan sebuah produk antar bagian dari database.
7. Buat query kelima, tempel `supabase/05_migration_categories.sql`, klik **Run**.
   Ini memperluas kategori ke pulsa, paket data, token listrik, e-wallet, tagihan, hiburan,
   dan e-toll. **Sangat disarankan**: tanpa migrasi ini situs tetap benar, tetapi setiap
   halaman harus memindai tabel produk untuk menebak kategori — jauh lebih lambat.
8. Buat query keenam, tempel `supabase/06_migration_perdana_dan_aktivasi.sql`, klik **Run**.
   Ini menambah kategori **Kartu Perdana**, memetakan ulang brand lama memakai aturan
   kategori yang baru (termasuk nama kategori distributor yang dulu tidak dikenali dan
   membuat produknya tidak muncul), lalu **mengaktifkan** semua brand yang benar-benar
   punya produk siap jual. Tanpa migrasi ini etalase bisa tetap terlihat kosong meskipun
   katalognya sudah tersinkron.
9. Buka **Project Settings → API**, catat tiga nilai ini:

   | Label di dashboard | Nama environment variable |
   |---|---|
   | Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
   | `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | `service_role` `secret` key | `SUPABASE_SERVICE_ROLE_KEY` |

> `service_role` melewati seluruh Row Level Security. Simpan hanya di environment variable
> server. Jangan pernah menaruhnya di kode frontend.

---

## Tahap 2 — Buat akun admin

1. Supabase → **Authentication → Users → Add user → Create new user**
   - Email: `sayba.help@gmail.com` (atau email lain yang kamu mau)
   - Password: bebas, minimal 8 karakter
   - **Centang "Auto Confirm User"**
2. Kembali ke **SQL Editor**, jalankan (ganti emailnya bila perlu):

   ```sql
   insert into public.admin_users (id, email, full_name, role)
   select id, email, 'Owner Sayba Arc', 'owner'
   from auth.users
   where email = 'sayba.help@gmail.com'
   on conflict (id) do update set is_active = true, role = 'owner';
   ```

3. Supabase → **Authentication → Providers → Email**: matikan **Enable Signups** supaya
   tidak ada yang bisa mendaftar sendiri ke dashboard kamu.

---

## Tahap 3 — Push ke GitHub

```bash
cd "D:/SAYBA ARC/SAYBA WEB TOPUP/TOP UP GAME MURAH"
git init
git add .
git commit -m "Sayba Voucher - rilis awal"
git branch -M main
git remote add origin https://github.com/<akun-kamu>/sayba-voucher.git
git push -u origin main
```

`.env.local` sudah masuk `.gitignore`, jadi kredensial tidak ikut terkirim.

---

## Tahap 4 — Deploy ke Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import** repositori tadi.
2. Framework Preset terdeteksi **Next.js** — biarkan apa adanya.
3. Buka **Environment Variables**, isi seluruh baris di bawah untuk ketiga environment
   (Production, Preview, Development):

   | Key | Value | Catatan |
   |---|---|---|
   | `NEXT_PUBLIC_SITE_URL` | `https://topup.sayba.id` | tanpa garis miring di akhir |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | dari Tahap 1 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | dari Tahap 1 |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | **rahasia** |
   | `NEXSHOP_API_BASE` | `https://nexshop.cloud/api/v1/reseller` | |
   | `NEXSHOP_API_KEY` | `nx_live_...` | Partner Portal → API & Integrasi |
   | `NEXSHOP_SECRET_KEY` | `nx_sec_...` | **rahasia** |
   | `NEXSHOP_WEBHOOK_SECRET` | `whsec_...` | Partner Portal → Webhook Secret |
   | `CRON_SECRET` | string acak 32+ karakter | `openssl rand -hex 32` |
   | `NEXT_PUBLIC_WHATSAPP` | `62812xxxxxxx` | nomor admin, format 62 |
   | `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | kosongkan dulu | diisi di Tahap 8 |

4. Klik **Deploy**. Build pertama ±2 menit.

---

## Tahap 5 — Pasang domain

1. Vercel → proyek → **Settings → Domains → Add** → `topup.sayba.id`.
2. Vercel menampilkan satu record CNAME. Di panel DNS `sayba.id`, tambahkan:

   ```
   Type   Name              Value                    TTL
   CNAME  sayba-voucher    cname.vercel-dns.com     3600
   ```

   (Pakai nilai persis yang ditampilkan Vercel — bisa berbeda per akun.)
3. Tunggu propagasi (5–30 menit). Sertifikat HTTPS diterbitkan otomatis.
4. Pastikan `NEXT_PUBLIC_SITE_URL` sudah `https://topup.sayba.id`, lalu
   **Redeploy** sekali supaya metadata dan sitemap memakai domain final.

---

## Tahap 6 — Konfigurasi Partner Portal NexShop

Buka Partner Portal → **Integrasi API**.

### IP Whitelist — isi apa?

**Kosongkan dulu.** Alasannya: aplikasi berjalan di Vercel serverless yang alamat IP
keluarnya berubah-ubah dan tidak dijamin tetap. Kalau kamu isi dengan satu IP, transaksi
akan mendadak ditolak `403 IP_NOT_WHITELISTED` begitu Vercel memindahkan fungsi ke mesin lain.

Kamu punya tiga pilihan, berurutan dari yang paling praktis:

1. **Biarkan kosong** (yang saya sarankan untuk sekarang). Keamanan tetap terjaga karena
   `X-NexShop-Secret` wajib dan disimpan hanya sebagai environment variable server.
2. **Vercel Pro + Secure Compute / Static IP.** Vercel memberi alamat IP keluar yang tetap;
   salin IP itu ke kolom whitelist.
3. **Proxy ber-IP tetap** (QuotaGuard, Fixie, atau VPS kecil milik sendiri). Arahkan
   `NEXSHOP_API_BASE` ke proxy tersebut, lalu whitelist IP proxy.

Kalau nanti mau tahu IP yang terbaca server NexShop: panggil API sekali dengan whitelist
terisi asal-asalan — respons `403` menyertakan `client_ip` berisi alamat sebenarnya.

### Webhook Relay Callback URL — perlu diisi?

**Ya, ini wajib diisi** supaya status pesanan berubah otomatis tanpa perlu polling terus-menerus.
Isi dengan:

```
https://topup.sayba.id/api/webhook/nexshop
```

Lalu tekan **Tes**. Endpoint harus membalas `200` — kode penerima sudah dibuat untuk itu.
URL ini memenuhi seluruh syarat Partner Portal: HTTPS, port 443, domain publik, tanpa
redirect, tanpa kredensial di URL.

Terakhir, salin **Webhook Secret** dari Partner Portal ke variabel `NEXSHOP_WEBHOOK_SECRET`
di Vercel, lalu redeploy. Tanpa nilai yang cocok, seluruh callback akan ditolak `401`
(memang begitu seharusnya — signature yang tidak cocok tidak boleh dipercaya).

### Isi saldo deposit

Partner Portal → **Deposit** → pilih nominal → bayar via QRIS atau Virtual Account.
Minimal Rp10.000. Setiap transaksi API memotong saldo ini; pesanan yang ditolak provider
dikembalikan otomatis. Pantau sisanya lewat tombol **Cek Saldo Deposit** di `/admin`.

---

## Tahap 7 — Isi etalase

1. Buka `https://topup.sayba.id/admin/login`, masuk dengan akun Tahap 2.
2. Di halaman ringkasan, klik **Sinkron Katalog NexShop**.
   Yang diambil hanya kategori `Gaming` dan `Voucher Game` (±2.500 produk dari ±7.100
   produk NexShop) — pulsa, paket data, e-wallet, dan tagihan sengaja dilewati karena
   toko ini khusus game. **Semua game baru dibuat nonaktif** — ini disengaja supaya
   kamu yang memilih mana yang dijual.
3. Buka **Game**, aktifkan game yang ingin kamu jual, tandai beberapa sebagai *Populer*
   agar tampil di baris "Game Paling Dicari".
4. Untuk tiap game aktif, klik **Ubah** dan periksa:
   - **Slug URL** — ini yang jadi alamat halaman, mis. `mobile-legends`
   - **Kode Game** — diperlukan agar tombol Cek Nickname berfungsi
   - **Label Input ID** & apakah butuh Server ID. Katalog NexShop hampir tidak pernah
     menandai `butuh_server_id`, jadi nilai ini datang dari preset di
     `src/lib/game-presets.ts` — periksa manual untuk game di luar daftar preset
   - **URL Ikon** — unggah ikon game ke Supabase Storage, tempel URL publiknya
5. Buka **Pengaturan**:
   - Isi nomor WhatsApp, email, dan identitas toko
   - Atur **margin global** (bawaan 6%, minimum laba Rp500, pembulatan Rp100)
   - Isi nomor rekening/e-wallet dan URL gambar QRIS di bagian Metode Pembayaran
   - Matikan metode yang tidak kamu pakai
6. Buka **Produk & Margin** untuk memberi margin khusus pada nominal tertentu bila perlu.

---

## Tahap 8 — SEO

1. **Google Search Console** → Add property → URL prefix `https://topup.sayba.id`
   - Verifikasi termudah: DNS TXT record di `sayba.id`
   - Alternatif: salin kode meta tag ke `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` lalu redeploy
2. Kirim sitemap: `https://topup.sayba.id/sitemap.xml`
3. **Google Business Profile** — daftarkan sebagai bisnis di Pontianak. Ini pengungkit
   terbesar untuk kata kunci "top up game pontianak" dan pencarian "terdekat".
4. **Bing Webmaster Tools** — bisa impor langsung dari Search Console.
5. Uji structured data di [validator.schema.org](https://validator.schema.org) —
   halaman depan mengeluarkan Organization, WebSite, OnlineBusiness, dan FAQPage;
   halaman game mengeluarkan Product + AggregateOffer + BreadcrumbList.

Yang sudah tertanam otomatis: metadata per halaman, canonical URL, Open Graph + Twitter Card
dengan gambar dinamis, `robots.txt`, `sitemap.xml`, hreflang `id`, blok konten lokal, dan
`noindex` untuk halaman invoice serta dashboard.

---

## Tahap 9 — Transaksi uji sebelum go-live

Lakukan berurutan dan pastikan ketiganya terjadi:

1. Beli nominal **terkecil** ke User ID milik kamu sendiri.
2. Bayar sungguhan, lalu di `/admin/orders` klik **Tandai Lunas**.
3. Periksa:
   - [ ] Saldo Partner Portal berkurang sesuai harga tier
   - [ ] Webhook masuk dengan signature valid — cek tabel `webhook_logs`, kolom
         `signature_valid` harus `true`
   - [ ] Status pesanan menjadi `SUCCESS` dan Serial Number tampil di halaman invoice
   - [ ] Item benar-benar masuk ke akun game

Kalau ketiganya lolos, toko siap dipakai.

---

## Operasional harian

| Pekerjaan | Di mana |
|---|---|
| Konfirmasi pembayaran manual | `/admin/orders` → **Tandai Lunas** |
| Pantau saldo deposit | `/admin` → **Cek Saldo Deposit** |
| Tambah game baru | `/admin` → **Sinkron Katalog** → `/admin/games` → aktifkan |
| Ubah margin | `/admin/settings` (global) atau `/admin/products` (per nominal) |
| Pesanan macet | `/admin/orders` → **Cek Status** atau **Ulangi Kirim** |

### Cron bawaan Vercel

`vercel.json` sudah disetel untuk paket **Hobby**, yang hanya mengizinkan cron
**sekali sehari** per job (jadwal lebih sering ditolak saat Deploy):

- `/api/cron/sync` — 03.00 WIB, menyegarkan katalog & harga modal
- `/api/cron/reconcile` — 03.30 WIB, jaring pengaman harian

### Rekonsiliasi tiap 5 menit (disarankan)

Sekali sehari terlalu jarang untuk menutup pesanan kedaluwarsa dan mengejar webhook
yang telat. Pakai pemanggil eksternal gratis — daftar di
[cron-job.org](https://cron-job.org), lalu buat satu job:

| Kolom | Isi |
|---|---|
| URL | `https://topup.sayba.id/api/cron/reconcile` |
| Jadwal | Every 5 minutes |
| Request method | GET |
| Header | `Authorization: Bearer <isi CRON_SECRET kamu>` |

Alternatif lain: GitHub Actions dengan `schedule: cron`, atau naik ke Vercel Pro lalu
kembalikan jadwal di `vercel.json` menjadi `*/5 * * * *`.

> Tanpa ini pun pesanan tetap selesai: halaman invoice pembeli menyegarkan statusnya
> sendiri tiap 8 detik dan ikut menarik status terbaru dari NexShop.

---

## Pemecahan masalah

| Gejala | Penyebab & solusi |
|---|---|
| `401 SECRET_KEY_REQUIRED` | `NEXSHOP_SECRET_KEY` belum diisi di Vercel, atau lupa redeploy setelah mengisinya |
| `403 IP_NOT_WHITELISTED` | Kolom IP Whitelist di Partner Portal terisi. Kosongkan (lihat Tahap 6) |
| `403 RESELLER_NOT_APPROVED` | Akun portal belum diverifikasi admin NexShop |
| `429 RATE_LIMITED` | Melebihi 120 permintaan/menit. Kurangi frekuensi sinkronisasi |
| Webhook selalu `401` | `NEXSHOP_WEBHOOK_SECRET` tidak cocok dengan Partner Portal |
| Etalase kosong | Belum sinkron katalog, atau semua game masih nonaktif |
| Game tertentu tidak muncul setelah sinkron | Produknya berada di kategori NexShop selain `Gaming` / `Voucher Game`. Tambahkan kategorinya di `GAME_CATEGORIES` pada `src/lib/sync.ts` |
| Satu game muncul dua kartu | Migrasi 03 belum dijalankan, atau nama operatornya belum dikenali. Tambahkan aliasnya di `src/lib/game-presets.ts` |
| "Akses Ditolak" di `/admin` | Email kamu belum ada di tabel `admin_users` (Tahap 2) |
| Harga tidak berubah setelah margin diganti | Klik **Hitung Ulang Harga** di `/admin` |

---

## Sebelum go-live — daftar periksa

- [ ] Kredensial hanya ada di environment variable, tidak di dalam kode
- [ ] Webhook URL terdaftar dan tes-nya membalas `200`
- [ ] `NEXSHOP_WEBHOOK_SECRET` cocok dengan Partner Portal
- [ ] Nomor WhatsApp, rekening, dan gambar QRIS sudah diisi di `/admin/settings`
- [ ] Signup Supabase Auth dimatikan
- [ ] Saldo deposit cukup, dan ada kebiasaan memantaunya
- [ ] Halaman legal (Syarat & Ketentuan, Kebijakan Privasi) sudah dibaca ulang dan sesuai
- [ ] Satu transaksi uji berhasil dari ujung ke ujung
