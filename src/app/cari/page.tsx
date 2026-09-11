import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageCircle, SearchX } from 'lucide-react';

import { GameCard } from '@/components/game-card';
import { SearchBox } from '@/components/search-box';
import { JsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
import { getCategory, sortedCategories, type CategoryKey } from '@/lib/categories';
import { getActiveGames, getCheapestPriceByGame, getStoreSettings } from '@/lib/queries';
import { POPULAR_SEARCHES, searchBrands } from '@/lib/search';
import { site } from '@/lib/site';
import { waLink } from '@/lib/utils';

export const revalidate = 300;

type Props = { searchParams: Promise<{ q?: string; kategori?: string }> };

/**
 * Halaman hasil pencarian.
 *
 * Dirender di server, bukan di browser. Artinya hasilnya sudah ada di HTML
 * pertama: terbaca crawler, muncul walau JavaScript gagal dimuat, dan bisa
 * dibagikan sebagai tautan (/cari?q=netflix) yang langsung menampilkan hasil
 * yang sama untuk siapa pun yang membukanya.
 *
 * Halaman dengan kueri diberi noindex — isinya berubah-ubah dan akan bersaing
 * dengan halaman kategori dan halaman brand di hasil penelusuran. Yang
 * diindeks cukup /cari itu sendiri.
 */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const query = (q ?? '').trim();

  if (!query) {
    return {
      title: 'Cari Produk — Pulsa, Kuota, Voucher, Game & Hiburan',
      description: `Cari semua produk digital di ${site.name}: pulsa dan kuota semua operator, kartu perdana, token listrik PLN, saldo e-wallet, langganan Netflix dan Spotify, voucher game, sampai top up Mobile Legends dan Free Fire.`,
      alternates: { canonical: '/cari' },
    };
  }

  return {
    title: `Hasil pencarian "${query}"`,
    description: `Hasil pencarian "${query}" di ${site.name}. Proses otomatis 24 jam, harga transparan, bayar pakai QRIS, e-wallet, atau transfer bank.`,
    alternates: { canonical: '/cari' },
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = (params.q ?? '').trim();
  const categoryFilter = (params.kategori ?? '').trim() as CategoryKey | '';

  const [games, cheapest, store] = await Promise.all([
    getActiveGames(),
    getCheapestPriceByGame(),
    getStoreSettings(),
  ]);

  const matched = query ? searchBrands(games, query) : games;
  const results = categoryFilter ? matched.filter((game) => game.kind === categoryFilter) : matched;

  // Jumlah per kategori dihitung dari hasil pencarian, bukan dari seluruh
  // katalog — supaya chip yang ditampilkan selalu benar-benar berisi.
  const counts = new Map<CategoryKey, number>();
  for (const game of matched) counts.set(game.kind, (counts.get(game.kind) ?? 0) + 1);

  const availableCategories = sortedCategories().filter((c) => (counts.get(c.key) ?? 0) > 0);
  const whatsapp = store.whatsapp || site.contact.whatsapp;

  function filterHref(key: CategoryKey | '') {
    const search = new URLSearchParams();
    if (query) search.set('q', query);
    if (key) search.set('kategori', key);
    const qs = search.toString();
    return qs ? `/cari?${qs}` : '/cari';
  }

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Beranda', path: '/' },
          { name: 'Cari Produk', path: '/cari' },
        ])}
      />

      <section className="aurora border-b border-line">
        <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
          <h1 className="text-2xl font-bold tracking-tight text-fg md:text-3xl">
            {query ? (
              <>
                Hasil pencarian <span className="text-brand-strong">&ldquo;{query}&rdquo;</span>
              </>
            ) : (
              'Cari produk yang kamu butuhkan'
            )}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            {query
              ? `${results.length} produk ditemukan. Pilih salah satu untuk langsung memesan.`
              : 'Ketik nama produk, operator, game, atau layanan langganan — misalnya “Netflix”, “kuota XL”, atau “MLBB”.'}
          </p>

          <div className="mt-6">
            <SearchBox variant="hero" autoFocus={!query} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {availableCategories.length > 1 && (
          <nav aria-label="Saring berdasarkan kategori" className="mb-7">
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link
                  href={filterHref('')}
                  aria-current={categoryFilter ? undefined : 'page'}
                  className={
                    categoryFilter
                      ? 'inline-flex rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-fg-body hover:border-brand'
                      : 'inline-flex rounded-lg border border-brand-strong bg-brand-strong px-3.5 py-2 text-sm font-semibold text-white'
                  }
                >
                  Semua ({matched.length})
                </Link>
              </li>
              {availableCategories.map((category) => {
                const active = categoryFilter === category.key;
                return (
                  <li key={category.key}>
                    <Link
                      href={filterHref(category.key)}
                      aria-current={active ? 'page' : undefined}
                      className={
                        active
                          ? 'inline-flex rounded-lg border border-brand-strong bg-brand-strong px-3.5 py-2 text-sm font-semibold text-white'
                          : 'inline-flex rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-fg-body hover:border-brand hover:text-brand-strong'
                      }
                    >
                      {category.short} ({counts.get(category.key)})
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {results.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {results.map((game) => (
              <li key={game.id}>
                <GameCard game={game} cheapest={cheapest[game.id]} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="card-surface flex flex-col items-center gap-3 px-6 py-14 text-center">
            <SearchX className="h-8 w-8 text-fg-faint" aria-hidden />
            <p className="text-sm font-semibold text-fg">
              {query
                ? `Belum ada produk yang cocok dengan “${query}”`
                : 'Ketik sesuatu untuk mulai mencari'}
            </p>
            <p className="max-w-md text-sm text-fg-muted">
              Coba kata kunci yang lebih umum — nama operator, nama game, atau nama layanannya
              saja. Kalau memang belum ada, kabari kami: produknya sering bisa kami tambahkan.
            </p>
            {query && (
              <a
                href={waLink(whatsapp, `Halo admin Sayba, apakah ada produk "${query}"?`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-brand-strong px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Tanyakan ke admin
              </a>
            )}
          </div>
        )}

        <section className="mt-14 border-t border-line pt-8">
          <h2 className="text-sm font-semibold text-fg">Paling sering dicari</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="inline-flex rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-fg-body transition-colors hover:border-brand hover:text-brand-strong"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <h2 className="mt-8 text-sm font-semibold text-fg">Telusuri per kategori</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {sortedCategories()
              .filter((c) => c.showOnHome)
              .map((category) => (
                <li key={category.key}>
                  <Link
                    href={`/${category.slug}`}
                    className="inline-flex rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-fg-body transition-colors hover:border-brand hover:text-brand-strong"
                  >
                    {getCategory(category.key).label}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      </div>
    </>
  );
}
