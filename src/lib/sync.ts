import 'server-only';
import { supabaseAdmin } from './supabase';
import { getProducts, type NexShopProduct } from './nexshop';
import { buildGameRow } from './game-presets';
import { mapProviderCategory, type CategoryKey } from './categories';
import { calculateSellPrice } from './pricing';
import { getPricingConfig } from './queries';

/**
 * Operator yang hanya penanda internal penyedia, bukan produk sungguhan.
 * Dicocokkan sebagai substring pada nama operator (huruf kecil).
 */
const EXCLUDED_OPERATORS = ['nonaktif', 'produk nonaktif'];

/**
 * Menentukan apakah sebuah produk katalog kita jual, sekaligus kategorinya.
 * Kategori yang tidak dikenal registri (src/lib/categories.ts) dilewati.
 */
function classify(p: NexShopProduct): CategoryKey | null {
  const category = mapProviderCategory(p.kategori ?? '');
  if (!category) return null;

  const operator = (p.operator ?? '').trim().toLowerCase();
  if (!operator) return null;
  if (EXCLUDED_OPERATORS.some((bad) => operator.includes(bad))) return null;

  return category.key;
}

export type SyncResult = {
  fetched: number;
  sellableProducts: number;
  gamesCreated: number;
  gamesTotal: number;
  operatorsMapped: number;
  productsUpserted: number;
  productsDeactivated: number;
  gamesRemoved: number;
  durationMs: number;
};

/**
 * Menarik katalog NexShop lalu menyimpannya ke Supabase.
 *
 * - Brand dikelompokkan berdasarkan SLUG, bukan nama operator. Beberapa operator
 *   yang merujuk brand sama (mis. "Mobile Legends" dan "Mobile Legend Kios
 *   Pintar") jatuh ke satu kartu etalase.
 * - Kategori diambil dari registri src/lib/categories.ts: pulsa, paket data,
 *   token listrik, e-wallet, game, voucher, tagihan, hiburan, dan e-toll.
 * - Brand baru dibuat NONAKTIF supaya kamu yang memilih mana yang dijual.
 * - Penyuntingan manual kamu (nama, slug, label input, status aktif, margin)
 *   tidak pernah ditimpa sinkronisasi berikutnya.
 * - Harga jual dihitung ulang dari `harga_reseller` terbaru, bukan disalin.
 * - Produk yang hilang dari katalog ditandai nonaktif, bukan dihapus, agar
 *   riwayat pesanan lama tetap utuh.
 */
