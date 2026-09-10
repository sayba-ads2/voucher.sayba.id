'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { FulfillmentStatus, PaymentStatus } from '@/types';

type Action = 'confirm' | 'retry' | 'sync' | 'cancel' | 'refund';

/**
 * Tombol tindakan per pesanan.
 *
 * "Tandai Lunas" adalah jalur untuk pembayaran manual: setelah dana benar-benar
 * masuk ke rekening/e-wallet kamu, tombol ini menandai pesanan lunas sekaligus
 * meneruskannya ke NexShop. Konfirmasi ganda mencegah salah klik.
 */
export function OrderRowActions({
  orderId,
  paymentStatus,
  fulfillmentStatus,
}: {
  orderId: string;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: Action, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!json.success) setError(json.error ?? 'Gagal.');
      else router.refresh();
    } catch {
      setError('Gagal menghubungi server.');
    } finally {
      setBusy(null);
    }
  }

  const isFinal = ['SUCCESS', 'REFUNDED'].includes(fulfillmentStatus);
  const button =
    'rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-fg-body transition-colors hover:border-brand-strong hover:text-brand-strong disabled:opacity-50';

  return (
    <div className="flex flex-col items-start gap-1.5">
      {paymentStatus === 'PENDING' && (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() =>
            run('confirm', 'Pastikan dana sudah benar-benar masuk. Tandai pesanan ini lunas dan proses sekarang?')
          }
          className="rounded-lg bg-success px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-success/90 disabled:opacity-50"
        >
          {busy === 'confirm' ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : 'Tandai Lunas'}
        </button>
      )}

      {paymentStatus === 'PAID' && fulfillmentStatus === 'FAILED' && (
        <button type="button" disabled={busy !== null} onClick={() => run('retry')} className={button}>
          {busy === 'retry' ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : 'Ulangi Kirim'}
        </button>
      )}

      {['PROCESSING', 'QUEUED'].includes(fulfillmentStatus) && (
        <button type="button" disabled={busy !== null} onClick={() => run('sync')} className={button}>
          {busy === 'sync' ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : 'Cek Status'}
        </button>
      )}

      {paymentStatus === 'PENDING' && (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run('cancel', 'Batalkan pesanan ini?')}
          className={button}
        >
          Batalkan
        </button>
      )}

      {paymentStatus === 'PAID' && !isFinal && (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run('refund', 'Tandai dana sudah dikembalikan ke pembeli?')}
          className={button}
        >
          Tandai Refund
        </button>
      )}

      {error && <span className="text-[11px] text-danger">{error}</span>}
    </div>
  );
}
