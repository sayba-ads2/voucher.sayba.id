import { cn } from '@/lib/utils';
import type { FulfillmentStatus, PaymentStatus } from '@/types';

const FULFILLMENT_LABEL: Record<FulfillmentStatus, { text: string; tone: string }> = {
  WAITING_PAYMENT: { text: 'Menunggu Pembayaran', tone: 'bg-warning-soft text-warning' },
  QUEUED: { text: 'Dalam Antrean', tone: 'bg-sky-50 text-sky-700' },
  PROCESSING: { text: 'Sedang Diproses', tone: 'bg-sky-50 text-sky-700' },
  SUCCESS: { text: 'Berhasil', tone: 'bg-success-soft text-success' },
  FAILED: { text: 'Gagal', tone: 'bg-danger-soft text-danger' },
  REFUNDED: { text: 'Dana Dikembalikan', tone: 'bg-surface-3 text-fg-body' },
};

const PAYMENT_LABEL: Record<PaymentStatus, { text: string; tone: string }> = {
  PENDING: { text: 'Belum Dibayar', tone: 'bg-warning-soft text-warning' },
  PAID: { text: 'Lunas', tone: 'bg-success-soft text-success' },
  EXPIRED: { text: 'Kedaluwarsa', tone: 'bg-surface-3 text-fg-body' },
  CANCELLED: { text: 'Dibatalkan', tone: 'bg-surface-3 text-fg-body' },
  REFUNDED: { text: 'Dikembalikan', tone: 'bg-surface-3 text-fg-body' },
};

export function StatusBadge({
  status,
  kind = 'fulfillment',
  className,
}: {
  status: FulfillmentStatus | PaymentStatus;
  kind?: 'fulfillment' | 'payment';
  className?: string;
}) {
  const map = kind === 'payment' ? PAYMENT_LABEL : FULFILLMENT_LABEL;
  const item = (map as Record<string, { text: string; tone: string }>)[status] ?? {
    text: status,
    tone: 'bg-surface-3 text-fg-body',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
        item.tone,
        className,
      )}
    >
      {item.text}
    </span>
  );
}
