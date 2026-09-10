import 'server-only';
import { supabaseAdmin } from './supabase';
import { DEFAULT_PRICING, type PricingConfig } from './pricing';
import { mapProviderCategory } from './categories';
import type {
  Faq,
  Game,
  GameKind,
  OrderSettings,
  PaymentMethod,
  Product,
  PublicProduct,
  StoreSettings,
  Testimonial,
} from '@/types';

/** Kolom produk yang boleh keluar ke browser — harga modal sengaja tidak ikut. */
const PUBLIC_PRODUCT_COLUMNS =
  'id, kode_produk, name, sell_price, base_price, is_promo, label, needs_server_id';

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const { data } = await supabaseAdmin().from('settings').select('value').eq('key', key).maybeSingle();
  return (data?.value as T) ?? fallback;
}

export async function getStoreSettings(): Promise<StoreSettings> {
  return getSetting<StoreSettings>('store', {
    name: 'Sayba Voucher',
    tagline: 'Voucher Digital & Top Up Game Resmi',
    url: 'https://topup.sayba.id',
    whatsapp: '6281234567890',
    email: 'sayba.help@gmail.com',
    city: 'Pontianak',
    province: 'Kalimantan Barat',
    address: 'Pontianak, Kalimantan Barat',
    open_hours: '08:00-23:00 WIB',
  });
}

export function getPricingConfig(): Promise<PricingConfig> {
  return getSetting<PricingConfig>('pricing', DEFAULT_PRICING);
}

export function getOrderSettings(): Promise<OrderSettings> {
  return getSetting<OrderSettings>('order', {
    expire_minutes: 60,
    auto_process: true,
    require_whatsapp: true,
    require_email: false,
  });
}

/** Semua game aktif untuk etalase & sitemap. */
export async function getActiveGames(): Promise<Game[]> {
  const { data } = await supabaseAdmin()
    .from('games')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  return (data as Game[]) ?? [];
}

export async function getFeaturedGames(limit = 8): Promise<Game[]> {
  const { data } = await supabaseAdmin()
    .from('games')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('sort_order', { ascending: true })
    .limit(limit);
  return (data as Game[]) ?? [];
}

/**
 * Etalase per bagian: 'voucher' (kode voucher digital) atau 'game' (top up
 * in-game). Kalau migrasi 04 belum dijalankan, kolom `kind` belum ada — dalam
 * hal itu semua entri dianggap 'game' agar halaman tetap tampil, bukan error.
 */
export async function getGamesByKind(kind: GameKind, limit = 60): Promise<Game[]> {
  const { data, error } = await supabaseAdmin()
    .from('games')
    .select('*')
    .eq('is_active', true)
    .eq('kind', kind)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
    .limit(limit);

  if (!error) return (data as Game[]) ?? [];
  return deriveGamesByKind(kind, limit);
}

/**
 * PostgREST memotong hasil di 1000 baris. Untuk pemindaian penuh, halaman
 * diambil berurutan sampai habis — memakai `.limit()` besar tidak menolong
 * karena batas itu ditegakkan server, dan hasil yang terpotong diam-diam
 * membuat kategori terbaca kosong.
 */
async function fetchAllProductCategories() {
  const PAGE = 1000;
  const out: { game_id: string | null; category: string | null }[] = [];

  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabaseAdmin()
      .from('products')
      .select('game_id, category')
      .eq('is_active', true)
      .range(offset, offset + PAGE - 1);

    if (error || !data) break;
    out.push(...data);
    if (data.length < PAGE) break;
  }
  return out;
}

type KindMap = { at: number; map: Map<string, GameKind> };
let kindMemo: KindMap | null = null;
const KIND_MEMO_MS = 60_000;

/**
 * Cadangan bila migrasi kategori belum dijalankan: kategori diturunkan dari
 * kolom `category` produknya, lalu diingat sebentar supaya satu kali render
 * halaman tidak memindai tabel produk berkali-kali.
 *
 * Setelah 05_migration_categories.sql dijalankan, jalur ini tidak terpakai
 * lagi karena kolom `kind` menjawab langsung.
 */
async function brandKindMap(): Promise<Map<string, GameKind>> {
  if (kindMemo && Date.now() - kindMemo.at < KIND_MEMO_MS) return kindMemo.map;

  const rows = await fetchAllProductCategories();

  // Sebuah brand bisa punya produk lintas kategori; yang menang adalah
  // kategori dengan produk terbanyak.
  const votes = new Map<string, Map<GameKind, number>>();
  for (const row of rows) {
    if (!row.game_id) continue;
    const category = mapProviderCategory(row.category ?? '');
    if (!category) continue;
    const perBrand = votes.get(row.game_id) ?? new Map<GameKind, number>();
    perBrand.set(category.key, (perBrand.get(category.key) ?? 0) + 1);
    votes.set(row.game_id, perBrand);
  }

  const map = new Map<string, GameKind>();
  for (const [gameId, perBrand] of votes) {
    let best: GameKind | null = null;
    let bestCount = -1;
    for (const [key, count] of perBrand) {
      if (count > bestCount) {
        best = key;
        bestCount = count;
      }
    }
    if (best) map.set(gameId, best);
  }

  kindMemo = { at: Date.now(), map };
  return map;
}

