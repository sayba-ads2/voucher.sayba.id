import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { OrderRowActions } from '@/components/admin/order-row-actions';
import { StatusBadge } from '@/components/status-badge';
import { formatDateTime, formatRupiah } from '@/lib/utils';
import type { Order } from '@/types';

export const dynamic = 'force-dynamic';

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Menunggu Bayar' },
  { key: 'processing', label: 'Diproses' },
  { key: 'success', label: 'Berhasil' },
  { key: 'failed', label: 'Gagal' },
];

type Props = { searchParams: Promise<{ status?: string; q?: string }> };

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { status = 'all', q } = await searchParams;

  let query = supabaseAdmin().from('orders').select('*').order('created_at', { ascending: false }).limit(100);

  if (status === 'pending') query = query.eq('payment_status', 'PENDING');
  else if (status === 'processing') query = query.in('fulfillment_status', ['QUEUED', 'PROCESSING']);
  else if (status === 'success') query = query.eq('fulfillment_status', 'SUCCESS');
  else if (status === 'failed') query = query.in('fulfillment_status', ['FAILED', 'REFUNDED']);

  if (q?.trim()) {
    const term = q.trim();
    query = query.or(`order_code.ilike.%${term}%,target.ilike.%${term}%,contact_whatsapp.ilike.%${term}%`);
  }

  const { data } = await query;
  const orders = (data as Order[]) ?? [];

  return (
    <div className="space-y-4">
      <div className="card-surface flex flex-wrap items-center justify-between gap-3 p-3">
        <nav className="flex flex-wrap gap-1.5" aria-label="Filter status pesanan">
          {FILTERS.map((filter) => (
            <Link
              key={filter.key}
              href={`/admin/orders?status=${filter.key}`}
              className={
                status === filter.key
                  ? 'rounded-lg bg-brand-strong px-3 py-2 text-xs font-bold text-white'
                  : 'rounded-lg border border-line px-3 py-2 text-xs font-semibold text-fg-body hover:border-line-strong'
              }
            >
              {filter.label}
            </Link>
          ))}
        </nav>

        <form action="/admin/orders" className="flex gap-2">
          <input type="hidden" name="status" value={status} />
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Cari invoice / User ID / WA"
            aria-label="Cari pesanan"
            className="w-56 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg focus:border-brand-strong focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg border border-line px-3 py-2 text-xs font-bold text-fg-body hover:border-brand-strong"
          >
            Cari
          </button>
        </form>
      </div>

      <div className="card-surface overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-fg-faint">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Invoice</th>
              <th className="px-4 py-2.5 font-semibold">Produk</th>
              <th className="px-4 py-2.5 font-semibold">Tujuan</th>
              <th className="px-4 py-2.5 font-semibold">Bayar</th>
              <th className="px-4 py-2.5 font-semibold">Total / Laba</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((order) => (
              <tr key={order.id} className="align-top hover:bg-surface-2/60">
                <td className="px-4 py-3">
                  <Link
                    href={`/invoice/${order.order_code}`}
                    target="_blank"
                    className="font-mono text-xs text-brand-strong hover:underline"
                  >
                    {order.order_code}
                  </Link>
                  <span className="mt-1 block text-[11px] text-fg-faint">
                    {formatDateTime(order.created_at)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="block text-fg">{order.product_name}</span>
                  <span className="block text-[11px] text-fg-faint">{order.game_name}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="block font-mono text-xs text-fg-body">
                    {order.target}
                    {order.server_id ? ` (${order.server_id})` : ''}
                  </span>
                  {order.nickname && (
                    <span className="block text-[11px] text-success">{order.nickname}</span>
                  )}
                  {order.contact_whatsapp && (
                    <a
                      href={`https://wa.me/${order.contact_whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-[11px] text-fg-faint hover:text-brand-strong"
                    >
                      +{order.contact_whatsapp}
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-fg-muted">{order.payment_method}</td>
                <td className="px-4 py-3">
                  <span className="block font-semibold text-fg">
                    {formatRupiah(order.total_amount)}
                  </span>
                  <span className="block text-[11px] text-success">
                    +{formatRupiah(order.profit_amount)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1.5">
                    <StatusBadge status={order.payment_status} kind="payment" />
                    <StatusBadge status={order.fulfillment_status} />
                  </div>
                  {order.provider_message && (
                    <span className="mt-1 block max-w-40 text-[11px] text-danger">
                      {order.provider_message}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <OrderRowActions
                    orderId={order.id}
                    paymentStatus={order.payment_status}
                    fulfillmentStatus={order.fulfillment_status}
                  />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-fg-faint">
                  Tidak ada pesanan pada filter ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
