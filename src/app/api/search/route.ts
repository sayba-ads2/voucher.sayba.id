import { NextResponse } from 'next/server';
import { getActiveGames, getCheapestPriceByGame } from '@/lib/queries';
import { searchBrands } from '@/lib/search';
import { getCategory } from '@/lib/categories';
import type { Game } from '@/types';

/**
 * Saran pencarian instan untuk kotak cari di header.
 *
 * Katalognya diingat sebentar di memori proses. Tanpa itu, setiap ketikan
 * huruf memicu pemindaian penuh tabel games + products — mahal, dan hasilnya
 * toh hampir tidak pernah berubah dalam hitungan menit.
 *
 * Yang dikirim ke browser sengaja seminimal mungkin: nama, alamat halaman,
 * kategori, dan harga termurah. Tidak ada harga modal atau kolom internal.
 */

const CACHE_MS = 5 * 60 * 1000;
let cache: { at: number; games: Game[]; cheapest: Record<string, number> } | null = null;

async function getCatalog() {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache;
  const [games, cheapest] = await Promise.all([getActiveGames(), getCheapestPriceByGame()]);
  cache = { at: Date.now(), games, cheapest };
  return cache;
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q') ?? '';
  if (query.trim().length < 1) {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    const { games, cheapest } = await getCatalog();
    const results = searchBrands(games, query, 8).map((game) => ({
      slug: game.slug,
      name: game.name,
      kind: game.kind,
      kindLabel: getCategory(game.kind).short,
      icon_url: game.icon_url,
      cheapest: cheapest[game.id] ?? null,
    }));

    return NextResponse.json(
      { success: true, data: results },
      { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
    );
  } catch {
    // Pencarian yang mati sebaiknya diam, bukan menampilkan pesan error di
    // bawah kotak cari — pembeli tetap bisa menekan Enter ke halaman /cari.
    return NextResponse.json({ success: true, data: [] });
  }
}
