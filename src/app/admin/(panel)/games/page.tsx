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
  const { count } = await supabaseAdmin()
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  return (
    <div className="space-y-4">
      <div className="card-surface p-4">
        <h1 className="text-base font-bold text-fg">Kelola Game</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
          Game baru hasil sinkronisasi selalu dibuat <strong>nonaktif</strong>. Kamu yang memutuskan
          mana yang tampil di etalase. Aktifkan hanya game yang produknya benar-benar ingin kamu
          jual — total {games.length} game terdeteksi, {count ?? 0} produk aktif.
        </p>
      </div>

      <GamesTable games={games} />
    </div>
  );
}
