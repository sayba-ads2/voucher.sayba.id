import { supabaseAdmin } from '@/lib/supabase';
import { ProductsTable } from '@/components/admin/products-table';
import { getPricingConfig } from '@/lib/queries';
import type { Game, Product } from '@/types';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ game?: string }> };

export default async function AdminProductsPage({ searchParams }: Props) {
  const { game: gameId } = await searchParams;
  const db = supabaseAdmin();

  const { data: gameRows } = await db
    .from('games')
    .select('*')
    .order('is_active', { ascending: false })
    .order('name', { ascending: true });
  const games = (gameRows as Game[]) ?? [];

  const selectedId = gameId ?? games.find((g) => g.is_active)?.id ?? games[0]?.id ?? null;

  let products: Product[] = [];
  if (selectedId) {
    const { data } = await db
      .from('products')
      .select('*')
      .eq('game_id', selectedId)
      .order('cost_price', { ascending: true });
    products = (data as Product[]) ?? [];
  }

  const pricing = await getPricingConfig();

  return (
    <div className="space-y-4">
      <div className="card-surface p-4">
        <h1 className="text-base font-bold text-fg">Produk &amp; Margin</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
          Margin global saat ini:{' '}
          <strong className="text-brand-strong">
            {pricing.margin_type === 'percent' ? `${pricing.margin_value}%` : `Rp${pricing.margin_value}`}
          </strong>{' '}
          (minimum Rp{pricing.min_margin.toLocaleString('id-ID')}, dibulatkan ke atas kelipatan Rp
          {pricing.rounding}). Isi margin per produk hanya bila produk itu ingin kamu beri
          perlakuan khusus — kosongkan untuk mengikuti margin global.
        </p>
      </div>

      <ProductsTable games={games} products={products} selectedGameId={selectedId} />
    </div>
  );
}
