import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Clock3, ShieldCheck, Zap } from 'lucide-react';

import { OrderForm } from '@/components/order-form';
import { JsonLd, breadcrumbJsonLd, brandProductJsonLd } from '@/lib/jsonld';
import {
  getActiveGames,
  getGameBySlug,
  getOrderSettings,
  getPaymentMethods,
  getPublicProducts,
} from '@/lib/queries';
import { canonical, site } from '@/lib/site';
import { formatRupiah } from '@/lib/utils';

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

/** Pra-render seluruh halaman game aktif saat build agar cepat & mudah di-crawl. */
export async function generateStaticParams() {
  const games = await getActiveGames();
  return games.map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: 'Game tidak ditemukan' };

  const products = await getPublicProducts(game.id);
  const cheapest = products.length ? Math.min(...products.map((p) => p.sell_price)) : 0;

  const title =
    game.seo_title ?? `Top Up ${game.name} Murah — Mulai ${formatRupiah(cheapest)} | Proses Otomatis`;
  const description =
    game.seo_description ??
    `Top up ${game.name} murah dan legal di Pontianak. ${products.length} pilihan nominal mulai ${formatRupiah(cheapest)}, proses otomatis 24 jam, bayar pakai QRIS, DANA, GoPay, OVO, ShopeePay, atau transfer bank. Tanpa login akun game.`;

  return {
    title,
    description,
    keywords: game.seo_keywords ?? [
      `top up ${game.name.toLowerCase()}`,
      `top up ${game.name.toLowerCase()} murah`,
      `top up ${game.name.toLowerCase()} pontianak`,
      `diamond ${game.name.toLowerCase()} murah`,
      'top up game murah',
    ],
    alternates: { canonical: `/${game.slug}` },
    openGraph: {
      type: 'website',
      url: canonical(`/${game.slug}`),
      title,
      description,
      images: [{ url: game.banner_url ?? site.ogImage, width: 1200, height: 630, alt: game.name }],
    },
  };
}

export default async function GamePage({ params }: Props) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) notFound();

  const [products, paymentMethods, orderSettings] = await Promise.all([
    getPublicProducts(game.id),
    getPaymentMethods(),
    getOrderSettings(),
  ]);

  const cheapest = products.length ? Math.min(...products.map((p) => p.sell_price)) : 0;
  const howTo = Array.isArray(game.how_to_order) ? game.how_to_order : [];

  return (
    <>
      <JsonLd
        data={[
          brandProductJsonLd(game, products),
          breadcrumbJsonLd([
            { name: 'Beranda', path: '/' },
            { name: 'Semua Game', path: '/games' },
            { name: `Top Up ${game.name}`, path: `/${game.slug}` },
          ]),
        ]}
      />

      {/* ========================================================== BREADCRUMB */}
      <nav aria-label="Breadcrumb" className="border-b border-line bg-surface">
        <ol className="mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 py-3 text-xs text-fg-faint no-scrollbar">
          <li><Link href="/" className="hover:text-brand-strong">Beranda</Link></li>
          <ChevronRight className="h-3 w-3 shrink-0" aria-hidden />
          <li><Link href="/games" className="hover:text-brand-strong">Semua Game</Link></li>
          <ChevronRight className="h-3 w-3 shrink-0" aria-hidden />
          <li className="whitespace-nowrap font-semibold text-fg-body" aria-current="page">
            Top Up {game.name}
          </li>
        </ol>
      </nav>

      {/* =============================================================== HEADER */}
      <section className="aurora border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-wrap items-start gap-5">
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-surface-3 text-2xl font-black text-brand ring-1 ring-line">
              {game.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-fg md:text-3xl">
                Top Up {game.name} Murah
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">
                {game.short_description ??
                  `Isi ulang ${game.name} dengan harga distributor, proses otomatis, dan tanpa perlu login akun.`}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-fg-body">
                  <Zap className="h-3.5 w-3.5 text-brand" aria-hidden /> Proses otomatis
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-fg-body">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden /> Tanpa login akun
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-fg-body">
                  <Clock3 className="h-3.5 w-3.5 text-brand" aria-hidden /> Buka 24 jam
                </span>
                {cheapest > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-2.5 py-1.5 font-semibold text-brand-strong">
                    Mulai {formatRupiah(cheapest)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ ORDER */}
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OrderForm
            game={game}
            products={products}
            paymentMethods={paymentMethods}
            requireWhatsapp={orderSettings.require_whatsapp}
          />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {howTo.length > 0 && (
            <section className="card-surface p-5">
              <h2 className="text-sm font-bold text-fg">Cara Top Up {game.name}</h2>
              <ol className="mt-3 space-y-2.5">
                {howTo.map((step, index) => (
                  <li key={index} className="flex gap-2.5 text-sm text-fg-muted">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-surface-3 text-[11px] font-bold text-brand-strong">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="card-surface p-5">
            <h2 className="text-sm font-bold text-fg">Garansi Kami</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-fg-muted">
              <li>Pesanan gagal → dana kembali penuh tanpa potongan.</li>
              <li>Kami tidak pernah meminta password, email, atau OTP akun game kamu.</li>
              <li>Setiap transaksi punya kode invoice yang bisa dilacak sendiri.</li>
              <li>Admin manusia siaga {site.contact.hours}.</li>
            </ul>
          </section>
        </aside>
      </div>

      {/* ============================================================ SEO TEKS */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <h2 className="text-lg font-extrabold text-fg">
            Beli Diamond {game.name} Murah di Pontianak
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-fg-muted">
            <p>
              {game.name} adalah salah satu game yang paling banyak di-top up pelanggan{' '}
              {site.name}. Di halaman ini tersedia {products.length} pilihan nominal
              {cheapest > 0 ? `, mulai dari ${formatRupiah(cheapest)}` : ''}, yang bisa kamu beli
              kapan saja tanpa perlu mendaftar akun terlebih dahulu.
            </p>
            <p>
              Cukup masukkan {game.id_label}
              {game.needs_server_id ? ` dan ${game.server_label}` : ''}, pilih nominalnya, lalu
              selesaikan pembayaran lewat QRIS, DANA, GoPay, OVO, ShopeePay, atau transfer bank
              BCA, BRI, dan Mandiri. Begitu pembayaran masuk, sistem langsung memproses pesanan
              dan item biasanya sampai di akun kamu dalam hitungan detik.
            </p>
            <p>
              Kami melayani gamer di Pontianak, Kubu Raya, Mempawah, Singkawang, dan seluruh
              Kalimantan Barat — juga pembeli dari luar daerah, karena semua prosesnya online.
              Bandingkan dulu harganya dengan tempat lain: kami yakin selisihnya terasa.
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-line bg-surface-2 p-5">
            <h3 className="text-sm font-bold text-fg">Belum menemukan game yang kamu cari?</h3>
            <p className="mt-1.5 text-sm text-fg-muted">
              Lihat seluruh katalog kami atau minta admin menambahkan game baru.
            </p>
            <Link
              href="/games"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-strong px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-hover"
            >
              Lihat Semua Game
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
