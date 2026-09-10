'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { StatusBadge } from './status-badge';
import { cn } from '@/lib/utils';
import type { PublicOrder } from '@/types';

const FINAL: string[] = ['SUCCESS', 'FAILED', 'REFUNDED'];

/**
 * Memantau status pesanan secara berkala.
 *
 * Polling berhenti sendiri begitu status final tercapai, sehingga halaman
 * invoice yang dibiarkan terbuka tidak terus-menerus memanggil server.
 */
export function OrderStatusLive({ initial }: { initial: PublicOrder }) {
  const [order, setOrder] = useState(initial);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/orders/${order.order_code}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) setOrder(json.data as PublicOrder);
    } catch {
      // Diamkan — pemanggilan berikutnya akan mencoba lagi.
    } finally {
      setRefreshing(false);
    }
  }, [order.order_code]);

  useEffect(() => {
    if (FINAL.includes(order.fulfillment_status)) return;
    const interval = setInterval(refresh, 8000);
    return () => clearInterval(interval);
  }, [order.fulfillment_status, refresh]);

  const isSuccess = order.fulfillment_status === 'SUCCESS';
  const isFailed = order.fulfillment_status === 'FAILED';
  const isPending = !FINAL.includes(order.fulfillment_status);

  return (
    <section
      className={cn(
        'card-surface p-5',
        isSuccess && 'border-success/40',
        isFailed && 'border-red-500/40',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {isSuccess ? (
            <CheckCircle2 className="h-6 w-6 shrink-0 text-success" aria-hidden />
          ) : isFailed ? (
            <XCircle className="h-6 w-6 shrink-0 text-danger" aria-hidden />
          ) : (
            <Loader2 className="h-6 w-6 shrink-0 animate-spin text-brand" aria-hidden />
          )}
          <div>
            <h2 className="text-sm font-bold text-fg">
              {isSuccess
                ? 'Pesanan Berhasil'
                : isFailed
                  ? 'Pesanan Gagal'
                  : order.payment_status === 'PAID'
                    ? 'Sedang Diproses'
                    : 'Menunggu Pembayaran'}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-fg-muted">
              {isSuccess
                ? 'Item sudah dikirim ke akun game kamu. Cek notifikasi di dalam game.'
                : isFailed
                  ? 'Pesanan tidak dapat diproses penyedia. Dana akan dikembalikan penuh — hubungi admin bila belum diterima.'
                  : order.payment_status === 'PAID'
                    ? 'Pembayaran diterima. Pesanan sedang diteruskan ke penyedia, biasanya selesai dalam hitungan detik.'
                    : 'Selesaikan pembayaran sesuai instruksi di bawah. Status akan berubah otomatis.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          aria-label="Perbarui status"
          className="shrink-0 rounded-lg border border-line p-2 text-fg-muted transition-colors hover:border-brand-strong hover:text-brand-strong disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} aria-hidden />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
        <StatusBadge status={order.payment_status} kind="payment" />
        <StatusBadge status={order.fulfillment_status} />
        {isPending && (
          <span className="text-[11px] text-fg-faint">Status diperbarui otomatis tiap 8 detik</span>
        )}
      </div>

      {order.serial_number && (
        <div className="mt-4 rounded-lg border border-line bg-surface-2 p-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-faint">
            Serial Number
          </span>
          <p className="mt-1 break-all font-mono text-sm text-success">{order.serial_number}</p>
        </div>
      )}
    </section>
  );
}
