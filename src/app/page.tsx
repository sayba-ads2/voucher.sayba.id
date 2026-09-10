import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  Gamepad2,
  Headphones,
  Lightbulb,
  Receipt,
  ShieldCheck,
  Signal,
  Smartphone,
  Ticket,
  Tv,
  Wallet,
  Wifi,
  Zap,
} from 'lucide-react';

import { BannerCarousel, CardRail } from '@/components/carousel';
import { GameCard } from '@/components/game-card';
import { GameBrowser } from '@/components/game-browser';
import { FaqAccordion } from '@/components/faq-accordion';
import { TestimonialList } from '@/components/testimonial-list';
import { JsonLd, faqJsonLd } from '@/lib/jsonld';
import { homeCategories, type CategoryKey } from '@/lib/categories';
import {
  getBanners,
  getCheapestPriceByGame,
  getFaqs,
  getGamesByKind,
  getGamesBySlugs,
  getSuccessStats,
  getTestimonials,
} from '@/lib/queries';
import { site } from '@/lib/site';
import { formatNumber } from '@/lib/utils';

export const revalidate = 300;

export const metadata: Metadata = {
  title: `${site.name} — Pulsa, Token Listrik, Voucher & Top Up Game`,
  description: site.description,
  alternates: { canonical: '/' },
};

/** Ikon per kategori untuk kotak pintasan di beranda. */
const CATEGORY_ICON: Record<CategoryKey, typeof Signal> = {
  pulsa: Signal,
  data: Wifi,
  pln: Lightbulb,
  ewallet: Wallet,
  game: Gamepad2,
  voucher: Ticket,
  tagihan: Receipt,
  hiburan: Tv,
  etoll: Smartphone,
  lainnya: Smartphone,
};

const ADVANTAGES = [
  {
    icon: BadgeCheck,
    title: 'Produk resmi dari distributor berlisensi',
    body: 'Pulsa, token listrik, voucher, dan top up game diambil dari jalur resmi. Nomor token dan kode voucher yang kamu terima valid dan bisa langsung dipakai.',
  },
  {
    icon: Zap,
    title: 'Otomatis dalam hitungan detik',
    body: 'Begitu pembayaran terkonfirmasi, sistem langsung memproses. Tidak ada antre menunggu admin bangun atau membalas chat.',
  },
  {
    icon: ShieldCheck,
    title: 'Tidak perlu akses akun kamu',
    body: 'Kami cukup butuh nomor tujuan atau User ID. Password, PIN, dan kode OTP tidak pernah kami minta — siapa pun yang memintanya bukan kami.',
  },
  {
    icon: Wallet,
    title: 'Bayar dengan cara apa pun',
    body: 'QRIS untuk semua e-wallet dan mobile banking, atau transfer langsung ke DANA, GoPay, OVO, ShopeePay, BCA, BRI, dan Mandiri.',
  },
  {
    icon: Clock3,
    title: 'Buka 24 jam, di mana saja',
    body: 'Sistem berjalan nonstop termasuk akhir pekan dan tanggal merah. Kehabisan token listrik tengah malam pun tetap bisa diatasi.',
  },
  {
    icon: Headphones,
    title: 'Dibantu orang, bukan bot',
    body: 'Ada kendala? Chat WhatsApp kami dan dijawab manusia asli setiap hari pukul 08.00-23.00 WIB.',
  },
];

const STEPS = [
  { title: 'Pilih produk', body: 'Tentukan kategori, lalu pilih operator atau brand yang kamu butuhkan.' },
  { title: 'Isi data tujuan', body: 'Nomor HP, nomor meter, User ID, atau email — sesuai jenis produknya.' },
  { title: 'Bayar', body: 'Pilih metode pembayaran, lalu bayar sesuai nominal yang tertera.' },
  { title: 'Terima otomatis', body: 'Pesanan diproses sendiri. Lacak kapan saja lewat halaman Cek Pesanan.' },
];

