import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { SyncPanel } from '@/components/admin/sync-panel';
import { StatusBadge } from '@/components/status-badge';
import { formatDateTime, formatRupiah } from '@/lib/utils';
import type { Order } from '@/types';

export const dynamic = 'force-dynamic';

async function loadStats() {
  const db = supabaseAdmin();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todayOrders, pending, recent, games, products] = await Promise.all([
    db
      .from('orders')
      .select('total_amount, profit_amount, fulfillment_status')
      .gte('created_at', startOfDay.toISOString()),
    db
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('payment_status', 'PENDING'),
    db
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10),
    db.from('games').select('id', { count: 'exact', head: true }).eq('is_active', true),
    db.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  const rows = todayOrders.data ?? [];
  const paidRows = rows.filter((r) => r.fulfillment_status === 'SUCCESS');

  return {
    ordersToday: rows.length,
    successToday: paidRows.length,
    revenueToday: paidRows.reduce((sum, r) => sum + Number(r.total_amount ?? 0), 0),
    profitToday: paidRows.reduce((sum, r) => sum + Number(r.profit_amount ?? 0), 0),
    pendingCount: pending.count ?? 0,
    activeGames: games.count ?? 0,
    activeProducts: products.count ?? 0,
    recent: (recent.data as Order[]) ?? [],
  };
}

export default async function AdminDashboardPage() {
  const stats = await loadStats();

  const cards = [
    { label: 'Pesanan Hari Ini', value: String(stats.ordersToday) },
    { label: 'Berhasil Hari Ini', value: String(stats.successToday) },
    { label: 'Omzet Hari Ini', value: formatRupiah(stats.revenueToday) },
    { label: 'Laba Kotor Hari Ini', value: formatRupiah(stats.profitToday) },
    { label: 'Menunggu Bayar', value: String(stats.pendingCount) },
    { label: 'Game Aktif', value: String(stats.activeGames) },
    { label: 'Produk Aktif', value: String(stats.activeProducts) },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card-surface p-4">
            <span className="text-xs text-fg-faint">{card.label}</span>
            <p className="mt-1.5 text-xl font-extrabold text-fg">{card.value}</p>
          </div>
        ))}
      </div>

      <SyncPanel />

      <section className="card-surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-bold text-fg">Pesanan Terbaru</h2>
          <Link href="/admin/orders" className="text-xs font-semibold text-brand-strong hover:underline">
            Lihat semua
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-fg-faint">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Invoice</th>
                <th className="px-4 py-2.5 font-semibold">Produk</th>
                <th className="px-4 py-2.5 font-semibold">Tujuan</th>
                <th className="px-4 py-2.5 font-semibold">Total</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {stats.recent.map((order) => (
                <tr key={order.id} className="hover:bg-surface-2/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/invoice/${order.order_code}`}
                      className="font-mono text-xs text-brand-strong hover:underline"
                    >
                      {order.order_code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-fg-body">{order.product_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-fg-muted">{order.target}</td>
                  <td className="px-4 py-3 font-semibold text-fg">
                    {formatRupiah(order.total_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.fulfillment_status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-fg-faint">
                    {formatDateTime(order.created_at)}
                  </td>
                </tr>
              ))}
              {stats.recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-fg-faint">
                    Belum ada pesanan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
