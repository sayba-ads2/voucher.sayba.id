'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import { MessageCircle, Search, SearchX, X } from 'lucide-react';
import { GameCard } from './game-card';
import { getCategory, type CategoryKey } from '@/lib/categories';
import { searchBrands } from '@/lib/search';
import { cn } from '@/lib/utils';
import type { Game } from '@/types';

type SortKey = 'populer' | 'termurah' | 'nama';

/**
 * Etalase brand dengan pencarian instan, saringan kategori, dan pengurutan —
 * semuanya di sisi klien, tanpa memuat ulang halaman.
 *
 * Pencariannya memakai src/lib/search.ts, aturan yang sama dengan kotak cari
 * di header dan halaman /cari. Jadi "mlbb" menemukan Mobile Legends dan
 * "kuota" menemukan seluruh paket data, di mana pun kotaknya berada.
 */
export function GameBrowser({
  games,
  cheapest,
  initialQuery = '',
  showCategoryFilter = true,
  whatsapp,
}: {
  games: Game[];
  cheapest: Record<string, number>;
  initialQuery?: string;
  showCategoryFilter?: boolean;
  whatsapp?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<CategoryKey | 'semua'>('semua');
  const [sort, setSort] = useState<SortKey>('populer');
  const deferred = useDeferredValue(query);

  /** Kategori yang benar-benar ada isinya — chip kosong hanya bikin frustrasi. */
  const categories = useMemo(() => {
    const counts = new Map<CategoryKey, number>();
    for (const game of games) counts.set(game.kind, (counts.get(game.kind) ?? 0) + 1);
    return [...counts.entries()]
      .map(([key, count]) => ({ key, count, def: getCategory(key) }))
      .sort((a, b) => a.def.sort - b.def.sort);
  }, [games]);

  const results = useMemo(() => {
    const pool = category === 'semua' ? games : games.filter((g) => g.kind === category);
    const matched = searchBrands(pool, deferred);

    if (sort === 'populer' && deferred.trim()) return matched;

    const sorted = [...matched];
    if (sort === 'termurah') {
      sorted.sort((a, b) => (cheapest[a.id] ?? Infinity) - (cheapest[b.id] ?? Infinity));
    } else if (sort === 'nama') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'id'));
    } else {
      sorted.sort((a, b) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return a.name.localeCompare(b.name, 'id');
      });
    }
    return sorted;
  }, [games, deferred, category, sort, cheapest]);

  const chip =
    'inline-flex shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors';
  const chipOff = 'border-line bg-surface text-fg-body hover:border-brand hover:text-brand-strong';
  const chipOn = 'border-brand-strong bg-brand-strong text-white';

  return (
    <div>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-fg-faint"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari produk… misal: Telkomsel, token PLN, DANA, Netflix, MLBB"
          aria-label="Cari produk"
          className="w-full rounded-xl border border-line bg-surface py-3.5 pl-12 pr-10 text-sm text-fg placeholder:text-fg-faint focus:border-brand-strong focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Hapus pencarian"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-faint hover:text-fg"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {(showCategoryFilter && categories.length > 1) || games.length > 12 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {showCategoryFilter && categories.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setCategory('semua')}
                className={cn(chip, category === 'semua' ? chipOn : chipOff)}
              >
                Semua ({games.length})
              </button>
              {categories.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setCategory(item.key)}
                  className={cn(chip, category === item.key ? chipOn : chipOff)}
                >
                  {item.def.short} ({item.count})
                </button>
              ))}
            </>
          )}

          {games.length > 12 && (
            <label className="ml-auto flex items-center gap-2 text-xs text-fg-muted">
              <span className="sr-only sm:not-sr-only">Urutkan</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label="Urutkan hasil"
                className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-fg-body focus:border-brand-strong focus:outline-none"
              >
                <option value="populer">Paling populer</option>
                <option value="termurah">Harga termurah</option>
                <option value="nama">Nama A-Z</option>
              </select>
            </label>
          )}
        </div>
      ) : null}

      <p className="mt-4 text-xs text-fg-faint" aria-live="polite">
        Menampilkan {results.length} dari {games.length} produk
      </p>

      {results.length === 0 ? (
        <div className="card-surface mt-4 flex flex-col items-center gap-3 px-6 py-14 text-center">
          <SearchX className="h-8 w-8 text-fg-faint" aria-hidden />
          <p className="text-sm font-semibold text-fg">&ldquo;{query}&rdquo; belum tersedia</p>
          <p className="max-w-sm text-xs text-fg-faint">
            Coba kata kunci lain, atau cari di seluruh katalog kami — mungkin produknya ada di
            kategori yang berbeda.
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <Link
              href={`/cari?q=${encodeURIComponent(query.trim())}`}
              className="inline-flex rounded-lg bg-brand-strong px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-hover"
            >
              Cari di seluruh katalog
            </Link>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                  `Halo admin Sayba, apakah ada produk "${query.trim()}"?`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-xs font-bold text-fg-body hover:border-brand"
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                Tanya admin
              </a>
            )}
          </div>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {results.map((game) => (
            <li key={game.id}>
              <GameCard game={game} cheapest={cheapest[game.id]} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
