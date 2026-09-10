import type { Metadata } from 'next';
import Link from 'next/link';
import { GameBrowser } from '@/components/game-browser';
import { JsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
import { getCategory, homeCategories, type CategoryKey } from '@/lib/categories';
import { getCheapestPriceByGame, getGamesByKind } from '@/lib/queries';
import { site } from '@/lib/site';

/**
 * Halaman daftar untuk satu kategori.
 *
 * Semua rute kategori (/pulsa, /paket-data, /token-listrik, dan seterusnya)
 * memakai komponen ini, sehingga tampilan dan structured data-nya konsisten
 * dan menambah kategori baru cukup menambah satu berkas rute tipis.
 */

export function categoryMetadata(key: CategoryKey): Metadata {
  const category = getCategory(key);
  return {
    title: `${category.label} — Harga Termurah, Proses Otomatis`,
    description: `${category.description} Bayar pakai QRIS, e-wallet, atau transfer bank. Berlaku untuk seluruh Indonesia.`,
    alternates: { canonical: `/${category.slug}` },
    openGraph: {
      type: 'website',
      url: `${site.url}/${category.slug}`,
      title: `${category.label} | ${site.name}`,
      description: category.description,
    },
  };
}

export async function CategoryListing({ categoryKey }: { categoryKey: CategoryKey }) {
  const category = getCategory(categoryKey);
  const [brands, cheapest] = await Promise.all([
    getGamesByKind(categoryKey),
    getCheapestPriceByGame(),
  ]);

  const others = homeCategories().filter((c) => c.key !== categoryKey);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Beranda', path: '/' },
            { name: category.label, path: `/${category.slug}` },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: category.label,
            numberOfItems: brands.length,
            itemListElement: brands.map((brand, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: brand.name,
              url: `${site.url}/${brand.slug}`,
            })),
          },
        ]}
      />

      <div className="mx-auto max-w-6xl px-4 py-10">
        <nav aria-label="Breadcrumb" className="mb-5 text-xs text-fg-faint">
          <Link href="/" className="hover:text-brand-strong">
            Beranda
          </Link>
          <span className="mx-1.5">/</span>
          <span className="font-medium text-fg-body">{category.label}</span>
        </nav>

        <h1 className="text-2xl font-bold tracking-tight text-fg">{category.label}</h1>
        <p className="mb-7 mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">
          {category.description}
        </p>

        {brands.length > 0 ? (
          <GameBrowser games={brands} cheapest={cheapest} />
        ) : (
          <div className="card-surface px-6 py-12 text-center">
            <p className="text-sm font-semibold text-fg">Kategori ini belum diaktifkan</p>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-fg-muted">
              Produknya sudah ada di database, tinggal diaktifkan dari dashboard admin.
              Sementara itu, coba kategori lain di bawah.
            </p>
          </div>
        )}

        <section className="mt-14 border-t border-line pt-8">
          <h2 className="text-sm font-semibold text-fg">Kategori lainnya</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.map((other) => (
              <li key={other.key}>
                <Link
                  href={`/${other.slug}`}
                  className="inline-flex rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-fg-body transition-colors hover:border-brand hover:text-brand-strong"
                >
                  {other.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
