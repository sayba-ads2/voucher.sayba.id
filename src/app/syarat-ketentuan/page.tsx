import type { Metadata } from 'next';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan',
  description:
    'Syarat dan ketentuan penggunaan layanan Sayba Voucher: aturan pemesanan, pembayaran, pengembalian dana, dan batasan tanggung jawab.',
  alternates: { canonical: '/syarat-ketentuan' },
};

const SECTIONS = [
  {
    title: '1. Penerimaan Ketentuan',
    body: [
      `Dengan melakukan pemesanan di ${site.name}, kamu dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan di halaman ini.`,
      'Kami dapat memperbarui ketentuan ini sewaktu-waktu. Versi terbaru yang berlaku adalah yang tercantum di halaman ini.',
    ],
  },
  {
    title: '2. Layanan yang Kami Sediakan',
    body: [
      'Kami menyediakan layanan pengisian ulang (top up) produk digital untuk berbagai permainan, berupa diamond, koin, UC, dan voucher sejenis.',
      'Kami bukan pengembang atau penerbit resmi game mana pun. Seluruh merek dagang, logo, dan nama produk adalah milik pemegang hak masing-masing.',
    ],
  },
  {
    title: '3. Ketepatan Data Pesanan',
    body: [
      'Kamu bertanggung jawab penuh atas kebenaran User ID, Server ID, dan data tujuan lain yang kamu masukkan.',
      'Pesanan yang sudah terkirim ke ID yang salah TIDAK dapat dibatalkan, ditarik kembali, atau diganti rugi. Gunakan fitur Cek Nickname sebelum membayar.',
    ],
  },
  {
    title: '4. Harga dan Pembayaran',
    body: [
      'Seluruh harga ditampilkan dalam Rupiah dan dapat berubah sewaktu-waktu mengikuti harga penyedia.',
      'Harga yang mengikat adalah harga yang tertera pada saat pesanan dibuat.',
      'Untuk pembayaran manual, nominal transfer harus sama persis termasuk kode unik. Nominal yang tidak sesuai dapat menyebabkan pesanan tidak terdeteksi otomatis dan perlu penanganan manual.',
      'Pesanan yang tidak dibayar sampai batas waktu akan dibatalkan otomatis oleh sistem.',
    ],
  },
  {
    title: '5. Proses dan Waktu Pengiriman',
    body: [
      'Pesanan diproses otomatis setelah pembayaran terkonfirmasi, umumnya dalam hitungan detik.',
      'Keterlambatan dapat terjadi bila server penyedia atau server game sedang gangguan, dalam pemeliharaan, atau ketika terjadi lonjakan transaksi.',
    ],
  },
  {
    title: '6. Pembatalan dan Pengembalian Dana',
    body: [
      'Pesanan yang sudah dibayar dan sedang diproses tidak dapat dibatalkan sepihak.',
      'Bila pesanan gagal diproses oleh penyedia, dana dikembalikan penuh tanpa potongan, paling lambat 1x24 jam kerja setelah kegagalan tercatat.',
      'Pengembalian dana dilakukan ke sumber pembayaran yang sama atau ke rekening/e-wallet yang kamu tunjuk.',
    ],
  },
  {
    title: '7. Larangan Penyalahgunaan',
    body: [
      'Dilarang menggunakan layanan ini untuk pencucian uang, transaksi dengan dana hasil kejahatan, penipuan, atau kegiatan lain yang melanggar hukum Republik Indonesia.',
      'Kami berhak menolak, menunda, atau membatalkan pesanan yang terindikasi penyalahgunaan, dan bila perlu melaporkannya kepada pihak berwenang.',
    ],
  },
  {
    title: '8. Batasan Tanggung Jawab',
    body: [
      'Tanggung jawab kami terbatas pada nilai transaksi yang bersangkutan.',
      'Kami tidak bertanggung jawab atas kerugian tidak langsung, termasuk namun tidak terbatas pada kehilangan akun akibat pelanggaran ketentuan penerbit game, pemblokiran akun, atau kehilangan kesempatan.',
    ],
  },
  {
    title: '9. Hubungi Kami',
    body: [
      `Pertanyaan mengenai ketentuan ini dapat disampaikan lewat WhatsApp admin atau email ${site.contact.email}.`,
    ],
  },
];

export default function SyaratKetentuanPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-extrabold text-fg">Syarat &amp; Ketentuan</h1>
      <p className="mt-2 text-xs text-fg-faint">Terakhir diperbarui: 5 September 2026</p>

      <div className="mt-8 space-y-7">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-base font-bold text-fg">{section.title}</h2>
            <div className="mt-2.5 space-y-2.5">
              {section.body.map((paragraph, index) => (
                <p key={index} className="text-sm leading-relaxed text-fg-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
