# Aset publik

Folder ini sengaja hampir kosong. Ikon situs, favicon, dan gambar Open Graph
dibuat otomatis oleh kode:

- `src/app/icon.svg`  -> favicon & ikon PWA
- `src/app/api/og`    -> gambar Open Graph 1200x630 yang dirender saat diminta

## Kalau kamu punya berkas logo resmi Sayba Arc

Taruh di sini sebagai `logo.png` (disarankan 512x512, latar transparan), lalu:

1. Ganti komponen `LogoMark` di `src/components/logo.tsx` dengan
   `<Image src="/logo.png" ... />`.
2. Untuk ikon game, unggah ke Supabase Storage (bucket publik) dan tempel URL-nya
   di kolom "URL Ikon" pada `/admin/games` -- jangan menaruhnya di folder ini,
   supaya menambah game baru tidak perlu deploy ulang.
