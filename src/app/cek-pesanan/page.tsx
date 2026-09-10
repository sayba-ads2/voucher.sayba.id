import type { Metadata } from 'next';
import { Receipt } from 'lucide-react';
import { TrackOrderForm } from '@/components/track-order-form';
import { JsonLd, breadcrumbJsonLd } from '@/lib/jsonld';

export const metadata: Metadata = {
  title: 'Cek Status Pesanan Top Up',
  description:
    'Lacak status pesanan top up game kamu memakai kode invoice. Lihat apakah pembayaran sudah masuk dan apakah diamond sudah dikirim ke akun game.',
  alternates: { canonical: '/cek-pesanan' },
};

export default function CekPesananPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Beranda', path: '/' },
          { name: 'Cek Pesanan', path: '/cek-pesanan' },
        ])}
      />
      <div className="mx-auto max-w-xl px-4 py-14">
        <div className="text-center">
          <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-surface-2 ring-1 ring-line">
            <Receipt className="h-6 w-6 text-brand" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-fg">Cek Status Pesanan</h1>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            Masukkan kode invoice yang kamu terima saat checkout, misalnya
            <span className="mx-1 font-mono text-fg-body">TGM-260905-K7QX4M</span>.
          </p>
        </div>

        <div className="mt-8">
          <TrackOrderForm />
        </div>

        <div className="card-surface mt-8 p-5">
          <h2 className="text-sm font-bold text-fg">Kode invoice kamu hilang?</h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            Hubungi admin lewat WhatsApp dan sebutkan User ID game, nominal, serta perkiraan
            waktu transaksi. Kami akan mencarikan pesanannya untuk kamu.
          </p>
        </div>
      </div>
    </>
  );
}
