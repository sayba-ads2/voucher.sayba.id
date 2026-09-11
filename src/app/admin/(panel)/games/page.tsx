import { supabaseAdmin } from '@/lib/supabase';
import { GamesTable } from '@/components/admin/games-table';
import type { Game } from '@/types';

export const dynamic = 'force-dynamic';

export default async function AdminGamesPage() {
  const { data } = await supabaseAdmin()
    .from('games')
    .select('*')
    .order('is_active', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  const games = (data as Game[]) ?? [];
  const activeGames = games.filter((game) => game.is_active).length;
  const { count } = await supabaseAdmin()
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  return (
    <div className="space-y-4">
      <div className="card-surface p-4">
        <h1 className="text-base font-bold text-fg">Kelola Brand &amp; Game</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
          Brand baru dari kategori yang dikenal — pulsa, paket data, kartu perdana, token listrik,
          e-wallet, game, voucher, hiburan, tagihan, e-toll — kini <strong>langsung aktif</strong>{' '}
          setelah sinkronisasi, sehingga etalase terisi sendiri. Hanya kategori &ldquo;Lainnya&rdquo;
          yang dibuat nonaktif untuk kamu periksa dulu. Saring per kategori di bawah, lalu pakai
          tombol massal untuk menyalakan atau mematikan sekaligus — total {games.length} brand
          terdeteksi, {activeGames} di antaranya aktif, dengan {count ?? 0} produk aktif.
        </p>
      </div>

      <GamesTable games={games} />
    </div>
  );
}