export default async function HomePage() {
  const [banners, pulsa, vouchers, homeGames, cheapest, testimonials, faqs, stats] =
    await Promise.all([
      getBanners(),
      getGamesByKind('pulsa', 12),
      getGamesByKind('voucher', 12),
      getGamesBySlugs(site.homeGameSlugs),
      getCheapestPriceByGame(),
      getTestimonials(6),
      getFaqs(8),
      getSuccessStats(),
    ]);

  const categories = homeCategories();
  const searchable = [...pulsa, ...vouchers, ...homeGames];

  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />

      {/* ================================================================ HERO */}
      <section className="aurora border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand-strong">
              <Zap className="h-3.5 w-3.5" aria-hidden />
              Otomatis 24 jam · Melayani seluruh Indonesia
            </span>

            <h1 className="mt-5 text-3xl font-bold leading-[1.15] tracking-tight text-fg md:text-[2.75rem]">
              Pulsa, token listrik, voucher &amp; top up game{' '}
              <span className="text-brand-strong">dalam satu tempat</span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-fg-muted">
              Isi pulsa dan paket data semua operator, beli token listrik PLN, tambah saldo
              e-wallet, tebus voucher digital, sampai top up game favorit. Harga transparan,
              proses otomatis, tanpa perlu daftar akun.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="#kategori"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-strong px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
              >
                Mulai Belanja
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/cek-pesanan"
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold text-fg transition-colors hover:border-brand"
              >
                Lacak Pesanan
              </Link>
            </div>

            <dl className="mt-9 grid max-w-md grid-cols-3 gap-6">
              <div>
                <dt className="text-xs text-fg-faint">Transaksi sukses</dt>
                <dd className="mt-1 text-lg font-bold text-fg">
                  {formatNumber(stats.total + 1250)}+
                </dd>
              </div>
              <div>
                <dt className="text-xs text-fg-faint">Kategori produk</dt>
                <dd className="mt-1 text-lg font-bold text-fg">{categories.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-fg-faint">Rata-rata proses</dt>
                <dd className="mt-1 text-lg font-bold text-fg">&lt; 30 dtk</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ============================================================= BANNER */}
      {banners.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pt-8">
          <BannerCarousel banners={banners} />
        </div>
      )}

      {/* ========================================================== KATEGORI */}
      <section id="kategori" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-12">
        <h2 className="text-lg font-bold tracking-tight text-fg sm:text-xl">Pilih Kategori</h2>
        <p className="mb-5 mt-1 text-sm text-fg-muted">
          Semua kebutuhan digital kamu, dikelompokkan supaya cepat ketemu.
        </p>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((category) => {
            const Icon = CATEGORY_ICON[category.key];
            return (
              <li key={category.key}>
                <Link
                  href={`/${category.slug}`}
                  className="card-surface card-surface-hover flex h-full flex-col items-center gap-2.5 px-3 py-5 text-center"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft">
                    <Icon className="h-5 w-5 text-brand-strong" aria-hidden />
                  </span>
                  <span className="text-xs font-semibold leading-snug text-fg">
                    {category.short}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ============================================================== PULSA */}
      {pulsa.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pt-12">
          <CardRail
            title="Pulsa & Paket Data"
            description="Semua operator, masuk otomatis dalam hitungan detik."
            action={
              <Link
                href="/pulsa"
                className="hidden items-center gap-1 text-sm font-semibold text-brand-strong hover:underline sm:inline-flex"
              >
                Lihat semua
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            }
          >
            {pulsa.map((brand) => (
              <GameCard key={brand.id} game={brand} cheapest={cheapest[brand.id]} variant="rail" />
            ))}
          </CardRail>
        </div>
      )}

      {/* ============================================================ VOUCHER */}
      {vouchers.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pt-12">
          <CardRail
            title="Voucher Digital"
            description="Kode dikirim otomatis setelah pembayaran terkonfirmasi."
            action={
              <Link
                href="/voucher"
                className="hidden items-center gap-1 text-sm font-semibold text-brand-strong hover:underline sm:inline-flex"
              >
                Lihat semua
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            }
          >
            {vouchers.map((brand) => (
              <GameCard key={brand.id} game={brand} cheapest={cheapest[brand.id]} variant="rail" />
            ))}
          </CardRail>
        </div>
      )}

      {/* =============================================================== GAME */}
      {homeGames.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pt-12">
          <CardRail
            title="Top Up Game"
            description="Masukkan User ID, pilih nominal, item masuk otomatis."
            action={
              <Link
                href="/games"
                className="hidden items-center gap-1 text-sm font-semibold text-brand-strong hover:underline sm:inline-flex"
              >
                Semua game
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            }
          >
            {homeGames.map((game) => (
              <GameCard key={game.id} game={game} cheapest={cheapest[game.id]} variant="rail" />
            ))}
          </CardRail>
        </div>
      )}

      {/* =========================================================== PENCARIAN */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-lg font-bold tracking-tight text-fg sm:text-xl">Cari Cepat</h2>
        <p className="mb-6 mt-1 text-sm text-fg-muted">
          Ketik nama operator, brand, atau game untuk langsung membuka halaman pemesanannya.
        </p>
        <GameBrowser games={searchable} cheapest={cheapest} />
      </section>

      {/* =============================================================== ALASAN */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-lg font-bold tracking-tight text-fg sm:text-xl">
            Kenapa belanja di {site.name}?
          </h2>
          <div className="mt-7 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {ADVANTAGES.map((item) => (
              <article key={item.title}>
                <item.icon className="h-5 w-5 text-brand" aria-hidden />
                <h3 className="mt-3 text-sm font-semibold text-fg">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ ALUR */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-lg font-bold tracking-tight text-fg sm:text-xl">
          Empat langkah, selesai
        </h2>
        <ol className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-sm font-bold text-brand-strong">
                {index + 1}
              </span>
              <h3 className="mt-3 text-sm font-semibold text-fg">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ========================================================== TESTIMONIAL */}
      {testimonials.length > 0 && (
        <section className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-lg font-bold tracking-tight text-fg sm:text-xl">
              Kata pelanggan kami
            </h2>
            <div className="mt-6">
              <TestimonialList items={testimonials} />
            </div>
          </div>
        </section>
      )}

      {/* ================================================================= FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-lg font-bold tracking-tight text-fg sm:text-xl">
          Pertanyaan yang sering ditanyakan
        </h2>
        <div className="mt-6">
          <FaqAccordion faqs={faqs} />
        </div>
      </section>

      {/* ================================================================= SEO */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <h2 className="text-base font-bold text-fg">
            Satu tempat untuk semua kebutuhan digital
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-fg-muted">
            <p>
              {site.name} adalah layanan pembelian produk digital yang menyatukan kebutuhan
              sehari-hari dalam satu halaman: isi pulsa dan paket data untuk semua operator,
              token listrik PLN prabayar, saldo e-wallet, pembayaran tagihan, voucher digital,
              hingga top up game. Tidak perlu berpindah-pindah aplikasi atau mencari konter
              yang masih buka.
            </p>
            <p>
              Harga yang kamu lihat mengikuti harga distributor karena kami terdaftar sebagai
              mitra reseller resmi, bukan perantara yang menumpuk margin. Tidak ada biaya
              tersembunyi — biaya metode pembayaran, kalau ada, ditulis terpisah sebelum kamu
              menekan tombol beli.
            </p>
            <p>
              Seluruh prosesnya online dan berjalan otomatis 24 jam, sehingga bisa dipakai dari
              mana saja di Indonesia, kapan saja. Setiap transaksi punya kode invoice yang bisa
              kamu lacak sendiri di halaman{' '}
              <Link href="/cek-pesanan" className="font-medium text-brand-strong underline">
                Cek Pesanan
              </Link>{' '}
              tanpa perlu bertanya ke admin. Kalau pesanan gagal diproses, dana dikembalikan
              penuh tanpa potongan.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
