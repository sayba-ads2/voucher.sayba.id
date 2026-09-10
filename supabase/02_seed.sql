-- ============================================================================
-- SAYBA VOUCHER  ·  Data awal (seed)
-- Jalankan SETELAH 01_schema.sql
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. SETTINGS TOKO
-- ---------------------------------------------------------------------------
insert into public.settings (key, value) values
  ('store', jsonb_build_object(
      'name',        'Sayba Voucher',
      'tagline',     'Semua Kebutuhan Digital dalam Satu Tempat',
      'url',         'https://topup.sayba.id',
      'whatsapp',    '6287803445749',
      'email',       'sayba.help@gmail.com',
      'city',        'Pontianak',
      'province',    'Kalimantan Barat',
      'address',     'Pontianak, Kalimantan Barat 78121',
      'open_hours',  '08:00-23:00 WIB',
      'instagram',   'https://instagram.com/saybaarc',
      'tiktok',      'https://tiktok.com/@saybaarc'
  )),
  -- Margin default dipakai kalau produk tidak punya margin sendiri.
  -- rounding: pembulatan harga jual ke atas (100 = Rp100 terdekat).
  ('pricing', jsonb_build_object(
      'margin_type',  'percent',
      'margin_value', 6,
      'min_margin',   500,
      'rounding',     100,
      'unique_code',  true,
      'unique_code_max', 199
  )),
  ('order', jsonb_build_object(
      'expire_minutes',   60,
      'auto_process',     true,
      'require_whatsapp', true,
      'require_email',    false
  )),
  ('maintenance', jsonb_build_object('enabled', false, 'message', ''))
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 2. METODE PEMBAYARAN
--    provider 'manual' = pembeli transfer/scan, admin konfirmasi di dashboard.
--    Ganti ke 'midtrans' / 'tripay' saat gateway sudah aktif.
-- ---------------------------------------------------------------------------
insert into public.payment_methods
  (code, name, group_name, provider, fee_flat, fee_percent, account_name, account_number, sort_order, instructions)
values
  ('QRIS', 'QRIS (Semua E-Wallet & Bank)', 'QRIS', 'manual', 0, 0.7, 'SAYBA ARC', null, 1,
   '["Buka aplikasi e-wallet atau mobile banking apa pun.","Pilih menu Scan QRIS lalu scan kode di halaman pembayaran.","Pastikan nominal SAMA PERSIS sampai 3 digit terakhir.","Selesaikan pembayaran, pesanan diproses otomatis."]'::jsonb),
  ('DANA', 'DANA', 'E-Wallet', 'manual', 0, 0, 'SAYBA ARC', '081234567890', 10,
   '["Buka aplikasi DANA lalu pilih Kirim / Transfer.","Masukkan nomor tujuan yang tertera.","Kirim nominal SAMA PERSIS termasuk kode unik.","Simpan bukti transfer bila diminta admin."]'::jsonb),
  ('GOPAY', 'GoPay', 'E-Wallet', 'manual', 0, 0, 'SAYBA ARC', '081234567890', 11,
   '["Buka Gojek/GoPay lalu pilih Bayar atau Transfer.","Masukkan nomor tujuan yang tertera.","Kirim nominal SAMA PERSIS termasuk kode unik."]'::jsonb),
  ('OVO', 'OVO', 'E-Wallet', 'manual', 0, 0, 'SAYBA ARC', '081234567890', 12,
   '["Buka aplikasi OVO lalu pilih Transfer.","Masukkan nomor tujuan yang tertera.","Kirim nominal SAMA PERSIS termasuk kode unik."]'::jsonb),
  ('SHOPEEPAY', 'ShopeePay', 'E-Wallet', 'manual', 0, 0, 'SAYBA ARC', '081234567890', 13,
   '["Buka Shopee lalu masuk ke ShopeePay.","Pilih Transfer dan masukkan nomor tujuan.","Kirim nominal SAMA PERSIS termasuk kode unik."]'::jsonb),
  ('BCA', 'Transfer Bank BCA', 'Bank Transfer', 'manual', 0, 0, 'SAYBA ARC', '1234567890', 20,
   '["Transfer ke rekening BCA yang tertera.","Nominal harus SAMA PERSIS termasuk kode unik.","Pesanan diproses setelah dana masuk."]'::jsonb),
  ('BRI', 'Transfer Bank BRI', 'Bank Transfer', 'manual', 0, 0, 'SAYBA ARC', '1234567890', 21,
   '["Transfer ke rekening BRI yang tertera.","Nominal harus SAMA PERSIS termasuk kode unik.","Pesanan diproses setelah dana masuk."]'::jsonb),
  ('MANDIRI', 'Transfer Bank Mandiri', 'Bank Transfer', 'manual', 0, 0, 'SAYBA ARC', '1234567890', 22,
   '["Transfer ke rekening Mandiri yang tertera.","Nominal harus SAMA PERSIS termasuk kode unik.","Pesanan diproses setelah dana masuk."]'::jsonb)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- 3. FAQ  (juga dipakai untuk structured data FAQPage di halaman depan)
