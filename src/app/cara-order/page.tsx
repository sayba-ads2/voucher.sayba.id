import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Cara Order — Panduan Lengkap untuk Pemula',
  description:
    'Panduan langkah demi langkah cara top up game di Sayba Voucher: dari memilih game, menemukan User ID, memilih nominal, sampai membayar lewat QRIS atau transfer bank.',
  alternates: { canonical: '/cara-order' },
};

const STEPS = [
  {
    title: 'Pilih game yang mau di-top up',
    body: 'Buka halaman Semua Game atau ketik nama game di kolom pencarian halaman depan. Klik game yang kamu mau untuk membuka halaman pemesanannya.',
  },
  {
    title: 'Masukkan User ID (dan Server ID bila diminta)',
    body: 'User ID biasanya ada di halaman profil dalam game. Untuk Mobile Legends, ketuk foto profil di pojok kiri atas — angka pertama adalah User ID dan angka dalam kurung adalah Zone ID.',
  },
  {
    title: 'Klik Cek Nickname',
    body: 'Untuk game yang didukung, tombol ini menampilkan nama akun kamu. Kalau nama yang muncul benar, berarti ID sudah tepat. Langkah ini mencegah kesalahan kirim yang tidak bisa dibatalkan.',
  },
  {
    title: 'Pilih nominal',
    body: 'Semua harga yang tampil sudah harga akhir. Tidak ada biaya tersembunyi di luar biaya metode pembayaran yang tertulis jelas.',
  },
  {
    title: 'Pilih metode pembayaran',
    body: 'QRIS bisa discan dari aplikasi bank atau e-wallet apa pun. Kamu juga bisa transfer langsung ke DANA, GoPay, OVO, ShopeePay, BCA, BRI, atau Mandiri.',
  },
  {
    title: 'Isi nomor WhatsApp',
    body: 'Nomor ini kami pakai untuk mengirim bukti transaksi dan menghubungi kamu bila ada kendala. Nomor kamu tidak pernah kami bagikan ke pihak lain.',
  },
  {
    title: 'Bayar sesuai nominal yang tertera',
    body: 'Untuk pembayaran manual, nominal harus sama persis sampai tiga digit terakhir. Angka unik itulah yang membuat pembayaranmu terdeteksi otomatis.',
  },
  {
    title: 'Tunggu beberapa detik',
    body: 'Begitu pembayaran terkonfirmasi, pesanan langsung diteruskan ke penyedia. Status di halaman invoice akan berubah sendiri tanpa perlu di-refresh.',
  },
];

export default function CaraOrderPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Beranda', path: '/' },
            { name: 'Cara Order', path: '/cara-order' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: 'Cara Top Up Game di Sayba Voucher',
            description:
              'Panduan langkah demi langkah melakukan top up diamond dan voucher game secara online.',
            totalTime: 'PT3M',
            step: STEPS.map((step, index) => ({
              '@type': 'HowToStep',
              position: index + 1,
              name: step.title,
              text: step.body,
            })),
          },
        ]}
      />

      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold tracking-tight text-fg">Cara Order</h1>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          Baru pertama kali top up online? Ikuti delapan langkah di bawah ini. Seluruh prosesnya
          biasanya selesai dalam waktu kurang dari tiga menit.
        </p>

        <ol className="mt-8 space-y-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="card-surface flex gap-4 p-5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-strong text-sm font-bold text-white">
                {index + 1}
              </span>
              <div>
                <h2 className="text-sm font-bold text-fg">{step.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="card-surface mt-8 p-5">
          <h2 className="text-sm font-bold text-fg">Masih bingung?</h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            Chat admin kami lewat WhatsApp — dibalas manusia asli setiap hari {site.contact.hours}.
            Kami biasa memandu pelanggan yang benar-benar baru sampai transaksinya berhasil.
          </p>
          <Link
            href="/kontak"
            className="mt-4 inline-flex rounded-lg bg-brand-strong px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-hover"
          >
            Hubungi Admin
          </Link>
        </div>
      </div>
    </>
  );
}