export async function syncCatalog(): Promise<SyncResult> {
  const startedAt = Date.now();
  const db = supabaseAdmin();
  const pricing = await getPricingConfig();

  const all = await getProducts();
  const sellable = all
    .map((p) => ({ product: p, kind: classify(p) }))
    .filter((entry): entry is { product: NexShopProduct; kind: CategoryKey } => entry.kind !== null);

  // --- 1. Kelompokkan operator katalog menjadi kandidat brand ---------------
  type Candidate = ReturnType<typeof buildGameRow> & {
    operators: string[];
    kind: CategoryKey;
    kindVotes: Map<CategoryKey, number>;
  };
  const bySlug = new Map<string, Candidate>();

  for (const { product: p, kind } of sellable) {
    const operator = p.operator.trim();
    const row = buildGameRow(operator, Boolean(p.butuh_server_id), kind);
    const existing = bySlug.get(row.slug);

    if (existing) {
      if (!existing.operators.includes(operator)) existing.operators.push(operator);
      // Kalau salah satu operator butuh Server ID, brand-nya butuh Server ID.
      existing.needs_server_id = existing.needs_server_id || row.needs_server_id;
      existing.kindVotes.set(kind, (existing.kindVotes.get(kind) ?? 0) + 1);
    } else {
      bySlug.set(row.slug, {
        ...row,
        operators: [operator],
        kind,
        kindVotes: new Map([[kind, 1]]),
      });
    }
  }

  // Sebuah brand bisa punya produk lintas kategori (mis. Telkomsel menjual
  // pulsa sekaligus paket data). Kategori yang menang adalah yang produknya
  // paling banyak, bukan yang kebetulan terbaca pertama.
  for (const candidate of bySlug.values()) {
    let best: CategoryKey = candidate.kind;
    let bestCount = -1;
    for (const [kind, count] of candidate.kindVotes) {
      if (count > bestCount) {
        best = kind;
        bestCount = count;
      }
    }
    candidate.kind = best;
  }

  // --- 2. Sisipkan game baru, perbarui pemetaan operator game lama ----------
  // Kolom provider_operators berasal dari migrasi 03. Kalau migrasi itu belum
  // dijalankan, sinkronisasi tetap bekerja — daftar operator hanya tidak ikut
  // disimpan (pemetaannya sendiri dihitung ulang tiap kali sinkron).
  const [operatorProbe, kindProbe] = await Promise.all([
    db.from('games').select('provider_operators').limit(1),
    db.from('games').select('kind').limit(1),
  ]);
  const hasOperatorList = !operatorProbe.error;
  const hasKind = !kindProbe.error;

  const { data: existingGames } = await db.from('games').select('id, slug');
  const gameIdBySlug = new Map((existingGames ?? []).map((g) => [g.slug, g.id as string]));

  let gamesCreated = 0;
  for (const [slug, candidate] of bySlug) {
    const { operators, kind, kindVotes: _votes, ...row } = candidate;
    const known = gameIdBySlug.get(slug);
    const operatorFields: Record<string, unknown> = { provider_operator: operators[0] };
    if (hasOperatorList) operatorFields.provider_operators = operators;

    if (known) {
      // Game sudah ada: hanya segarkan pemetaan operator. Kolom lain — termasuk
      // `kind` yang mungkin kamu ubah manual — tidak pernah ditimpa.
      await db.from('games').update(operatorFields).eq('id', known);
      continue;
    }

    const { data: inserted } = await db
      .from('games')
      .insert({ ...row, ...operatorFields, ...(hasKind ? { kind } : {}), is_active: false })
      .select('id, slug')
      .maybeSingle();

    if (inserted) {
      gameIdBySlug.set(inserted.slug as string, inserted.id as string);
      gamesCreated++;
    }
  }

  // Peta operator -> game_id, dipakai saat menyimpan produk.
  const gameIdByOperator = new Map<string, string>();
  for (const [slug, candidate] of bySlug) {
    const id = gameIdBySlug.get(slug);
    if (!id) continue;
    for (const operator of candidate.operators) gameIdByOperator.set(operator, id);
  }

  // --- 3. Upsert produk -----------------------------------------------------
  const now = new Date().toISOString();

  // Margin per-produk dan status tampil yang sudah kamu atur harus bertahan.
  const { data: existingProducts } = await db
    .from('products')
    .select('kode_produk, margin_type, margin_value, is_active, sort_order, label, is_promo');
  const existingByCode = new Map((existingProducts ?? []).map((p) => [p.kode_produk, p]));

  const rows = sellable.map(({ product: p }) => {
    const prev = existingByCode.get(p.kode_produk);
    const sellPrice = calculateSellPrice(p.harga_reseller, pricing, {
      margin_type: prev?.margin_type ?? null,
      margin_value: prev?.margin_value ?? null,
    });

    return {
      game_id: gameIdByOperator.get(p.operator.trim()) ?? null,
      kode_produk: p.kode_produk,
      name: p.nama,
      category: p.kategori,
      operator: p.operator,
      base_price: Math.round(p.harga_normal),
      cost_price: Math.round(p.harga_reseller),
      margin_type: prev?.margin_type ?? null,
      margin_value: prev?.margin_value ?? null,
      sell_price: sellPrice,
      needs_server_id: Boolean(p.butuh_server_id),
      provider_status: p.status ?? 'ACTIVE',
      is_active: prev?.is_active ?? true,
      is_promo: prev?.is_promo ?? false,
      label: prev?.label ?? null,
      sort_order: prev?.sort_order ?? 100,
      last_synced_at: now,
    };
  });

  let productsUpserted = 0;
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await db.from('products').upsert(chunk, { onConflict: 'kode_produk' });
    if (error) throw new Error(`Gagal menyimpan produk: ${error.message}`);
    productsUpserted += chunk.length;
  }

  // --- 4. Nonaktifkan produk yang sudah tidak ada di katalog ----------------
  const activeCodes = new Set(rows.map((r) => r.kode_produk));
  const stale = (existingProducts ?? [])
    .filter((p) => !activeCodes.has(p.kode_produk))
    .map((p) => p.kode_produk);

  let productsDeactivated = 0;
  if (stale.length > 0) {
    for (let i = 0; i < stale.length; i += CHUNK) {
      const chunk = stale.slice(i, i + CHUNK);
      await db.from('products').update({ provider_status: 'INACTIVE' }).in('kode_produk', chunk);
      productsDeactivated += chunk.length;
    }
  }

  // --- 5. Bersihkan brand yatim -------------------------------------------
  // Penamaan brand bisa berubah (mis. "DATA TELKOMSEL" kini jatuh ke slug
  // paket-data-telkomsel), menyisakan baris lama tanpa produk.
  //
  // Dua pengaman: hanya baris NONAKTIF yang tidak dirujuk katalog saat ini,
  // DAN keberadaan produknya diperiksa langsung per-baris. Pemeriksaan itu
  // sengaja tidak memakai satu query besar berisi seluruh product.game_id —
  // PostgREST memotong hasil di 1000 baris, dan pemotongan itu akan membuat
  // brand yang sebenarnya terpakai ikut terhapus.
  const referenced = new Set(gameIdBySlug.values());
  const { data: inactiveGames } = await db
    .from('games')
    .select('id')
    .eq('is_active', false);

  const suspects = (inactiveGames ?? [])
    .map((g) => g.id as string)
    .filter((id) => !referenced.has(id));

  let gamesRemoved = 0;
  for (const id of suspects) {
    const { count } = await db
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('game_id', id);
    if ((count ?? 0) > 0) continue;

    await db.from('games').delete().eq('id', id);
    gamesRemoved++;
  }

  await db.from('settings').upsert({
    key: 'last_sync',
    value: {
      at: now,
      fetched: all.length,
      sellable_products: sellable.length,
      games: bySlug.size,
      games_created: gamesCreated,
    },
    updated_at: now,
  });

  return {
    fetched: all.length,
    sellableProducts: sellable.length,
    gamesCreated,
    gamesTotal: bySlug.size,
    operatorsMapped: gameIdByOperator.size,
    productsUpserted,
    productsDeactivated,
    gamesRemoved,
    durationMs: Date.now() - startedAt,
  };
}

/** Hitung ulang harga jual semua produk setelah margin global diubah. */
export async function recalculatePrices(): Promise<number> {
  const db = supabaseAdmin();
  const pricing = await getPricingConfig();

  const { data } = await db.from('products').select('id, cost_price, margin_type, margin_value');
  const rows = data ?? [];

  let updated = 0;
  for (const row of rows) {
    const sell = calculateSellPrice(row.cost_price, pricing, {
      margin_type: row.margin_type,
      margin_value: row.margin_value,
    });
    await db.from('products').update({ sell_price: sell }).eq('id', row.id);
    updated++;
  }
  return updated;
}