-- ---------------------------------------------------------------------------
insert into public.faqs (question, answer, sort_order) values
  ('Produk apa saja yang bisa dibeli di sini?',
   'Pulsa dan paket data semua operator, token listrik PLN prabayar, saldo e-wallet seperti DANA, GoPay, OVO, dan ShopeePay, pembayaran tagihan seperti PDAM dan BPJS, voucher digital seperti Steam dan Google Play, serta top up game.', 1),
  ('Berapa lama pesanan saya diproses?',
   'Rata-rata 3-30 detik setelah pembayaran terkonfirmasi. Pulsa, token listrik, saldo, dan item game masuk otomatis tanpa perlu menunggu admin.', 2),
  ('Apakah transaksi di sini aman?',
   'Aman. Semua produk diambil dari distributor berlisensi, dan kami hanya meminta nomor tujuan atau User ID. Password, PIN, dan kode OTP tidak pernah kami minta.', 3),
  ('Metode pembayaran apa saja yang tersedia?',
   'QRIS yang bisa discan dari semua e-wallet dan mobile banking, transfer ke DANA, GoPay, OVO, dan ShopeePay, serta transfer bank BCA, BRI, dan Mandiri.', 4),
  ('Kenapa harganya bisa lebih murah?',
   'Kami mengambil harga distributor langsung sebagai mitra reseller resmi, sehingga margin yang kami ambil jauh lebih tipis dibanding harga eceran pada umumnya.', 5),
  ('Bagaimana kalau pesanan saya gagal?',
   'Buka halaman Cek Pesanan dan masukkan kode invoice kamu. Jika statusnya gagal, dana dikembalikan penuh tanpa potongan.', 6),
  ('Apakah perlu daftar atau punya akun dulu?',
   'Tidak perlu. Pilih produk, masukkan nomor tujuan, bayar, selesai.', 7),
  ('Apakah melayani seluruh Indonesia?',
   'Ya. Seluruh prosesnya online sehingga bisa diakses dari mana saja di Indonesia, kapan saja, termasuk hari libur.', 8),
  ('Bisa transaksi tengah malam?',
   'Bisa. Sistem berjalan otomatis 24 jam. Admin manusia siaga pukul 08.00-23.00 WIB.', 9),
  ('Nomor token listrik saya dikirim ke mana?',
   'Nomor token tampil di halaman invoice pesananmu dan juga dikirim ke nomor WhatsApp yang kamu isi saat checkout.', 10)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 4. TESTIMONI
--    Sengaja dibiarkan kosong. Isi hanya dengan testimoni asli dari pelanggan
--    kamu — testimoni karangan menyesatkan pembeli dan berisiko bagi tokomu.
--    Bagian testimoni di beranda tersembunyi otomatis selama tabel ini kosong.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 5. JADIKAN DIRIMU ADMIN
--    Langkah:
--    a) Supabase Dashboard > Authentication > Users > Add user
--       (email + password, centang "Auto Confirm User")
--    b) Ganti email di bawah, lalu jalankan blok ini.
-- ---------------------------------------------------------------------------
insert into public.admin_users (id, email, full_name, role)
select id, email, 'Owner Sayba Arc', 'owner'
from auth.users
where email = 'sayba.help@gmail.com'
on conflict (id) do update set is_active = true, role = 'owner';