async function deriveGamesByKind(kind: GameKind, limit: number): Promise<Game[]> {
  const [map, games] = await Promise.all([brandKindMap(), getActiveGames()]);
  return games
    .filter((game) => map.get(game.id) === kind)
    .map((game) => ({ ...game, kind }))
    .slice(0, limit);
}

/** Game yang ditonjolkan di beranda, mengikuti urutan `site.homeGameSlugs`. */
export async function getGamesBySlugs(slugs: readonly string[]): Promise<Game[]> {
  if (slugs.length === 0) return [];
  const { data } = await supabaseAdmin()
    .from('games')
    .select('*')
    .eq('is_active', true)
    .in('slug', slugs as string[]);

  const rows = (data as Game[]) ?? [];
  // Pertahankan urutan yang ditulis di konfigurasi, bukan urutan dari database.
  return slugs
    .map((slug) => rows.find((row) => row.slug === slug))
    .filter((row): row is Game => Boolean(row));
}

/** Banner untuk carousel beranda. */
export async function getBanners(limit = 6) {
  const { data } = await supabaseAdmin()
    .from('banners')
    .select('id, title, subtitle, image_url, link_url')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(limit);
  return data ?? [];
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  const { data } = await supabaseAdmin()
    .from('games')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  return (data as Game) ?? null;
}

export async function getPublicProducts(gameId: string): Promise<PublicProduct[]> {
  const { data } = await supabaseAdmin()
    .from('products')
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq('game_id', gameId)
    .eq('is_active', true)
    .eq('provider_status', 'ACTIVE')
    .gt('sell_price', 0)
    .order('sell_price', { ascending: true });
  return (data as PublicProduct[]) ?? [];
}

/** Dipakai server saat membuat order — berisi harga modal, jangan diekspos. */
export async function getProductByCode(kodeProduk: string): Promise<Product | null> {
  const { data } = await supabaseAdmin()
    .from('products')
    .select('*')
    .eq('kode_produk', kodeProduk)
    .maybeSingle();
  return (data as Product) ?? null;
}

/**
 * Harga termurah per brand, untuk label "mulai dari" di kartu etalase.
 * Dipindai berhalaman karena PostgREST memotong hasil di 1000 baris — tanpa
 * itu, brand yang produknya di luar halaman pertama tampil tanpa harga.
 */
export async function getCheapestPriceByGame(): Promise<Record<string, number>> {
  const PAGE = 1000;
  const map: Record<string, number> = {};

  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabaseAdmin()
      .from('products')
      .select('game_id, sell_price')
      .eq('is_active', true)
      .eq('provider_status', 'ACTIVE')
      .gt('sell_price', 0)
      .range(offset, offset + PAGE - 1);

    if (error || !data) break;
    for (const row of data as { game_id: string | null; sell_price: number }[]) {
      if (!row.game_id) continue;
      if (map[row.game_id] === undefined || row.sell_price < map[row.game_id]) {
        map[row.game_id] = row.sell_price;
      }
    }
    if (data.length < PAGE) break;
  }
  return map;
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const { data } = await supabaseAdmin()
    .from('payment_methods')
    .select(
      'id, code, name, group_name, provider, icon_url, fee_flat, fee_percent, min_amount, max_amount, instructions, account_name, account_number, qris_image_url, sort_order',
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  return (data as PaymentMethod[]) ?? [];
}

export async function getPaymentMethodByCode(code: string) {
  const { data } = await supabaseAdmin()
    .from('payment_methods')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle();
  return data;
}

export async function getTestimonials(limit = 8): Promise<Testimonial[]> {
  const { data } = await supabaseAdmin()
    .from('testimonials')
    .select('id, name, city, game, rating, message')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(limit);
  return (data as Testimonial[]) ?? [];
}

export async function getFaqs(limit = 12): Promise<Faq[]> {
  const { data } = await supabaseAdmin()
    .from('faqs')
    .select('id, question, answer, category')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(limit);
  return (data as Faq[]) ?? [];
}

/** Ringkasan transaksi sukses untuk social proof di halaman depan. */
export async function getSuccessStats(): Promise<{ total: number; today: number }> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [{ count: total }, { count: today }] = await Promise.all([
    supabaseAdmin()
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('fulfillment_status', 'SUCCESS'),
    supabaseAdmin()
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('fulfillment_status', 'SUCCESS')
      .gte('created_at', startOfDay.toISOString()),
  ]);

  return { total: total ?? 0, today: today ?? 0 };
}

/** Transaksi sukses terbaru (ID disensor) untuk ticker "baru saja top up". */
export async function getRecentSuccessOrders(limit = 10) {
  const { data } = await supabaseAdmin()
    .from('orders')
    .select('order_code, game_name, product_name, target, completed_at')
    .eq('fulfillment_status', 'SUCCESS')
    .order('completed_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}
