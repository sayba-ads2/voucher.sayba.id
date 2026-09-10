'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Search, SearchX } from 'lucide-react';
import { GameCard } from './game-card';
import type { Game } from '@/types';

/** Etalase game dengan pencarian instan di sisi klien. */
export function GameBrowser({
  games,
  cheapest,
  initialQuery = '',
}: {
  games: Game[];
  cheapest: Record<string, number>;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const deferred = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferred.trim().toLowerCase();
    if (!q) return games;
    return games.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.slug.includes(q) ||
        (g.publisher ?? '').toLowerCase().includes(q),
    );
  }, [games, deferred]);

  return (
    <div>
      <div className="relative mb-6">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-fg-faint"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari produk… misal: Telkomsel, Token PLN, DANA, Mobile Legends"
          aria-label="Cari produk"
          className="w-full rounded-xl border border-line bg-surface py-3.5 pl-12 pr-4 text-sm text-fg placeholder:text-fg-faint focus:border-brand-strong focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-3 px-6 py-14 text-center">
          <SearchX className="h-8 w-8 text-fg-faint" aria-hidden />
          <p className="text-sm font-semibold text-fg">
            &ldquo;{query}&rdquo; belum tersedia
          </p>
          <p className="max-w-sm text-xs text-fg-faint">
            Coba kata kunci lain, atau hubungi admin lewat WhatsApp — kami bisa
            menambahkannya kalau produknya tersedia di jaringan distributor kami.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((game) => (
            <GameCard key={game.id} game={game} cheapest={cheapest[game.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
