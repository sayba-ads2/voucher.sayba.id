import type { Metadata } from 'next';
import { Clock, Mail, MapPin, MessageCircle } from 'lucide-react';
import { JsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
import { getStoreSettings } from '@/lib/queries';
import { site } from '@/lib/site';
import { waLink } from '@/lib/utils';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kontak & Bantuan',
  description:
    'Hubungi admin Sayba Voucher lewat WhatsApp atau email. Kami berbasis di Pontianak, Kalimantan Barat, dan siap membantu kendala transaksi top up game kamu.',
  alternates: { canonical: '/kontak' },
};

export default async function KontakPage() {
  const store = await getStoreSettings();
  const whatsapp = store.whatsapp || site.contact.whatsapp;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Beranda', path: '/' },
          { name: 'Kontak', path: '/kontak' },
        ])}
      />

      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-extrabold text-fg">Kontak &amp; Bantuan</h1>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          Ada kendala transaksi, pertanyaan harga, atau mau request game baru? Hubungi kami lewat
          salah satu kanal di bawah ini.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <a
            href={waLink(whatsapp, 'Halo admin Sayba Voucher, saya mau bertanya.')}
            target="_blank"
            rel="noopener noreferrer"
            className="card-surface card-surface-hover p-5"
          >
            <MessageCircle className="h-6 w-6 text-success" aria-hidden />
            <h2 className="mt-3 text-sm font-bold text-fg">WhatsApp Admin</h2>
            <p className="mt-1.5 text-sm text-fg-muted">
              Kanal tercepat. Dibalas manusia asli, bukan bot.
            </p>
            <p className="mt-2 font-mono text-sm text-brand-strong">+{whatsapp}</p>
          </a>

          <a href={`mailto:${site.contact.email}`} className="card-surface card-surface-hover p-5">
            <Mail className="h-6 w-6 text-brand" aria-hidden />
            <h2 className="mt-3 text-sm font-bold text-fg">Email</h2>
            <p className="mt-1.5 text-sm text-fg-muted">
              Untuk keperluan kerja sama, penagihan, atau laporan resmi.
            </p>
            <p className="mt-2 text-sm text-brand-strong">{site.contact.email}</p>
          </a>

          <div className="card-surface p-5">
            <Clock className="h-6 w-6 text-brand" aria-hidden />
            <h2 className="mt-3 text-sm font-bold text-fg">Jam Layanan</h2>
            <p className="mt-1.5 text-sm text-fg-muted">
              Admin: {site.contact.hours}
              <br />
              Sistem otomatis: 24 jam setiap hari, termasuk hari libur.
            </p>
          </div>

          <div className="card-surface p-5">
            <MapPin className="h-6 w-6 text-brand" aria-hidden />
            <h2 className="mt-3 text-sm font-bold text-fg">Lokasi</h2>
            <p className="mt-1.5 text-sm text-fg-muted">
              {site.address.city}, {site.address.region}, Indonesia.
              <br />
              Layanan sepenuhnya online — tidak ada toko fisik.
            </p>
          </div>
        </div>

        <div className="card-surface mt-6 p-5">
          <h2 className="text-sm font-bold text-fg">Sebelum menghubungi kami</h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            Untuk kendala pesanan, siapkan <strong>kode invoice</strong> kamu (format
            TGM-XXXXXX-XXXXXX). Dengan kode itu kami bisa langsung melihat status pesanan dan
            menanganinya jauh lebih cepat.
          </p>
        </div>
      </div>
    </>
  );
}
