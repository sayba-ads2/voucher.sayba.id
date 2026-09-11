import { getCategory, type CategoryKey } from './categories';
import { GAME_PRESETS } from './game-presets';
import type { Game } from '@/types';

/**
 * Pencarian produk di sisi kita sendiri.
 *
 * Dipakai dua tempat dengan aturan yang sama persis: kotak cari instan di
 * header (klien) dan halaman /cari yang dirender server. Menyatukannya
 * penting — kalau keduanya memakai logika berbeda, pembeli melihat saran yang
 * berbeda dengan hasil yang ia dapat setelah menekan Enter.
 *
 * Yang ikut dicocokkan, bukan cuma nama brand:
 *   - alias populer ("mlbb" -> Mobile Legends, "ff" -> Free Fire)
 *   - nama publisher ("moonton", "garena")
 *   - kata kunci kategori ("kuota" -> semua brand paket data, "nonton" ->
 *     Netflix dan kawan-kawan)
 *
 * Tanpa itu, pencarian "mlbb" atau "kuota" mengembalikan nol hasil padahal
 * produknya jelas ada — kasus yang paling sering membuat pembeli menyerah.
 */

export function normalizeQuery(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** slug preset -> daftar alias, untuk mencocokkan singkatan yang umum dipakai. */
const ALIASES_BY_SLUG = new Map<string, string[]>(
  GAME_PRESETS.map((preset) => [
    preset.slug,
    [...preset.aliases, preset.name].map(normalizeQuery).filter(Boolean),
  ]),
);

function categoryKeywords(kind: CategoryKey): string[] {
  const category = getCategory(kind);
  return [category.label, category.short, ...category.keywords].map(normalizeQuery);
}

const KEYWORDS_BY_KIND = new Map<CategoryKey, string[]>();
function keywordsFor(kind: CategoryKey): string[] {
  let cached = KEYWORDS_BY_KIND.get(kind);
  if (!cached) {
    cached = categoryKeywords(kind);
    KEYWORDS_BY_KIND.set(kind, cached);
  }
  return cached;
}

/** Kata sambung yang tidak menambah makna pencarian. */
const STOP_WORDS = new Set(['top', 'up', 'topup', 'beli', 'isi', 'murah', 'harga', 'di', 'ke']);

/**
 * Nilai kecocokan satu brand terhadap kueri. 0 berarti tidak cocok.
 * Angkanya hanya bermakna relatif — dipakai untuk mengurutkan, bukan ditampilkan.
 */
export function scoreBrand(game: Game, query: string): number {
  const q = normalizeQuery(query);
  if (!q) return 0;

  const name = normalizeQuery(game.name);
  const slug = normalizeQuery(game.slug);
  const publisher = normalizeQuery(game.publisher ?? '');

  // Kecocokan nama — paling kuat, diurutkan dari yang paling meyakinkan.
  if (name === q || slug === q) return 1000;
  if (name.startsWith(q) || slug.startsWith(q)) return 800;
  if (name.includes(` ${q}`)) return 650;
  if (name.includes(q) || slug.includes(q)) return 500;

  // Alias populer: "mlbb", "ff", "codm".
  const aliases = ALIASES_BY_SLUG.get(game.slug) ?? [];
  for (const alias of aliases) {
    if (alias === q) return 900;
    if (alias.startsWith(q) && q.length >= 2) return 600;
    if (q.length >= 3 && alias.includes(q)) return 420;
  }

  if (publisher && (publisher === q || publisher.startsWith(q))) return 380;
  if (publisher && q.length >= 3 && publisher.includes(q)) return 300;

  // Kata kunci kategori: "kuota", "nonton", "token", "streaming".
  for (const keyword of keywordsFor(game.kind)) {
    if (!keyword) continue;
    if (keyword === q) return 260;
    if (q.length >= 3 && (keyword.startsWith(q) || keyword.includes(q))) return 200;
  }

  // Kueri banyak kata: "top up mobile legends", "beli kuota xl".
  const words = q.split(' ').filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
  if (words.length > 1) {
    const haystack = [name, slug, publisher, ...aliases, ...keywordsFor(game.kind)].join(' ');
    const hits = words.filter((word) => haystack.includes(word)).length;
    if (hits === words.length) return 320;
    if (hits > 0) return 60 * hits;
  }

  return 0;
}

export type SearchHit = { game: Game; score: number };

/** Mengurutkan brand berdasarkan kecocokan; brand populer menang saat seri. */
export function searchBrands(games: Game[], query: string, limit?: number): Game[] {
  const q = normalizeQuery(query);
  if (!q) return limit ? games.slice(0, limit) : games;

  const hits: SearchHit[] = [];
  for (const game of games) {
    const score = scoreBrand(game, q);
    if (score > 0) hits.push({ game, score });
  }

  hits.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.game.is_featured !== b.game.is_featured) return a.game.is_featured ? -1 : 1;
    if (a.game.sort_order !== b.game.sort_order) return a.game.sort_order - b.game.sort_order;
    return a.game.name.localeCompare(b.game.name, 'id');
  });

  const result = hits.map((hit) => hit.game);
  return limit ? result.slice(0, limit) : result;
}

/** Saran pencarian populer, ditampilkan saat kotak cari masih kosong. */
export const POPULAR_SEARCHES: { label: string; href: string }[] = [
  { label: 'Mobile Legends', href: '/mobile-legends' },
  { label: 'Free Fire', href: '/free-fire' },
  { label: 'Netflix', href: '/cari?q=netflix' },
  { label: 'Kuota Telkomsel', href: '/cari?q=kuota%20telkomsel' },
  { label: 'Token Listrik', href: '/token-listrik' },
  { label: 'Kartu Perdana', href: '/kartu-perdana' },
  { label: 'Saldo DANA', href: '/cari?q=dana' },
  { label: 'Steam Wallet', href: '/cari?q=steam' },
];
