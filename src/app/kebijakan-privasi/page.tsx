import type { Metadata } from 'next';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
  description:
    'Kebijakan privasi Sayba Voucher: data apa yang kami kumpulkan, untuk apa dipakai, berapa lama disimpan, dan hak kamu atas data tersebut.',
  alternates: { canonical: '/kebijakan-privasi' },
};

const SECTIONS = [
  {
    title: '1. Data yang Kami Kumpulkan',
    body: [
      'Data pesanan: User ID game, Server ID, nickname hasil validasi, produk yang dibeli, dan nominal transaksi.',
      'Data kontak: nomor WhatsApp, dan email bila kamu mengisinya.',
      'Data teknis: alamat IP dan jenis peramban, dicatat untuk keperluan keamanan dan pencegahan penyalahgunaan.',
      'Kami TIDAK pernah meminta dan tidak pernah menyimpan password, email login, atau kode OTP akun game kamu.',
    ],
  },
  {
    title: '2. Cara Kami Memakai Data',
    body: [
      'Memproses pesanan dan meneruskannya ke penyedia produk digital.',
      'Menghubungi kamu terkait status pesanan atau kendala transaksi.',
      'Mencegah penipuan, penyalahgunaan layanan, dan transaksi mencurigakan.',
      'Menyusun statistik agregat untuk memperbaiki layanan. Statistik ini tidak mengidentifikasi individu.',
    ],
  },
  {
    title: '3. Berbagi Data dengan Pihak Ketiga',
    body: [
      'User ID, Server ID, dan kode produk diteruskan kepada penyedia produk digital semata-mata agar pesanan dapat dieksekusi.',
      'Kami tidak menjual, menyewakan, atau menukarkan data pribadi kamu kepada pihak mana pun untuk kepentingan pemasaran.',
      'Data dapat dibuka kepada aparat penegak hukum apabila diminta secara sah berdasarkan hukum yang berlaku.',
    ],
  },
  {
    title: '4. Penyimpanan dan Keamanan',
    body: [
      'Data disimpan di infrastruktur basis data terkelola dengan koneksi terenkripsi dan kontrol akses berlapis.',
      'Kredensial layanan disimpan sebagai variabel lingkungan di sisi server dan tidak pernah dikirim ke peramban.',
      'Data transaksi disimpan selama diperlukan untuk keperluan pembukuan dan penyelesaian sengketa, umumnya 24 bulan.',
    ],
  },
  {
    title: '5. Cookie',
    body: [
      'Situs ini hanya memakai cookie fungsional yang diperlukan agar halaman bekerja dengan benar, termasuk sesi login dashboard admin.',
      'Kami tidak memasang cookie iklan pihak ketiga untuk melacak kamu lintas situs.',
    ],
  },
  {
    title: '6. Hak Kamu',
    body: [
      'Kamu berhak meminta salinan data pribadi yang kami simpan, meminta perbaikan data yang keliru, atau meminta penghapusan data yang tidak lagi kami perlukan untuk kewajiban hukum.',
      `Ajukan permintaan tersebut lewat email ${site.contact.email} dengan menyertakan kode invoice sebagai bukti kepemilikan data.`,
    ],
  },
  {
    title: '7. Anak di Bawah Umur',
    body: [
      'Layanan ini ditujukan untuk pengguna berusia 13 tahun ke atas. Pengguna di bawah 17 tahun sebaiknya bertransaksi dengan sepengetahuan orang tua atau wali.',
    ],
  },
  {
    title: '8. Perubahan Kebijakan',
    body: [
      'Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan berlaku sejak dimuat di halaman ini.',
    ],
  },
];

export default function KebijakanPrivasiPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-extrabold text-fg">Kebijakan Privasi</h1>
      <p className="mt-2 text-xs text-fg-faint">Terakhir diperbarui: 5 September 2026</p>

      <div className="mt-8 space-y-7">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-base font-bold text-fg">{section.title}</h2>
            <ul className="mt-2.5 space-y-2 text-sm leading-relaxed text-fg-muted">
              {section.body.map((paragraph, index) => (
                <li key={index}>{paragraph}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}
