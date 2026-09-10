import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Tentang Kami — Layanan Top Up Game Asal Pontianak',
  description:
    'Sayba Voucher adalah toko voucher digital dan top up game milik Sayba Arc, berbasis di Pontianak, Kalimantan Barat. Kenali cara kerja, komitmen harga, dan jaminan keamanan kami.',
  alternates: { canonical: '/tentang-kami' },
};

export default function TentangKamiPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Beranda', path: '/' },
          { name: 'Tentang Kami', path: '/tentang-kami' },
        ])}
      />

      <article className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-extrabold text-fg">Tentang {site.name}</h1>

        <div className="mt-6 space-y-5 text-sm leading-relaxed text-fg-muted">
          <p>
            {site.name} adalah layanan top up game digital di bawah naungan{' '}
            <strong className="text-fg">Sayba Arc</strong>, berbasis di Kota Pontianak,
            Kalimantan Barat. Kami memulai layanan ini karena satu hal sederhana: harga top up di
            banyak tempat masih terlalu jauh dari harga distributor, dan prosesnya sering
            bergantung pada admin yang harus online.
          </p>

          <h2 className="pt-2 text-base font-bold text-fg">Bagaimana kami bekerja</h2>
          <p>
            Kami terdaftar sebagai mitra reseller pada distributor produk digital berlisensi.
            Artinya, katalog dan harga modal kami tarik langsung lewat jalur resmi, lalu kami
            tambahkan margin yang tipis dan wajar. Pesanan kamu diteruskan otomatis oleh sistem
            begitu pembayaran terkonfirmasi — tidak menunggu admin membuka ponsel.
          </p>

          <h2 className="pt-2 text-base font-bold text-fg">Komitmen kami</h2>
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong className="text-fg">Harga transparan.</strong> Angka yang tampil di
              halaman produk adalah angka yang kamu bayar. Biaya metode pembayaran, kalau ada,
              ditulis terpisah sebelum kamu menekan tombol beli.
            </li>
            <li>
              <strong className="text-fg">Tidak pernah meminta akses akun.</strong> Kami
              hanya butuh User ID dan Server ID. Siapa pun yang mengaku dari kami lalu meminta
              password, email, atau kode OTP akun game kamu adalah penipu.
            </li>
            <li>
              <strong className="text-fg">Gagal berarti uang kembali.</strong> Bila penyedia
              menolak pesanan, dana dikembalikan penuh tanpa potongan.
            </li>
            <li>
              <strong className="text-fg">Setiap transaksi punya jejak.</strong> Kode
              invoice bisa kamu lacak sendiri kapan saja tanpa harus bertanya ke admin.
            </li>
          </ul>

          <h2 className="pt-2 text-base font-bold text-fg">Untuk siapa layanan ini</h2>
          <p>
            Untuk siapa pun di Indonesia yang butuh isi pulsa tengah malam, kehabisan token
            listrik saat toko sudah tutup, ingin menambah saldo e-wallet tanpa biaya admin
            bank, atau sekadar membeli diamond sebelum event dalam game berakhir. Semua
            prosesnya online sehingga tidak bergantung pada lokasi maupun jam buka konter.
          </p>
        </div>

        <div className="card-surface mt-8 p-5">
          <h2 className="text-sm font-bold text-fg">Siap mencoba?</h2>
          <p className="mt-2 text-sm text-fg-muted">
            Mulai dari nominal terkecil dulu kalau kamu masih ragu. Kami tidak keberatan.
          </p>
          <Link
            href="/games"
            className="mt-4 inline-flex rounded-lg bg-brand-strong px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-hover"
          >
            Lihat Daftar Game
          </Link>
        </div>
      </article>
    </>
  );
}
